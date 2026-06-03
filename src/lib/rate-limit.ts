import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export function hasRedisConfigs(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export type RateLimitResult = {
  success: boolean;
  reset?: number;
  pending?: Promise<unknown>;
  limit?: number;
  remaining?: number;
};

type RateLimiterLike = {
  limit: (key: string) => Promise<RateLimitResult>;
};

export const redis = hasRedisConfigs()
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const isProduction = process.env.NODE_ENV === "production";

// Fallback used when Redis credentials are absent (e.g. local dev without .env).
const mockRatelimit = {
  limit: async () => ({
    success: true,
    pending: Promise.resolve(),
    limit: 100,
    remaining: 99,
    reset: Date.now() + 10_000,
  }),
};

// In production, missing Redis must fail closed rather than allow unlimited traffic.
const failClosedRatelimit = {
  limit: async () => ({
    success: false,
    pending: Promise.resolve(),
    limit: 0,
    remaining: 0,
    reset: Date.now() + 60_000,
  }),
};

function createLimiter(
  build: (redisClient: Redis) => ConstructorParameters<typeof Ratelimit>[0]
) {
  if (hasRedisConfigs() && redis) {
    return new Ratelimit(build(redis));
  }
  return isProduction ? failClosedRatelimit : mockRatelimit;
}

export const rateLimiters = {
  register: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
  })),
  signin: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(10, "15 m"),
    analytics: true,
  })),
  forgotPassword: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(3, "15 m"),
    analytics: true,
  })),
  resetPassword: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
  })),
  resendVerification: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    analytics: true,
  })),
  posts: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
  })),
  orders: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: true,
  })),
  messages: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: true,
  })),
  suggestions: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: true,
  })),
  contact: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(3, "15 m"),
    analytics: true,
  })),
  comments: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(30, "15 m"),
    analytics: true,
  })),
  reactions: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(60, "15 m"),
    analytics: true,
  })),
  neighbours: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
  })),
  neighbourActions: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    analytics: true,
  })),
  reviews: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: true,
  })),
  bookings: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
  })),
  shopRegistration: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    analytics: true,
  })),
  serviceRegistration: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    analytics: true,
  })),
  publicRead: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
  })),
  pusherAuth: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: true,
  })),
  admin: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
  })),
  profile: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(10, "15 m"),
    analytics: true,
  })),
  notifications: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(60, "15 m"),
    analytics: true,
  })),
  activity: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(60, "15 m"),
    analytics: true,
  })),
  blocks: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    analytics: true,
  })),
  account: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    analytics: true,
  })),
  savedPosts: createLimiter((redisClient) => ({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(30, "15 m"),
    analytics: true,
  })),
};

/**
 * Runs a rate-limit check with production fail-closed semantics.
 * - Missing Redis in production → throws (caller maps to 503).
 * - Redis/network errors → throws (caller maps to 503).
 */
export async function runRateLimit(
  limiter: RateLimiterLike,
  key: string
): Promise<RateLimitResult> {
  if (isProduction && !hasRedisConfigs()) {
    throw new Error("Rate limiting unavailable: Redis is not configured");
  }

  try {
    return await limiter.limit(key);
  } catch (err) {
    console.error("[RateLimit] limit() failed:", err);
    throw new Error("Rate limiting unavailable: Redis request failed");
  }
}
