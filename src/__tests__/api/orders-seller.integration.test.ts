import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({ logErrorToSentry: vi.fn() }));

const mockRequireActiveSession = vi.fn();
vi.mock("@/lib/session-guards", () => ({
  requireActiveSession: () => mockRequireActiveSession(),
}));

import { GET } from "@/app/api/orders/seller/route";

describe("GET /api/orders/seller — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockRequireActiveSession.mockResolvedValue({
      error: null,
      session: { user: { id: testUsers.regular.id } },
    });
  });

  it("returns 403 when user has no shop", async () => {
    prismaMock.shop.findUnique.mockResolvedValue(null);

    const res = await GET(new NextRequest("http://localhost/api/orders/seller"));
    expect(res.status).toBe(403);
  });

  it("returns seller orders for shop owner", async () => {
    prismaMock.shop.findUnique.mockResolvedValue({ id: "shop-1" });
    prismaMock.order.findMany.mockResolvedValue([
      {
        id: "order-1",
        shopId: "shop-1",
        productId: "product-1",
        buyerId: testUsers.regular.id,
        buyerName: "Buyer",
        buyerPhone: "01712345678",
        status: "PENDING",
        totalPrice: { toNumber: () => 100 },
        quantity: 1,
        address: "Chattogram",
        note: null,
        createdAt: new Date(),
        product: { name: "Rice", images: [] },
        buyer: { email: "buyer@test.com" },
      },
    ]);
    prismaMock.order.count.mockResolvedValue(1);

    const res = await GET(new NextRequest("http://localhost/api/orders/seller"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orders).toHaveLength(1);
    expect(json.total).toBe(1);
  });
});
