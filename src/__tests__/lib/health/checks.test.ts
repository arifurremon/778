import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../../helpers/prisma-mock";

vi.mock("@/lib/cache", () => ({
  hasRedisConfigs: vi.fn(() => true),
  pingRedis: vi.fn().mockResolvedValue({ ok: true, details: "Redis responded to PING" }),
}));

import { pingRedis } from "@/lib/cache";
import {
  checkDatabaseHealth,
  checkRedisHealth,
  getHealthHttpStatus,
  runPublicHealthChecks,
} from "@/lib/health/checks";

describe("health checks", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.mocked(pingRedis).mockResolvedValue({ ok: true, details: "Redis responded to PING" });
  });

  it("returns pass when database responds", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const result = await checkDatabaseHealth(true);

    expect(result.status).toBe("pass");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("returns fail when database is unavailable", async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error("connection refused"));

    const result = await checkDatabaseHealth(true);

    expect(result.status).toBe("fail");
  });

  it("returns pass when redis responds", async () => {
    const result = await checkRedisHealth(true);
    expect(result.status).toBe("pass");
  });

  it("marks overall status degraded when only redis fails", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    vi.mocked(pingRedis).mockResolvedValue({ ok: false, details: "timeout" });

    const result = await runPublicHealthChecks();

    expect(result.status).toBe("degraded");
    expect(getHealthHttpStatus(result)).toBe(200);
  });

  it("marks overall status unhealthy when database fails", async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error("db down"));

    const result = await runPublicHealthChecks();

    expect(result.status).toBe("unhealthy");
    expect(getHealthHttpStatus(result)).toBe(503);
  });
});
