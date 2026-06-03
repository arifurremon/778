import { db } from "@/lib/db";

export type SecurityAuditAction =
  | "USER_LOGIN_SUCCESS"
  | "USER_LOGIN_FAILED"
  | "USER_LOGOUT"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET_SUCCESS"
  | "MFA_ENABLED"
  | "MFA_DISABLED";

type SecurityAuditPayload = {
  action: SecurityAuditAction;
  userId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown>;
};

/**
 * Persists security-sensitive auth events to AuditLog.
 * Uses adminId = userId for user-initiated events; falls back to a system id.
 */
export async function persistSecurityAuditEvent({
  action,
  userId,
  email,
  ipAddress,
  userAgent,
  details = {},
}: SecurityAuditPayload): Promise<void> {
  if (!userId) {
    return;
  }

  try {
    await db.auditLog.create({
      data: {
        adminId: userId,
        action,
        entityType: "Auth",
        entityId: userId,
        details: {
          email: email ?? null,
          ...details,
        },
        ipAddress: ipAddress?.split(",")[0]?.trim() || "unknown",
        userAgent: userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("[SECURITY_AUDIT] Failed to persist event:", action, error);
  }
}

export function getClientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
