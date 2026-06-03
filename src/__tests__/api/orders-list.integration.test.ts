import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({ logErrorToSentry: vi.fn() }));

const mockRequireActiveUser = vi.fn();
vi.mock("@/lib/session-guards", () => ({
  requireActiveUser: () => mockRequireActiveUser(),
}));

import { GET } from "@/app/api/orders/route";

describe("GET /api/orders — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockRequireActiveUser.mockResolvedValue({
      error: null,
      session: { user: { id: testUsers.regular.id } },
    });
  });

  it("returns buyer orders with pagination metadata", async () => {
    prismaMock.order.findMany.mockResolvedValue([
      {
        id: "order-1",
        status: "PENDING",
        shop: { name: "Test Shop" },
        product: { name: "Rice", images: [] },
      },
    ]);
    prismaMock.order.count.mockResolvedValue(1);

    const res = await GET(new NextRequest("http://localhost/api/orders?page=1&limit=10"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orders).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
  });

  it("filters by valid order status", async () => {
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.order.count.mockResolvedValue(0);

    const res = await GET(new NextRequest("http://localhost/api/orders?status=PENDING"));
    expect(res.status).toBe(200);
    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ buyerId: testUsers.regular.id, status: "PENDING" }),
      })
    );
  });

  it("returns 400 for invalid order status", async () => {
    const res = await GET(new NextRequest("http://localhost/api/orders?status=NOT_A_STATUS"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Invalid order status");
    expect(prismaMock.order.findMany).not.toHaveBeenCalled();
  });
});
