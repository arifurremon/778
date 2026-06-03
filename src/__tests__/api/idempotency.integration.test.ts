import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

vi.mock("@/lib/notification-service", () => ({
  sendNotification: vi.fn().mockResolvedValue(undefined),
  NotificationType: { NEW_ORDER: "NEW_ORDER" },
}));

vi.mock("@/lib/observability/sentry-spans", () => ({
  SentryFlows: { orderCreate: (_fn: () => Promise<unknown>) => _fn() },
}));

vi.mock("@/lib/observability/with-route-observability", () => ({
  withRouteObservability: (handler: unknown) => handler,
}));

vi.mock("@/lib/webhooks/delivery", () => ({
  emitWebhookEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => false),
  runRateLimit: vi.fn(async () => ({ success: true, limit: 5, remaining: 4, reset: Date.now() + 3600_000 })),
  rateLimiters: {
    orders: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

const mockRequireActiveMutation = vi.fn();
vi.mock("@/lib/session-guards", () => ({
  requireActiveMutation: (req: NextRequest) => mockRequireActiveMutation(req),
}));

import { POST } from "@/app/api/orders/route";

const SHOP_ID = "00000000-0000-4000-8000-000000000001";
const PRODUCT_ID = "00000000-0000-4000-8000-000000000002";

describe("Orders idempotency", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockRequireActiveMutation.mockResolvedValue({
      error: null,
      session: { user: { id: "buyer-1", name: "Buyer" } },
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "buyer-1",
      deletedAt: null,
      suspendedAt: null,
    });
    prismaMock.shop.findUnique.mockResolvedValue({ id: SHOP_ID, userId: "seller-1" });
    prismaMock.product.findUnique.mockResolvedValue({
      id: PRODUCT_ID,
      shopId: SHOP_ID,
      name: "Rice",
      price: { toNumber: () => 100 },
      inStock: true,
    });
    prismaMock.order.create.mockResolvedValue({
      id: "order-1",
      status: "PENDING",
      totalPrice: 100,
    });
    prismaMock.idempotencyRecord.findUnique.mockResolvedValue(null);
    prismaMock.idempotencyRecord.create.mockResolvedValue({ id: "idem-1" });
  });

  it("replays stored response for duplicate Idempotency-Key", async () => {
    const payload = {
      shopId: SHOP_ID,
      productId: PRODUCT_ID,
      phone: "01712345678",
      address: "Chattogram",
      quantity: 1,
    };
    const requestHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

    prismaMock.idempotencyRecord.findUnique.mockResolvedValue({
      requestHash,
      responseBody: { order: { id: "order-existing" } },
      statusCode: 201,
    });

    const req = new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "order-key-12345678",
        origin: "http://localhost",
        "x-csrf-token": "test",
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.order.id).toBe("order-existing");
    expect(res.headers.get("Idempotent-Replayed")).toBe("true");
    expect(prismaMock.order.create).not.toHaveBeenCalled();
  });
});
