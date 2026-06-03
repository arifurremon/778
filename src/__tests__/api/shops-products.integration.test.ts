/**
 * Integration Tests — /api/shops/[shopId]/products
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({ logErrorToSentry: vi.fn() }));

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

import { GET, POST } from "@/app/api/shops/[shopId]/products/route";

const shopId = "shop-001";

const sampleProduct = {
  id: "product-1",
  name: "Wireless Earbuds",
  description: "Noise cancelling earbuds",
  price: { toNumber: () => 1500 },
  originalPrice: null,
  images: ["https://example.com/earbuds.jpg"],
  inStock: true,
  category: "Electronics",
  createdAt: new Date(),
};

function mockOwnerSession(userId = testUsers.regular.id) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: userId,
    role: "USER",
    deletedAt: null,
    suspendedAt: null,
  });
}

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost:3000/api/shops/${shopId}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
    body: JSON.stringify(body),
  });
}

describe("/api/shops/[shopId]/products — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  describe("GET", () => {
    it("returns 404 when shop does not exist", async () => {
      prismaMock.shop.findUnique.mockResolvedValue(null);

      const res = await GET(
        new NextRequest(`http://localhost/api/shops/${shopId}/products`),
        { params: Promise.resolve({ shopId }) }
      );
      expect(res.status).toBe(404);
    });

    it("returns products for a shop", async () => {
      prismaMock.shop.findUnique.mockResolvedValue({ id: shopId });
      prismaMock.product.findMany.mockResolvedValue([sampleProduct]);

      const res = await GET(
        new NextRequest(`http://localhost/api/shops/${shopId}/products?inStock=true`),
        { params: Promise.resolve({ shopId }) }
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.products).toHaveLength(1);
      expect(json.products[0].price).toBe(1500);
    });
  });

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await POST(makePostRequest({ name: "Test" }), {
        params: Promise.resolve({ shopId }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 403 when user does not own the shop", async () => {
      mockOwnerSession("other-user");
      prismaMock.shop.findUnique.mockResolvedValue({ userId: testUsers.regular.id });

      const res = await POST(
        makePostRequest({
          name: "New Product",
          description: "A useful local product.",
          price: 500,
          images: ["https://example.com/product.jpg"],
          category: "Groceries",
        }),
        { params: Promise.resolve({ shopId }) }
      );
      expect(res.status).toBe(403);
    });

    it("creates a product for shop owner", async () => {
      mockOwnerSession();
      prismaMock.shop.findUnique.mockResolvedValue({ userId: testUsers.regular.id });
      prismaMock.product.create.mockResolvedValue(sampleProduct);

      const res = await POST(
        makePostRequest({
          name: "New Product",
          description: "A useful local product.",
          price: 500,
          images: ["https://example.com/product.jpg"],
          category: "Groceries",
        }),
        { params: Promise.resolve({ shopId }) }
      );

      expect(res.status).toBe(201);
    });
  });
});
