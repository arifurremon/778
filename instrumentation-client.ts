import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
});

// Required by Next.js + Sentry to capture client-side router transition errors.
// Without this export, a build warning is emitted and navigation errors go uncaptured.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

