import { isAdminRole } from "@/lib/rbac";
import type { Role } from "@prisma/client";

/** Server-side: Google OAuth is registered only when both secrets are present. */
export function isGoogleOAuthEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

/**
 * Client-side flag for showing the Google button.
 * Set NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true when GOOGLE_* env vars are configured.
 */
export function isGoogleOAuthAvailableOnClient(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";
}

export type GoogleSignInDecision =
  | { allowed: true }
  | { allowed: false; redirect?: string; reason: string };

type GoogleSignInUser = {
  deletedAt?: Date | null;
  suspendedAt?: Date | null;
  role?: Role | null;
  isAdmin?: boolean;
  mfaEnabled?: boolean;
} | null;

/** Pure guard used by the Google signIn callback (unit-tested). */
export function evaluateGoogleSignIn(dbUser: GoogleSignInUser): GoogleSignInDecision {
  if (!dbUser) {
    return { allowed: true };
  }

  if (dbUser.deletedAt) {
    return { allowed: false, reason: "deleted" };
  }

  if (dbUser.suspendedAt) {
    return {
      allowed: false,
      redirect: "/login?error=AccessDenied",
      reason: "suspended",
    };
  }

  if (
    dbUser.mfaEnabled &&
    isAdminRole(dbUser.role, dbUser.isAdmin)
  ) {
    return {
      allowed: false,
      redirect: "/login?error=AccessDenied",
      reason: "admin_mfa_required",
    };
  }

  return { allowed: true };
}
