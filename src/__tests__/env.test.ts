import { afterEach, describe, expect, it, vi } from "vitest";
import { validateServerEnv } from "@/env";

describe("validateServerEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires NEXT_PUBLIC_APP_URL in production runtime", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/db");
    vi.stubEnv("AUTH_SECRET", "a".repeat(32));
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    expect(() => validateServerEnv()).toThrow(/NEXT_PUBLIC_APP_URL/);
  });
});
