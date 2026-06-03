/**
 * Integration Tests — Product reviews API
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { GET as getReviews, POST as createReview } from "@/app/api/shops/[shopId]/reviews/route";
import { PATCH as patchReview } from "@/app/api/reviews/[reviewId]/route";

function makeGetRequest(shopId: string, productId = "general"): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/shops/${shopId}/reviews?productId=${productId}`
  );
}

function makePostRequest(shopId: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost:3000/api/shops/${shopId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
    body: JSON.stringify(body),
  });
}

function makePatchRequest(reviewId: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost:3000/api/reviews/${reviewId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
    body: JSON.stringify(body),
  });
}

function mockActiveUser(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId, name: "Test User" } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: userId,
    isAdmin: false,
    deletedAt: null,
    suspendedAt: null,
  });
}

const sampleShop = {
  id: "shop-1",
  userId: "seller-1",
  name: "Chattala Mart",
};

const sampleReview = {
  id: "review-1",
  shopId: "shop-1",
  scope: "general",
  productId: null,
  buyerId: testUsers.regular.id,
  orderId: "order-1",
  rating: 5,
  comment: "Excellent service",
  reply: null,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  buyer: {
    id: testUsers.regular.id,
    name: testUsers.regular.name,
    preferredName: null,
    profileImage: null,
    email: testUsers.regular.email,
  },
};

describe("Product reviews API — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
    prismaMock.notification.create.mockResolvedValue({});
    prismaMock.productReview.aggregate.mockResolvedValue({ _avg: { rating: 5 } });
    prismaMock.shop.update.mockResolvedValue({});
  });

  it("lists reviews for a shop", async () => {
    prismaMock.shop.findUnique.mockResolvedValue(sampleShop);
    prismaMock.productReview.findMany.mockResolvedValue([sampleReview]);

    const res = await getReviews(makeGetRequest("shop-1"), {
      params: Promise.resolve({ shopId: "shop-1" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reviews).toHaveLength(1);
    expect(body.averageRating).toBe(5);
  });

  it("creates a verified review and notifies the seller", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.shop.findUnique.mockResolvedValue(sampleShop);
    prismaMock.productReview.findUnique.mockResolvedValue(null);
    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1" });
    prismaMock.productReview.create.mockResolvedValue(sampleReview);

    const res = await createReview(
      makePostRequest("shop-1", {
        productId: "general",
        rating: 5,
        comment: "Excellent service",
      }),
      { params: Promise.resolve({ shopId: "shop-1" }) }
    );

    expect(res.status).toBe(201);
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.notification.create).toHaveBeenCalled();
  });

  it("prevents reviewing your own shop", async () => {
    mockActiveUser("seller-1");
    prismaMock.shop.findUnique.mockResolvedValue(sampleShop);

    const res = await createReview(
      makePostRequest("shop-1", {
        productId: "general",
        rating: 5,
        comment: "Excellent service",
      }),
      { params: Promise.resolve({ shopId: "shop-1" }) }
    );

    expect(res.status).toBe(400);
  });

  it("allows shop owner to reply to a review", async () => {
    mockActiveUser("seller-1");
    prismaMock.productReview.findUnique.mockResolvedValue({
      id: "review-1",
      buyerId: testUsers.regular.id,
      shop: {
        userId: "seller-1",
        name: "Chattala Mart",
      },
    });
    prismaMock.productReview.update.mockResolvedValue({
      ...sampleReview,
      reply: "Thank you for shopping with us!",
    });

    const res = await patchReview(
      makePatchRequest("review-1", { reply: "Thank you for shopping with us!" }),
      { params: Promise.resolve({ reviewId: "review-1" }) }
    );

    expect(res.status).toBe(200);
    expect(prismaMock.notification.create).toHaveBeenCalled();
  });
});
