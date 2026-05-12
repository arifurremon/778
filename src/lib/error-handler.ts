import * as Sentry from "@sentry/nextjs";

export interface QueryError {
  message: string;
  code: string;
  statusCode: number;
}

export function logErrorToSentry(error: unknown, context?: Record<string, any>): void {
  // Do not log errors to Sentry if not in production or DSN is missing
  if (process.env.NODE_ENV !== "production") return;

  Sentry.withScope((scope) => {
    if (context) {
      // Filter out sensitive data from context before logging
      const sanitizedContext = { ...context };
      const sensitiveKeys = ["password", "token", "secret", "authorization"];
      
      Object.keys(sanitizedContext).forEach(key => {
        if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))) {
          sanitizedContext[key] = "[REDACTED]";
        }
      });
      
      scope.setExtras(sanitizedContext);
    }
    
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error));
    }
  });
}

export function formatAPIError(error: unknown): { code: string; message: string; statusCode: number } {
  if (error instanceof Error) {
    return {
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "production" ? "An internal server error occurred" : error.message,
      statusCode: 500,
    };
  }
  return {
    code: "UNKNOWN_ERROR",
    message: "An unknown error occurred",
    statusCode: 500,
  };
}

export function handleQueryError(error: unknown): QueryError {
  // This can be expanded to handle Prisma-specific error codes
  if (error && typeof error === 'object' && 'code' in error) {
    const err = error as any;
    if (err.code === 'P2002') {
      return {
        message: "A unique constraint violation occurred.",
        code: "UNIQUE_CONSTRAINT",
        statusCode: 409,
      };
    }
  }
  
  return {
    message: "A database query error occurred.",
    code: "QUERY_ERROR",
    statusCode: 500,
  };
}
