import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

/** At least one digit or common symbol — aligned with register API policy. */
export const PASSWORD_SYMBOL_REGEX = /[0-9!@#$%^&*(),.?":{}|<>_]/;

export const PASSWORD_MIN_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;

export const PASSWORD_SYMBOL_MESSAGE =
  "Password must contain at least one number or symbol.";

/** Password policy for registration, reset, and password change flows. */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_MIN_MESSAGE)
  .regex(PASSWORD_SYMBOL_REGEX, PASSWORD_SYMBOL_MESSAGE);

/** Login accepts existing credentials; only require non-empty input. */
export const loginPasswordSchema = z.string().min(1, "Password is required.");

export function passwordsMatchRefine<T extends { password: string; confirmPassword: string }>(
  data: T
): boolean {
  return data.password === data.confirmPassword;
}

export const PASSWORDS_MISMATCH_MESSAGE = "Passwords don't match";
