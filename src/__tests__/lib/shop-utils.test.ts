import { describe, expect, it } from "vitest";
import {
  formatShopPrice,
  getProductImage,
  getShopImage,
  parseShopPrice,
  toOrderProduct,
} from "@/lib/shop-utils";

describe("shop-utils", () => {
  it("formats numeric and string prices in BDT", () => {
    expect(formatShopPrice(1500)).toBe("৳1,500");
    expect(formatShopPrice("2500.50")).toBe("৳2,500.5");
  });

  it("parses prices for filtering", () => {
    expect(parseShopPrice("৳1,500")).toBe(1500);
    expect(parseShopPrice(999)).toBe(999);
  });

  it("falls back to placeholder images", () => {
    expect(getProductImage({ images: [] })).toBe("/city_background.png");
    expect(getShopImage({ user: { profileImage: null } })).toBe("/city_background.png");
  });

  it("maps API products into order modal shape", () => {
    expect(
      toOrderProduct(
        {
          id: "p1",
          name: "Headphones",
          description: "Test",
          price: 1200,
          images: ["/img.png"],
          inStock: true,
          category: "Electronics",
          createdAt: "2026-01-01",
        },
        "Tech Mart"
      )
    ).toEqual({
      id: "p1",
      name: "Headphones",
      image: "/img.png",
      price: "৳1,200",
      shopName: "Tech Mart",
    });
  });
});
