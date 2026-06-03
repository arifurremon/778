import { afterEach, describe, expect, it, vi } from "vitest";
import { enforceRateLimit } from "@/lib/rate-limit-request";

describe("enforceRateLimit", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns null when rate limit allows the request", async () => {
    const result = await enforceRateLimit(
      async () => ({ success: true }),
      "Test"
    );
    expect(result).toBeNull();
  });

  it("returns 429 when rate limit denies the request", async () => {
    const result = await enforceRateLimit(
      async () => ({ success: false, reset: Date.now() + 60_000, limit: 5, remaining: 0 }),
      "Test"
    );
    expect(result?.status).toBe(429);
    expect(result?.headers.get("X-RateLimit-Limit")).toBe("5");
    expect(result?.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("returns rate limit headers on success via checkRateLimit", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit-request");
    const outcome = await checkRateLimit(
      async () => ({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60_000 }),
      "Test"
    );
    expect(outcome.blocked).toBeNull();
    expect(outcome.headers["X-RateLimit-Limit"]).toBe("10");
    expect(outcome.headers["X-RateLimit-Remaining"]).toBe("9");
  });

  it("returns 503 in production when Redis is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const result = await enforceRateLimit(async () => ({ success: true }), "Test");
    expect(result?.status).toBe(503);
  });

  it("returns 503 in production when the limiter throws", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    const result = await enforceRateLimit(async () => {
      throw new Error("Redis unavailable");
    }, "Test");
    expect(result?.status).toBe(503);
  });

  it("allows development to continue when the limiter throws", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = await enforceRateLimit(async () => {
      throw new Error("Redis unavailable");
    }, "Test");
    expect(result).toBeNull();
  });
});
