/**
 * Integration Tests — POST /api/shops
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => true),
  runRateLimit: vi.fn(
    (limiter: { limit: (key: string) => Promise<{ success: boolean }> }, key: string) =>
      limiter.limit(key)
  ),
  rateLimiters: {
    register: { limit: vi.fn().mockResolvedValue({ success: true }) },
    signin: { limit: vi.fn().mockResolvedValue({ success: true }) },
    posts: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

vi.mock("@/lib/cache", () => ({
  cachedQuery: vi.fn((_key: string, fn: () => Promise<unknown>) => fn()),
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

// Import AFTER mocks
import { POST } from "@/app/api/shops/route";

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/shops", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
    body: JSON.stringify(body),
  });
}

function mockActiveUser(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: userId,
    role: "USER",
    deletedAt: null,
    suspendedAt: null,
  });
}

const validShopPayload = {
  name: "Chattala Tech Mart",
  description: "Trusted electronics and accessories shop in Chittagong.",
  category: "Electronics",
  location: "Panchlaish, Agrabad",
  payoutMethod: "BKASH",
  registrationDetails: {
    businessEmail: "shop@example.com",
    businessPhone: "01712345678",
    nidNumber: "1234567890",
  },
};

const createdShop = {
  id: "shop-1",
  name: validShopPayload.name,
  description: validShopPayload.description,
  category: validShopPayload.category,
  location: validShopPayload.location,
  trustScore: 100,
  rating: 5,
  isVerified: false,
  createdAt: new Date(),
  user: {
    id: testUsers.regular.id,
    name: testUsers.regular.name,
    username: testUsers.regular.username,
    profileImage: null,
    isVerified: false,
  },
  _count: { products: 0 },
};

describe("POST /api/shops — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  it("returns 401 when user is unauthenticated", async () => {
    const res = await POST(makePostRequest(validShopPayload));
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    mockActiveUser(testUsers.regular.id);

    const res = await POST(makePostRequest({ name: "A" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBeTruthy();
  });

  it("returns 409 when user already has a shop", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.shop.findUnique.mockResolvedValue({ id: "existing-shop" });

    const res = await POST(makePostRequest(validShopPayload));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain("already have a registered shop");
  });

  it("creates a shop and sets registrationStatus to PENDING", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.shop.findUnique.mockResolvedValue(null);
    prismaMock.shop.create.mockResolvedValue(createdShop);
    prismaMock.user.update.mockResolvedValue({});

    const res = await POST(makePostRequest(validShopPayload));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.id).toBe("shop-1");
    expect(prismaMock.shop.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: testUsers.regular.id,
          name: validShopPayload.name,
          payoutMethod: "BKASH",
          registrationDetails: validShopPayload.registrationDetails,
        }),
      })
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: testUsers.regular.id },
      data: { registrationStatus: "PENDING" },
    });
  });
});
