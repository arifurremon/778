import { auth } from "@/lib/auth";
import { validateCsrfRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * Requires an authenticated user that is not soft-deleted or suspended.
 * Use for privileged API routes instead of trusting the JWT alone.
 */
export async function requireActiveUser() {
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
      isAdmin: true,
      deletedAt: true,
      suspendedAt: true,
    },
  });

  if (!dbUser || dbUser.deletedAt) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Account not found or deleted" },
        { status: 403 }
      ),
    };
  }

  if (dbUser.suspendedAt) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Account suspended" },
        { status: 403 }
      ),
    };
  }

  return { session, dbUser };
}

/** CSRF + active-user check for cookie-authenticated mutations. */
export async function requireActiveMutation(req: NextRequest) {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) {
    return { error: csrfError };
  }
  return requireActiveUser();
}

