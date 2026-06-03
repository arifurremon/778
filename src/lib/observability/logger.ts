import pino, { type Logger } from "pino";

export type LogContext = {
  requestId?: string;
  userId?: string;
  route?: string;
};

const baseLogger: Logger =
  process.env.NODE_ENV === "test"
    ? pino({ level: "silent" })
    : pino({
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
        base: {
          service: "thechattala",
          environment:
            process.env.SENTRY_ENVIRONMENT ??
            process.env.VERCEL_ENV ??
            process.env.NODE_ENV ??
            "development",
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        redact: {
          paths: [
            "password",
            "token",
            "secret",
            "authorization",
            "req.headers.authorization",
            "req.headers.cookie",
          ],
          censor: "[REDACTED]",
        },
      });

export const logger = baseLogger;

export function createRequestLogger(context: LogContext): Logger {
  return baseLogger.child({
    requestId: context.requestId,
    userId: context.userId,
    route: context.route,
  });
}

export function logApiRequest(input: {
  requestId: string;
  method: string;
  path: string;
  userId?: string;
}): Logger {
  return createRequestLogger({
    requestId: input.requestId,
    userId: input.userId,
    route: `${input.method} ${input.path}`,
  });
}
