import { afterEach, describe, expect, it, vi } from "vitest";

describe("feature-flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults async flags off without Inngest env", async () => {
    vi.stubEnv("INNGEST_EVENT_KEY", "");
    vi.stubEnv("INNGEST_SIGNING_KEY", "");
    vi.stubEnv("FEATURE_ASYNC_MAIL", "");
    const { isFeatureEnabled } = await import("@/lib/feature-flags");
    expect(isFeatureEnabled("asyncMail")).toBe(false);
    expect(isFeatureEnabled("redisCacheDirectory")).toBe(true);
  });

  it("respects explicit FEATURE_ASYNC_MAIL=true", async () => {
    vi.stubEnv("FEATURE_ASYNC_MAIL", "true");
    const { isFeatureEnabled } = await import("@/lib/feature-flags");
    expect(isFeatureEnabled("asyncMail")).toBe(true);
  });
});
