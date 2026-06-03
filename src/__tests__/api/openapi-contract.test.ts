/**
 * Phase 9.3 — OpenAPI-aligned contract tests for top public endpoints.
 * Validates response JSON shape (not full OpenAPI response validation).
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
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
  invalidateCache: vi.fn(),
  hasRedisConfigs: vi.fn(() => false),
  pingRedis: vi.fn().mockResolvedValue({ ok: false, details: "unavailable" }),
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { generateOpenApiDocument } from "@/lib/openapi/generate";
import { GET as healthGET } from "@/app/api/health/route";
import { GET as shopsGET } from "@/app/api/shops/route";
import { GET as servicesGET } from "@/app/api/services/route";
import { GET as directoryGET } from "@/app/api/directory/route";
import { GET as emergencyGET } from "@/app/api/emergency/route";
import { GET as openapiGET } from "@/app/api/openapi.json/route";

const healthSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  checks: z.object({
    database: z.object({ status: z.string() }),
    redis: z.object({ status: z.string() }),
  }),
});

const paginatedListSchema = z.object({
  nextPage: z.number().nullable(),
  total: z.number(),
});

const shopsSchema = paginatedListSchema.extend({
  shops: z.array(z.object({ id: z.string(), name: z.string() })),
});

const servicesSchema = paginatedListSchema.extend({
  services: z.array(z.object({ id: z.string(), profession: z.string() })),
});

const directorySchema = z.object({
  type: z.string(),
  entries: z.array(z.record(z.unknown())),
});

const emergencySchema = z.object({
  contacts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      phone: z.string(),
      category: z.string(),
    })
  ),
});

describe("OpenAPI contract — top endpoints", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.mocked(prismaMock.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);
  });

  it("OpenAPI document matches registered public paths", () => {
    const doc = generateOpenApiDocument();
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.paths?.["/api/health"]).toBeDefined();
    expect(doc.paths?.["/api/shops"]?.get).toBeDefined();
    expect(doc.paths?.["/api/orders"]?.post).toBeDefined();
  });

  it("GET /api/openapi.json returns valid OpenAPI document", async () => {
    const res = await openapiGET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.openapi).toBe("3.1.0");
    expect(json.info.title).toBe("The Chattala API");
  });

  it("GET /api/health contract", async () => {
    const res = await healthGET(new NextRequest("http://localhost/api/health"));
    const json = await res.json();
    expect(healthSchema.safeParse(json).success).toBe(true);
  });

  it("GET /api/shops contract", async () => {
    prismaMock.shop.findMany.mockResolvedValue([
      { id: "s1", name: "Test Shop", description: "d", category: "Grocery", location: "CTG", trustScore: 100, rating: 5, isVerified: true, createdAt: new Date(), user: { id: "u1", name: "Owner", username: "owner", profileImage: null, isVerified: false }, _count: { products: 1 } },
    ]);
    prismaMock.shop.count.mockResolvedValue(1);

    const res = await shopsGET(new NextRequest("http://localhost/api/shops"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(shopsSchema.safeParse(json).success).toBe(true);
  });

  it("GET /api/services contract", async () => {
    prismaMock.expertService.findMany.mockResolvedValue([
      {
        id: "e1",
        profession: "Doctor",
        category: "Health",
        location: "CTG",
        experienceYears: 5,
        fee: "1000",
        bio: "Bio text here for testing purposes only",
        qualifications: ["MBBS"],
        rating: 5,
        createdAt: new Date(),
        user: { id: "u1", name: "Expert", preferredName: null, username: "expert", profileImage: null, isVerified: true },
      },
    ]);
    prismaMock.expertService.count.mockResolvedValue(1);

    const res = await servicesGET(new NextRequest("http://localhost/api/services"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(servicesSchema.safeParse(json).success).toBe(true);
  });

  it("GET /api/directory contract", async () => {
    prismaMock.directoryEntry.findMany.mockResolvedValue([
      { id: "d1", type: "tourism", name: "Patenga", category: "Beach", phone: null, address: null, website: null, description: null, metadata: {} },
    ]);

    const res = await directoryGET(new NextRequest("http://localhost/api/directory?type=tourism"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(directorySchema.safeParse(json).success).toBe(true);
  });

  it("GET /api/emergency contract", async () => {
    prismaMock.emergencyContact.findMany.mockResolvedValue([
      { id: "ec1", name: "Fire Service", phone: "199", category: "Emergency", location: null, description: null, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const res = await emergencyGET(new NextRequest("http://localhost/api/emergency"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(emergencySchema.safeParse(json).success).toBe(true);
  });
});
