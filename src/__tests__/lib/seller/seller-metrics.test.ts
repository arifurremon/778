import { describe, expect, it } from "vitest";
import {
  calculateDeliveredRevenueTrend,
  formatTrendPercent,
} from "@/lib/seller/seller-metrics";

describe("seller-metrics", () => {
  const now = new Date("2026-06-15T12:00:00.000Z");

  it("calculates revenue growth from delivered orders", () => {
    const trend = calculateDeliveredRevenueTrend(
      [
        {
          price: 1000,
          status: "Delivered",
          createdAt: "2026-06-10T10:00:00.000Z",
        },
        {
          price: 500,
          status: "Delivered",
          createdAt: "2026-05-20T10:00:00.000Z",
        },
        {
          price: 200,
          status: "Pending",
          createdAt: "2026-06-12T10:00:00.000Z",
        },
      ],
      now
    );

    expect(trend).toBe(100);
    expect(formatTrendPercent(trend)).toBe("+100%");
  });

  it("returns 0 when no delivered orders exist", () => {
    expect(calculateDeliveredRevenueTrend([], now)).toBe(0);
  });
});
