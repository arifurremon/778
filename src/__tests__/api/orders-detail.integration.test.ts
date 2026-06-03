/**
 * Integration Tests — PATCH /api/orders/[orderId]
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({ logErrorToSentry: vi.fn() }));

vi.mock("@/lib/notification-service", () => ({
  sendNotification: vi.fn().mockResolvedValue(undefined),
  NotificationType: { ORDER_UPDATED: "ORDER_UPDATED" },
}));

vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => true),
  runRateLimit: vi.fn(
    (limiter: { limit: (key: string) => Promise<{ success: boolean }> }, key: string) =>
      limiter.limit(key)
  ),
  rateLimiters: {
    orders: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { PATCH } from "@/app/api/orders/[orderId]/route";
import { sendNotification } from "@/lib/notification-service";

const orderId = "order-001";
const sellerId = "seller-001";

const pendingOrder = {
  id: orderId,
  buyerId: testUsers.regular.id,
  status: "PENDING",
  shop: { userId: sellerId },
  product: { name: "Basmati Rice" },
};

function mockSellerSession() {
  mockAuth.mockResolvedValue({ user: { id: sellerId } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: sellerId,
    role: "USER",
    deletedAt: null,
    suspendedAt: null,
  });
}

function makePatchRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost:3000/api/orders/${orderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/orders/[orderId] — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await PATCH(makePatchRequest({ status: "PROCESSING" }), {
      params: Promise.resolve({ orderId }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 when order does not exist", async () => {
    mockSellerSession();
    prismaMock.order.findUnique.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ status: "PROCESSING" }), {
      params: Promise.resolve({ orderId }),
    });
    expect(res.status).toBe(404);
  });

  it("allows seller to move PENDING to PROCESSING", async () => {
    mockSellerSession();
    prismaMock.order.findUnique.mockResolvedValue(pendingOrder);
    prismaMock.order.update.mockResolvedValue({ ...pendingOrder, status: "PROCESSING" });

    const res = await PATCH(makePatchRequest({ status: "PROCESSING" }), {
      params: Promise.resolve({ orderId }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.order.status).toBe("PROCESSING");
    expect(sendNotification).toHaveBeenCalled();
  });

  it("returns 403 when buyer tries a non-cancel status", async () => {
    mockAuth.mockResolvedValue({ user: { id: testUsers.regular.id } });
    prismaMock.user.findUnique.mockResolvedValue({
      id: testUsers.regular.id,
      role: "USER",
      deletedAt: null,
      suspendedAt: null,
    });
    prismaMock.order.findUnique.mockResolvedValue(pendingOrder);

    const res = await PATCH(makePatchRequest({ status: "PROCESSING" }), {
      params: Promise.resolve({ orderId }),
    });
    expect(res.status).toBe(403);
  });

  it("allows buyer to cancel a pending order", async () => {
    mockAuth.mockResolvedValue({ user: { id: testUsers.regular.id } });
    prismaMock.user.findUnique.mockResolvedValue({
      id: testUsers.regular.id,
      role: "USER",
      deletedAt: null,
      suspendedAt: null,
    });
    prismaMock.order.findUnique.mockResolvedValue(pendingOrder);
    prismaMock.order.update.mockResolvedValue({ ...pendingOrder, status: "CANCELLED" });

    const res = await PATCH(makePatchRequest({ status: "CANCELLED" }), {
      params: Promise.resolve({ orderId }),
    });
    expect(res.status).toBe(200);
  });
});
