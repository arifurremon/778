import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/cache", () => ({
  hasRedisConfigs: vi.fn(() => true),
  pingRedis: vi.fn().mockResolvedValue({ ok: true, details: "Redis responded to PING" }),
}));

import { pingRedis } from "@/lib/cache";
import { GET } from "@/app/api/health/route";

describe("GET /api/health — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.mocked(pingRedis).mockResolvedValue({ ok: true, details: "Redis responded to PING" });
  });

  it("returns 200 with healthy status when dependencies pass", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const res = await GET(new NextRequest("http://localhost:3000/api/health"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("healthy");
    expect(json.checks.database.status).toBe("pass");
    expect(json.checks.redis.status).toBe("pass");
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("returns 503 when database is unavailable", async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error("database unavailable"));

    const res = await GET(new NextRequest("http://localhost:3000/api/health"));
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.status).toBe("unhealthy");
  });

  it("returns 200 degraded when redis fails but database passes", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    vi.mocked(pingRedis).mockResolvedValue({ ok: false, details: "timeout" });

    const res = await GET(new NextRequest("http://localhost:3000/api/health"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("degraded");
  });
});
