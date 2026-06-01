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
      async () => ({ success: false, reset: Date.now() + 60_000 }),
      "Test"
    );
    expect(result?.status).toBe(429);
  });

  it("fails closed in production when the limiter throws", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = await enforceRateLimit(async () => {
      throw new Error("Redis unavailable");
    }, "Test");
    expect(result?.status).toBe(429);
  });

  it("allows development to continue when the limiter throws", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = await enforceRateLimit(async () => {
      throw new Error("Redis unavailable");
    }, "Test");
    expect(result).toBeNull();
  });
});
