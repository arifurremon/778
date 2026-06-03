import { describe, expect, it } from "vitest";
import {
  PASSWORD_MIN_LENGTH,
  passwordSchema,
  loginPasswordSchema,
} from "@/lib/validation/password";

describe("passwordSchema", () => {
  it("accepts strong passwords", () => {
    expect(passwordSchema.safeParse("Secure1!").success).toBe(true);
    expect(passwordSchema.safeParse("abcdefgh1").success).toBe(true);
  });

  it("rejects passwords shorter than minimum", () => {
    const result = passwordSchema.safeParse("Ab1!");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toContain(String(PASSWORD_MIN_LENGTH));
    }
  });

  it("rejects passwords without number or symbol", () => {
    const result = passwordSchema.safeParse("abcdefgh");
    expect(result.success).toBe(false);
  });
});

describe("loginPasswordSchema", () => {
  it("requires non-empty password for login", () => {
    expect(loginPasswordSchema.safeParse("").success).toBe(false);
    expect(loginPasswordSchema.safeParse("legacy-password").success).toBe(true);
  });
});
