import {
  evaluateGoogleSignIn,
  isGoogleOAuthAvailableOnClient,
  isGoogleOAuthEnabled,
} from "@/lib/auth-providers";
import { afterEach, describe, expect, it } from "vitest";

describe("auth-providers", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("isGoogleOAuthEnabled", () => {
    it("returns false when credentials are missing", () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      expect(isGoogleOAuthEnabled()).toBe(false);
    });

    it("returns true when both credentials are set", () => {
      process.env.GOOGLE_CLIENT_ID = "client-id.apps.googleusercontent.com";
      process.env.GOOGLE_CLIENT_SECRET = "secret";
      expect(isGoogleOAuthEnabled()).toBe(true);
    });
  });

  describe("isGoogleOAuthAvailableOnClient", () => {
    it("returns true only when NEXT_PUBLIC flag is set", () => {
      process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED = "true";
      expect(isGoogleOAuthAvailableOnClient()).toBe(true);

      process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED = "false";
      expect(isGoogleOAuthAvailableOnClient()).toBe(false);
    });
  });

  describe("evaluateGoogleSignIn", () => {
    it("allows new users", () => {
      expect(evaluateGoogleSignIn(null)).toEqual({ allowed: true });
    });

    it("blocks deleted accounts", () => {
      expect(
        evaluateGoogleSignIn({
          deletedAt: new Date(),
          suspendedAt: null,
          mfaEnabled: false,
        })
      ).toEqual({ allowed: false, reason: "deleted" });
    });

    it("blocks suspended accounts with redirect", () => {
      expect(
        evaluateGoogleSignIn({
          deletedAt: null,
          suspendedAt: new Date(),
          mfaEnabled: false,
        })
      ).toEqual({
        allowed: false,
        redirect: "/login?error=AccessDenied",
        reason: "suspended",
      });
    });

    it("blocks MFA-enabled admin accounts", () => {
      expect(
        evaluateGoogleSignIn({
          deletedAt: null,
          suspendedAt: null,
          role: "ADMIN",
          isAdmin: true,
          mfaEnabled: true,
        })
      ).toEqual({
        allowed: false,
        redirect: "/login?error=AccessDenied",
        reason: "admin_mfa_required",
      });
    });

    it("allows regular active users", () => {
      expect(
        evaluateGoogleSignIn({
          deletedAt: null,
          suspendedAt: null,
          mfaEnabled: false,
        })
      ).toEqual({ allowed: true });
    });
  });
});
