/**
 * Integration Tests — GET/PATCH /api/shops/[shopId]
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => true),
  runRateLimit: vi.fn(
    (limiter: { limit: (key: string) => Promise<{ success: boolean }> }, key: string) =>
      limiter.limit(key)
  ),
  rateLimiters: {
    shopRegistration: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Import AFTER mocks
import { GET, PATCH } from "@/app/api/shops/[shopId]/route";

function makeGetRequest(shopId: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/shops/${shopId}`, {
    method: "GET",
  });
}

const sampleShop = {
  id: "shop-1",
  name: "Chattala Tech Mart",
  description: "Trusted electronics shop in Chittagong.",
  category: "Electronics",
  location: "Panchlaish",
  trustScore: 100,
  rating: 5,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: {
    id: "user-1",
    name: "Owner",
    preferredName: null,
    username: "owner",
    profileImage: null,
    isVerified: true,
  },
  products: [
    {
      id: "product-1",
      name: "Wireless Earbuds",
      description: "Noise cancelling earbuds",
      price: "1500.00",
      originalPrice: null,
      images: ["/city_background.png"],
      inStock: true,
      category: "Electronics",
      createdAt: new Date(),
    },
  ],
};

describe("GET /api/shops/[shopId] — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  it("returns 404 when shop does not exist", async () => {
    prismaMock.shop.findUnique.mockResolvedValue(null);

    const res = await GET(makeGetRequest("missing-shop"), {
      params: Promise.resolve({ shopId: "missing-shop" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns shop with products and owner info", async () => {
    prismaMock.shop.findUnique.mockResolvedValue(sampleShop);

    const res = await GET(makeGetRequest("shop-1"), {
      params: Promise.resolve({ shopId: "shop-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.id).toBe("shop-1");
    expect(json.products).toHaveLength(1);
    expect(json.user.username).toBe("owner");
    expect(prismaMock.shop.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "shop-1" },
      })
    );
  });
});

describe("PATCH /api/shops/[shopId] — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  function mockOwnerSession(userId = testUsers.regular.id) {
    mockAuth.mockResolvedValue({ user: { id: userId } });
    prismaMock.user.findUnique.mockResolvedValue({
      id: userId,
      role: "USER",
      deletedAt: null,
      suspendedAt: null,
    });
  }

  function makePatchRequest(body: Record<string, unknown>): NextRequest {
    return new NextRequest("http://localhost:3000/api/shops/shop-1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        origin: "http://localhost:3000",
        "x-csrf-token": "test-csrf-token",
      },
      body: JSON.stringify(body),
    });
  }

  it("returns 403 when user does not own the shop", async () => {
    mockOwnerSession("other-user");
    prismaMock.shop.findUnique.mockResolvedValue({ id: "shop-1", userId: testUsers.regular.id });

    const res = await PATCH(makePatchRequest({ name: "Updated Shop Name" }), {
      params: Promise.resolve({ shopId: "shop-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("updates shop details for owner", async () => {
    mockOwnerSession();
    prismaMock.shop.findUnique.mockResolvedValue({ id: "shop-1", userId: testUsers.regular.id });
    prismaMock.shop.update.mockResolvedValue({
      id: "shop-1",
      name: "Updated Shop Name",
      description: sampleShop.description,
      category: sampleShop.category,
      location: sampleShop.location,
      trustScore: 100,
      rating: 5,
      isVerified: true,
      updatedAt: new Date(),
    });

    const res = await PATCH(makePatchRequest({ name: "Updated Shop Name" }), {
      params: Promise.resolve({ shopId: "shop-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.name).toBe("Updated Shop Name");
  });
});
