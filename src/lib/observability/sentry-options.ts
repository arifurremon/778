import type { BrowserOptions, NodeOptions } from "@sentry/nextjs";

export function resolveSentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development"
  );
}

export function resolveTracesSampleRate(environment = resolveSentryEnvironment()): number {
  if (environment === "production") return 0.1;
  if (environment === "preview" || environment === "staging") return 0.5;
  return 1.0;
}

export function resolveProfilesSampleRate(environment = resolveSentryEnvironment()): number {
  if (environment === "production") return 0.05;
  if (environment === "preview" || environment === "staging") return 0.2;
  return 0;
}

export function buildBaseSentryOptions(): Pick<
  NodeOptions & BrowserOptions,
  "dsn" | "environment" | "tracesSampleRate" | "profilesSampleRate" | "debug"
> {
  const environment = resolveSentryEnvironment();

  return {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment,
    tracesSampleRate: resolveTracesSampleRate(environment),
    profilesSampleRate: resolveProfilesSampleRate(environment),
    debug: process.env.SENTRY_DEBUG === "true",
  };
}
