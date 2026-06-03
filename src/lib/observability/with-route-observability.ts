import { createRequestLogger } from "@/lib/observability/logger";
import { recordRequestMetric } from "@/lib/observability/metrics";
import type { NextRequest } from "next/server";

type RouteHandler<TArgs extends unknown[], TResult> = (
  req: NextRequest,
  ...args: TArgs
) => Promise<TResult>;

type ObservabilityOptions = {
  route: string;
};

export function withRouteObservability<TArgs extends unknown[], TResult extends Response>(
  handler: RouteHandler<TArgs, TResult>,
  options: ObservabilityOptions
): RouteHandler<TArgs, TResult> {
  return async (req: NextRequest, ...args: TArgs): Promise<TResult> => {
    const started = performance.now();
    const requestId = req.headers.get("x-request-id") ?? "unknown";
    const log = createRequestLogger({
      requestId,
      route: options.route,
    });

    log.info({ method: req.method }, "request started");

    try {
      const response = await handler(req, ...args);
      const durationMs = Math.round(performance.now() - started);
      const statusCode = "status" in response ? response.status : 200;

      recordRequestMetric({
        route: options.route,
        method: req.method,
        statusCode,
        durationMs,
        success: statusCode < 500,
      });

      log.info({ statusCode, durationMs }, "request completed");
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      const durationMs = Math.round(performance.now() - started);
      recordRequestMetric({
        route: options.route,
        method: req.method,
        statusCode: 500,
        durationMs,
        success: false,
      });
      log.error({ err: error, durationMs }, "request failed");
      throw error;
    }
  };
}
