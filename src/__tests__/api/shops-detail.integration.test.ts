/**
 * Integration Tests — GET /api/shops/[shopId]
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

// Import AFTER mocks
import { GET } from "@/app/api/shops/[shopId]/route";

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
