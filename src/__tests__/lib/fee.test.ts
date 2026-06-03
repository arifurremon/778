import { describe, expect, it } from "vitest";
import {
  decimalToNumber,
  formatFeeBdt,
  InvalidFeeError,
  parseFeeInput,
} from "@/lib/money/fee";
import { Prisma } from "@prisma/client";

describe("money/fee", () => {
  it("parses plain numeric strings", () => {
    expect(parseFeeInput("1500").toNumber()).toBe(1500);
  });

  it("parses formatted BDT strings", () => {
    expect(parseFeeInput("৳1,500").toNumber()).toBe(1500);
  });

  it("parses positive numbers", () => {
    expect(parseFeeInput(750.5).toNumber()).toBe(750.5);
  });

  it("rejects invalid values", () => {
    expect(() => parseFeeInput("free")).toThrow(InvalidFeeError);
    expect(() => parseFeeInput(0)).toThrow(InvalidFeeError);
  });

  it("formats BDT display values", () => {
    expect(formatFeeBdt(new Prisma.Decimal("1500.00"))).toBe("৳1,500");
    expect(formatFeeBdt(0)).toBe("Contact for quote");
  });

  it("converts decimal-like objects to numbers", () => {
    expect(decimalToNumber({ toNumber: () => 999 })).toBe(999);
  });
});
