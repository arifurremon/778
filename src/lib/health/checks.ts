import { hasRedisConfigs, pingRedis } from "@/lib/cache";
import { db } from "@/lib/db";

export type HealthStatus = "pass" | "fail" | "warn";

export type ServiceCheck = {
  status: HealthStatus;
  latencyMs: number;
  message?: string;
};

export type PublicHealthResult = {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  checks: {
    database: ServiceCheck;
    redis: ServiceCheck;
  };
};

const APP_VERSION = process.env.npm_package_version ?? "1.0.0";

export async function checkDatabaseHealth(detailed = false): Promise<ServiceCheck> {
  const started = performance.now();
  try {
    await db.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - started);
    return {
      status: "pass",
      latencyMs,
      ...(detailed && { message: "Database responded to SELECT 1" }),
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - started);
    return {
      status: "fail",
      latencyMs,
      message: detailed
        ? error instanceof Error
          ? error.message
          : "Database ping failed"
        : "unavailable",
    };
  }
}

export async function checkRedisHealth(detailed = false): Promise<ServiceCheck> {
  const started = performance.now();

  if (!hasRedisConfigs()) {
    return {
      status: "fail",
      latencyMs: Math.round(performance.now() - started),
      message: detailed ? "Redis environment variables are missing" : "unconfigured",
    };
  }

  const result = await pingRedis();
  const latencyMs = Math.round(performance.now() - started);

  return {
    status: result.ok ? "pass" : "fail",
    latencyMs,
    message: detailed ? result.details : result.ok ? "ok" : "unavailable",
  };
}

export async function runPublicHealthChecks(): Promise<PublicHealthResult> {
  const [database, redis] = await Promise.all([
    checkDatabaseHealth(false),
    checkRedisHealth(false),
  ]);

  let status: PublicHealthResult["status"] = "healthy";
  if (database.status === "fail") {
    status = "unhealthy";
  } else if (redis.status === "fail") {
    status = "degraded";
  }

  return {
    status,
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    checks: { database, redis },
  };
}

export function getHealthHttpStatus(result: PublicHealthResult): number {
  if (result.checks.database.status === "fail") return 503;
  return 200;
}
