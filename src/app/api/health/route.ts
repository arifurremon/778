import { getHealthHttpStatus, runPublicHealthChecks } from "@/lib/health/checks";
import { createRequestLogger } from "@/lib/observability/logger";
import { recordRequestMetric } from "@/lib/observability/metrics";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/health — public uptime probe (DB + Redis, no auth) */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const started = performance.now();
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  const log = createRequestLogger({ requestId, route: "GET /api/health" });

  try {
    const result = await runPublicHealthChecks();
    const durationMs = Math.round(performance.now() - started);
    const httpStatus = getHealthHttpStatus(result);

    recordRequestMetric({
      route: "GET /api/health",
      method: "GET",
      statusCode: httpStatus,
      durationMs,
      success: httpStatus < 500,
    });

    log.info(
      {
        status: result.status,
        durationMs,
        databaseLatencyMs: result.checks.database.latencyMs,
        redisLatencyMs: result.checks.redis.latencyMs,
      },
      "health check completed"
    );

    return NextResponse.json(result, {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    const durationMs = Math.round(performance.now() - started);
    recordRequestMetric({
      route: "GET /api/health",
      method: "GET",
      statusCode: 503,
      durationMs,
      success: false,
    });
    log.error({ err: error, durationMs }, "health check failed");

    return NextResponse.json(
      {
        status: "unhealthy",
        version: process.env.npm_package_version ?? "1.0.0",
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: "fail", latencyMs: durationMs, message: "unavailable" },
          redis: { status: "fail", latencyMs: 0, message: "unavailable" },
        },
      },
      { status: 503, headers: { "x-request-id": requestId } }
    );
  }
}
