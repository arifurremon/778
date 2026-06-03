import { Prisma } from "@prisma/client";
import { z } from "zod";

export type FeeInput = string | number | Prisma.Decimal;

export class InvalidFeeError extends Error {
  constructor(message = "Fee must be a positive amount.") {
    super(message);
    this.name = "InvalidFeeError";
  }
}

/** Strip currency symbols / commas and parse a BDT fee amount. */
export function parseFeeInput(input: FeeInput): Prisma.Decimal {
  if (input instanceof Prisma.Decimal) {
    if (input.isNegative()) throw new InvalidFeeError();
    return input.toDecimalPlaces(2);
  }

  if (typeof input === "number") {
    if (!Number.isFinite(input) || input <= 0) throw new InvalidFeeError();
    return new Prisma.Decimal(input.toFixed(2));
  }

  const cleaned = input.replace(/[^\d.]/g, "");
  if (!cleaned) throw new InvalidFeeError();

  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new InvalidFeeError();

  return new Prisma.Decimal(parsed.toFixed(2));
}

export function decimalToNumber(
  value: Prisma.Decimal | { toNumber(): number } | number | string | null | undefined
): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFeeInput(value).toNumber();
  return value.toNumber();
}

/** Display helper for UI — always prefixed with ৳ */
export function formatFeeBdt(
  value: Prisma.Decimal | { toNumber(): number } | number | string | null | undefined
): string {
  const amount = decimalToNumber(value);
  if (amount <= 0) return "Contact for quote";
  return `৳${amount.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export const feeZodField = z
  .union([
    z.number().positive("Fee must be a positive amount."),
    z.string().min(1, "Fee is required."),
  ])
  .transform((val, ctx) => {
    try {
      return parseFeeInput(val);
    } catch {
      ctx.addIssue({ code: "custom", message: "Fee must be a positive amount." });
      return z.NEVER;
    }
  });
