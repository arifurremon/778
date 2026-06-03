import { buildBaseSentryOptions } from "@/lib/observability/sentry-options";
import * as Sentry from "@sentry/nextjs";

Sentry.init(buildBaseSentryOptions());

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
