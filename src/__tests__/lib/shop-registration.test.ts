import { describe, expect, it } from "vitest";
import {
  mapShopRegistrationToApiPayload,
  resolveShopCategory,
  resolveShopLocation,
} from "@/lib/shop-registration";

describe("shop-registration helpers", () => {
  it("maps custom category when Others is selected", () => {
    expect(
      resolveShopCategory({
        categories: ["Others"],
        customCategory: "Organic Foods",
      })
    ).toBe("Organic Foods");
  });

  it("joins selected categories into a single category string", () => {
    expect(
      resolveShopCategory({
        categories: ["Grocery", "Pharmacy"],
      })
    ).toBe("Grocery, Pharmacy");
  });

  it("uses storefront address when offline shop is enabled", () => {
    expect(
      resolveShopLocation({
        isOffline: true,
        address: "House 12, Road 4, Panchlaish",
        deliveryAreas: ["Agrabad"],
      })
    ).toBe("House 12, Road 4, Panchlaish");
  });

  it("maps the full registration form to the shop API payload", () => {
    const payload = mapShopRegistrationToApiPayload({
      businessName: "Chattala Tech Mart",
      description: "Trusted electronics and accessories shop in Chittagong.",
      categories: ["Electronics"],
      businessEmail: "shop@example.com",
      businessPhone: "01712345678",
      isOffline: false,
      deliveryAreas: ["Panchlaish", "Agrabad"],
      outsideCity: false,
      deliveryMethod: "Self",
      codAvailable: true,
      deliveryTimeline: "Within 24 hours",
      nidNumber: "1234567890",
      hasTradeLicense: false,
      declaresAdultContent: true,
      payoutMethod: "bKash",
      payoutDetails: "01712345678",
    });

    expect(payload).toEqual({
      name: "Chattala Tech Mart",
      description: "Trusted electronics and accessories shop in Chittagong.",
      category: "Electronics",
      location: "Panchlaish, Agrabad",
      payoutMethod: "BKASH",
      registrationDetails: expect.objectContaining({
        businessEmail: "shop@example.com",
        businessPhone: "01712345678",
        nidNumber: "1234567890",
        payoutDetails: "01712345678",
      }),
    });
  });
});
