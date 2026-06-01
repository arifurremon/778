import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateServerEnv } = await import("./env");
    validateServerEnv();
    await import("../sentry.server.config");
  }
  // Edge runtime: no sentry.edge.config.ts — omit to avoid import error
}

// Captures errors thrown inside nested React Server Components.
// Required by Next.js 15 instrumentation API; without this RSC errors go unreported.
export const onRequestError = Sentry.captureRequestError;
