import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasRedisConfigs = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

export const redis = hasRedisConfigs
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
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
  if (hasRedisConfigs && redis) {
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
};
