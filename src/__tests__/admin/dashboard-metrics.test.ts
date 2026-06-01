import { describe, expect, it } from "vitest";
import { calculateGrowthPercent, parseTimeRange } from "@/lib/admin/dashboard-metrics";

describe("dashboard-metrics", () => {
  describe("parseTimeRange", () => {
    it("defaults to 30d", () => {
      expect(parseTimeRange(undefined)).toEqual({ key: "30d", days: 30 });
    });

    it("parses supported ranges", () => {
      expect(parseTimeRange("7d")).toEqual({ key: "7d", days: 7 });
      expect(parseTimeRange("1y")).toEqual({ key: "1y", days: 365 });
    });
  });

  describe("calculateGrowthPercent", () => {
    it("returns 100 when previous is zero and current is positive", () => {
      expect(calculateGrowthPercent(5, 0)).toBe(100);
    });

    it("returns 0 when both are zero", () => {
      expect(calculateGrowthPercent(0, 0)).toBe(0);
    });

    it("calculates rounded percent change", () => {
      expect(calculateGrowthPercent(15, 10)).toBe(50);
      expect(calculateGrowthPercent(5, 10)).toBe(-50);
    });
  });
});
