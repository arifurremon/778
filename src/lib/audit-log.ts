import * as Sentry from "@sentry/nextjs";

type AuditAction = 
  | "USER_LOGIN" 
  | "USER_LOGOUT" 
  | "USER_REGISTER" 
  | "DATA_MODIFICATION";

interface AuditLogPayload {
  action: AuditAction;
  userId: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
}

export function logAuditEvent({
  action,
  userId,
  resourceId,
  resourceType,
  metadata
}: AuditLogPayload) {
  // We can write to an audit table in the DB, but for now we'll send it as a breadcrumb or event
  // to our monitoring system to ensure critical paths are trackable without exposing PII.

  if (process.env.NODE_ENV !== "production") {
    // We intentionally removed console.logs in production, but in development it's useful to see these
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("audit_action", action);
    scope.setTag("user_id", userId);
    
    if (resourceType) scope.setTag("resource_type", resourceType);
    if (resourceId) scope.setTag("resource_id", resourceId);

    const safeMetadata = { ...metadata };
    
    // Filter sensitive info
    if (safeMetadata.password) safeMetadata.password = "[REDACTED]";
    if (safeMetadata.token) safeMetadata.token = "[REDACTED]";

    scope.setExtras(safeMetadata);
    
    // Using captureMessage for audit logs rather than exceptions
    Sentry.captureMessage(`Audit: ${action}`, "info");
  });
}
