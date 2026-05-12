import * as Sentry from "@sentry/nextjs";
import { db } from "./db";

export type AuditAction = 
  | "VERIFY_SHOP" 
  | "REJECT_SHOP" 
  | "SUSPEND_SHOP" 
  | "DELETE_SHOP" 
  | "VERIFY_SERVICE"
  | "REJECT_SERVICE"
  | "SUSPEND_SERVICE"
  | "DELETE_SERVICE"
  | "UPDATE_USER" 
  | "SUSPEND_USER" 
  | "DELETE_USER" 
  | "PROMOTE_USER" 
  | "HIDE_POST" 
  | "DELETE_POST" 
  | "UPDATE_SETTINGS" 
  | "TOGGLE_MAINTENANCE"
  | "USER_LOGIN" 
  | "USER_LOGOUT" 
  | "USER_REGISTER" 
  | "DATA_MODIFICATION"
  | "UPDATE_SHOP"
  | "UPDATE_SERVICE"; // Catch-all for API updates

interface AuditLogPayload {
  action: AuditAction;
  userId: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
}

// Legacy user audit event
export function logAuditEvent({
  action,
  userId,
  resourceId,
  resourceType,
  metadata
}: AuditLogPayload) {
  if (process.env.NODE_ENV !== "production") return;

  Sentry.withScope((scope) => {
    scope.setTag("audit_action", action);
    scope.setTag("user_id", userId);
    
    if (resourceType) scope.setTag("resource_type", resourceType);
    if (resourceId) scope.setTag("resource_id", resourceId);

    const safeMetadata = { ...metadata };
    if (safeMetadata.password) safeMetadata.password = "[REDACTED]";
    if (safeMetadata.token) safeMetadata.token = "[REDACTED]";

    scope.setExtras(safeMetadata);
    Sentry.captureMessage(`Audit: ${action}`, "info");
  });
}

/**
 * Logs an administrative action to the database.
 * Fire-and-forget pattern.
 */
export async function logAdminAction(
  adminId: string,
  action: string, // Accept string to be schema-safe since we use some other values in APIs
  entityType: string,
  entityId: string,
  details: Record<string, any>,
  ipAddress: string | null = null,
  userAgent: string | null = null
): Promise<void> {
  try {
    // SCHEMA-FALLBACK: 'auditLog' model may not exist — verify schema
    // @ts-ignore
    if (!db.auditLog) {
      console.warn("[AUDIT_LOG_FALLBACK]: AuditLog model missing in Prisma schema. Skipping log.", { action, entityId });
      return;
    }

    // @ts-ignore
    await db.auditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
        userAgent,
      }
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR]: Failed to save admin action log", error);
    // Do not throw error, maintain fire-and-forget
  }
}
