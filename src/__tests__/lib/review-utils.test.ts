import { describe, expect, it } from "vitest";
import { mapApiProductReview, normalizeReviewScope } from "@/lib/review-utils";

describe("review-utils", () => {
  it("normalizes general product scope", () => {
    expect(normalizeReviewScope("general")).toBe("general");
    expect(normalizeReviewScope("product-123")).toBe("product-123");
  });

  it("maps API review to UI review shape", () => {
    const mapped = mapApiProductReview({
      id: "review-1",
      shopId: "shop-1",
      scope: "general",
      productId: null,
      buyerId: "buyer-1",
      orderId: "order-1",
      rating: 4,
      comment: "Great shop",
      reply: "Thanks!",
      isVerified: true,
      createdAt: "2026-06-07T10:00:00.000Z",
      updatedAt: "2026-06-07T10:00:00.000Z",
      buyer: {
        id: "buyer-1",
        name: "Rahim",
        preferredName: null,
        profileImage: null,
        email: "rahim@example.com",
      },
    });

    expect(mapped.productId).toBe("general");
    expect(mapped.userName).toBe("Rahim");
    expect(mapped.isVerified).toBe(true);
    expect(mapped.reply).toBe("Thanks!");
  });
});
