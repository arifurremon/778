import { afterEach, describe, expect, it, vi } from "vitest";
import { productionRuntimeEnvSchema, validateServerEnv } from "@/env";

describe("validateServerEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function stubProductionCore() {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/db");
    vi.stubEnv("AUTH_SECRET", "a".repeat(32));
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
  }

  it("requires NEXT_PUBLIC_APP_URL in production runtime", () => {
    stubProductionCore();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    expect(() => validateServerEnv()).toThrow(/NEXT_PUBLIC_APP_URL/);
  });

  it("requires DATABASE_URL in production runtime", () => {
    stubProductionCore();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.thechattala.com");
    vi.stubEnv("DATABASE_URL", "");

    expect(() => validateServerEnv()).toThrow(/DATABASE_URL/);
  });

  it("skips strict checks during production build phase", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    expect(() => validateServerEnv()).not.toThrow();
  });

  it("skips strict checks in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    expect(() => validateServerEnv()).not.toThrow();
  });

  it("accepts a complete production env via productionRuntimeEnvSchema", () => {
    const result = productionRuntimeEnvSchema.safeParse({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://localhost:5432/db",
      AUTH_SECRET: "a".repeat(32),
      NEXT_PUBLIC_APP_URL: "https://www.thechattala.com",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
    });
    expect(result.success).toBe(true);
  });
});
