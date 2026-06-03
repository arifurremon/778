import { auth } from "@/lib/auth";
import { isAdminRole, isElevatedAdminRole } from "@/lib/rbac";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { validateCsrfRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import type { Role } from "@prisma/client";

const MFA_ENFORCED =
  process.env.ADMIN_MFA_REQUIRED === "true" ||
  (process.env.NODE_ENV === "production" && process.env.ADMIN_MFA_REQUIRED !== "false");

type AdminDbUser = {
  id: string;
  role: Role;
  mfaEnabled: boolean;
  deletedAt: Date | null;
  suspendedAt: Date | null;
};

/**
 * Ensures the current request belongs to an active administrator.
 * DB role is the source of truth — JWT claims are not trusted.
 */
export async function requireAdmin(options?: { skipMfaCheck?: boolean }) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      mfaEnabled: true,
      deletedAt: true,
      suspendedAt: true,
    },
  }) as AdminDbUser | null;

  if (!dbUser) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Account not found" },
        { status: 403 }
      ),
    };
  }

  if (dbUser.deletedAt || dbUser.suspendedAt) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Account not active" },
        { status: 403 }
      ),
    };
  }

  if (!isAdminRole(dbUser.role)) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    };
  }

  if (
    MFA_ENFORCED &&
    !options?.skipMfaCheck &&
    !dbUser.mfaEnabled &&
    isElevatedAdminRole(dbUser.role)
  ) {
    return {
      error: NextResponse.json(
        {
          error: "Multi-factor authentication setup required for admin access.",
          code: "MFA_REQUIRED",
        },
        { status: 403 }
      ),
    };
  }

  return { session, dbUser };
}

/** CSRF + admin check + rate limit for admin mutations. */
export async function requireAdminMutation(req: NextRequest) {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) {
    return { error: csrfError };
  }

  const admin = await requireAdmin();
  if (admin.error) return admin;

  const rateLimitResponse = await enforceRateLimit(
    () => runRateLimit(rateLimiters.admin, admin.session.user.id),
    "AdminMutation",
    { quotaExceededMessage: "Admin action rate limit reached (60/min)." }
  );
  if (rateLimitResponse) {
    return { error: rateLimitResponse };
  }

  return admin;
}
