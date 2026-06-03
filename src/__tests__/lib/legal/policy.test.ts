import { describe, expect, it } from "vitest";
import {
  CURRENT_POLICY_VERSION,
  userNeedsPolicyReconsent,
} from "@/lib/legal/policy";

describe("legal policy helpers", () => {
  it("requires re-consent when policy version is missing or stale", () => {
    expect(userNeedsPolicyReconsent(null)).toBe(true);
    expect(userNeedsPolicyReconsent(undefined)).toBe(true);
    expect(userNeedsPolicyReconsent("0.9.0")).toBe(true);
  });

  it("does not require re-consent on current version", () => {
    expect(userNeedsPolicyReconsent(CURRENT_POLICY_VERSION)).toBe(false);
  });
});
