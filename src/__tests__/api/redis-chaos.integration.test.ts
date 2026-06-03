/**
 * Phase 9.4 — Chaos: Redis unavailable → public read routes must not 500.
 */
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({ logErrorToSentry: vi.fn() }));

vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => false),
  runRateLimit: vi.fn(async () => ({ success: true, limit: 60, remaining: 59, reset: Date.now() + 60_000 })),
  rateLimiters: {
    publicRead: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

vi.mock("@/lib/cache", () => ({
  cachedQuery: vi.fn(async (_key: string, fetcher: () => Promise<unknown>) => fetcher()),
  hasRedisConfigs: vi.fn(() => false),
  pingRedis: vi.fn().mockResolvedValue({ ok: false, details: "Redis unavailable" }),
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { GET as directoryGET } from "@/app/api/directory/route";
import { GET as emergencyGET } from "@/app/api/emergency/route";
import { GET as shopsGET } from "@/app/api/shops/route";
import { GET as healthGET } from "@/app/api/health/route";

describe("Redis chaos — graceful degradation on read routes", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    resetPrismaMock();
    prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    prismaMock.directoryEntry.findMany.mockResolvedValue([]);
    prismaMock.emergencyContact.findMany.mockResolvedValue([]);
    prismaMock.shop.findMany.mockResolvedValue([]);
    prismaMock.shop.count.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("GET /api/directory returns 200 without Redis", async () => {
    const res = await directoryGET(new NextRequest("http://localhost/api/directory"));
    expect(res.status).toBe(200);
    expect(res.status).toBeLessThan(500);
  });

  it("GET /api/emergency returns 200 without Redis", async () => {
    const res = await emergencyGET(new NextRequest("http://localhost/api/emergency"));
    expect(res.status).toBe(200);
  });

  it("GET /api/shops returns 200 without Redis (cache miss → DB)", async () => {
    const res = await shopsGET(new NextRequest("http://localhost/api/shops"));
    expect(res.status).toBe(200);
  });

  it("GET /api/health returns degraded (not 500) when Redis is down", async () => {
    const res = await healthGET(new NextRequest("http://localhost/api/health"));
    const json = await res.json();
    expect(res.status).toBeLessThan(500);
    expect(["healthy", "degraded"]).toContain(json.status);
  });
});
