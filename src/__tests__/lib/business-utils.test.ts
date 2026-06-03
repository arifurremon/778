import { describe, expect, it } from "vitest";
import {
  formatOrderAmount,
  mapApiOrderStatusToUi,
  mapApiSellerOrder,
  mapApiSellerProduct,
  mapUiOrderStatusToApi,
} from "@/lib/business-utils";

describe("business-utils", () => {
  it("maps UI order statuses to API enums", () => {
    expect(mapUiOrderStatusToApi("Sent")).toBe("SHIPPED");
    expect(mapUiOrderStatusToApi("Delivered")).toBe("DELIVERED");
  });

  it("maps API order statuses to UI labels", () => {
    expect(mapApiOrderStatusToUi("SHIPPED")).toBe("Sent");
    expect(mapApiOrderStatusToUi("PENDING")).toBe("Pending");
  });

  it("maps seller order payloads for the dashboard", () => {
    const mapped = mapApiSellerOrder({
      id: "order-1",
      shopId: "shop-1",
      productId: "product-1",
      buyerId: "buyer-1",
      buyerName: "Rahim",
      buyerPhone: "01712345678",
      status: "PENDING",
      quantity: 1,
      totalPrice: 1500,
      address: "Panchlaish",
      createdAt: "2026-01-01T10:00:00.000Z",
      product: { name: "Headphones", images: ["/img.png"] },
      buyer: { email: "buyer@example.com" },
    });

    expect(mapped.productName).toBe("Headphones");
    expect(mapped.status).toBe("Pending");
    expect(mapped.buyerEmail).toBe("buyer@example.com");
    expect(mapped.price).toBe(1500);
  });

  it("maps seller products and formats currency", () => {
    expect(
      mapApiSellerProduct(
        {
          id: "p1",
          name: "Rice",
          description: "Premium rice",
          price: 1200,
          images: ["/rice.png"],
          inStock: true,
          category: "Grocery",
          createdAt: "2026-01-01",
        },
        "shop-1"
      ).shopId
    ).toBe("shop-1");

    expect(formatOrderAmount(2500)).toBe("৳2,500");
  });
});
