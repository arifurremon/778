import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("cache (no Redis configured)", () => {
  it("cachedQuery falls through to fetcher when Redis is unavailable", async () => {
    const { cachedQuery } = await import("@/lib/cache");
    const fetcher = vi.fn().mockResolvedValue({ items: [1] });

    const result = await cachedQuery("test-key", fetcher);

    expect(result).toEqual({ items: [1] });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("invalidateCache is a no-op without Redis", async () => {
    const { invalidateCache } = await import("@/lib/cache");
    await expect(invalidateCache("posts")).resolves.toBeUndefined();
  });

  it("hasRedisConfigs reflects missing env in test runtime", async () => {
    const { hasRedisConfigs } = await import("@/lib/cache");
    expect(hasRedisConfigs()).toBe(false);
  });

  it("pingRedis reports missing configuration", async () => {
    const { pingRedis } = await import("@/lib/cache");
    const result = await pingRedis();
    expect(result.ok).toBe(false);
    expect(result.details).toContain("missing");
  });
});

describe("cache (mocked Redis)", () => {
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockIncr = vi.fn();
  const mockPing = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    mockGet.mockReset();
    mockSet.mockReset();
    mockIncr.mockReset();
    mockPing.mockReset();
    mockPing.mockResolvedValue("PONG");

    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");

    vi.doMock("@upstash/redis", () => ({
      Redis: {
        fromEnv: vi.fn(() => ({
          get: mockGet,
          set: mockSet,
          incr: mockIncr,
          ping: mockPing,
        })),
      },
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@upstash/redis");
  });

  it("cachedQuery returns cached JSON on hit (versioned namespace key)", async () => {
    mockGet
      .mockResolvedValueOnce(2) // namespace version
      .mockResolvedValueOnce(JSON.stringify({ cached: true }));

    const { cachedQuery } = await import("@/lib/cache");
    const fetcher = vi.fn().mockResolvedValue({ cached: false });

    const result = await cachedQuery("page:1", fetcher, 300, "posts");

    expect(result).toEqual({ cached: true });
    expect(fetcher).not.toHaveBeenCalled();
    expect(mockGet).toHaveBeenCalledWith("posts:v2:page:1");
  });

  it("cachedQuery stores fresh data on miss", async () => {
    mockGet.mockResolvedValueOnce(1).mockResolvedValueOnce(null);

    const { cachedQuery } = await import("@/lib/cache");
    const fetcher = vi.fn().mockResolvedValue({ fresh: true });

    const result = await cachedQuery("page:2", fetcher, 120, "shops");

    expect(result).toEqual({ fresh: true });
    expect(mockSet).toHaveBeenCalledWith(
      "shops:v1:page:2",
      JSON.stringify({ fresh: true }),
      { ex: 120 }
    );
  });

  it("invalidateCache bumps namespace version counters", async () => {
    mockIncr.mockResolvedValue(3);

    const { invalidateCache } = await import("@/lib/cache");
    await invalidateCache("posts", "shops");

    expect(mockIncr).toHaveBeenCalledWith("posts:v");
    expect(mockIncr).toHaveBeenCalledWith("shops:v");
  });

  it("pingRedis returns ok when Redis responds PONG", async () => {
    const { pingRedis, hasRedisConfigs } = await import("@/lib/cache");
    expect(hasRedisConfigs()).toBe(true);

    const result = await pingRedis();
    expect(result.ok).toBe(true);
    expect(result.details).toContain("Redis responded");
  });
});
