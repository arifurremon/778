import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash Redis credentials exist
const hasRedisConfigs = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// Create a singleton Redis instance if configs exist
export const redis = hasRedisConfigs ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
}) : null;

// Mock rate limiter for fallback when Redis is not configured
const mockRatelimit = {
  limit: async () => ({ success: true, pending: Promise.resolve(), limit: 100, remaining: 99, reset: Date.now() + 10000 }),
};

// Define rate limiters
export const rateLimiters = {
  // 5 attempts per 15 minutes by IP
  register: hasRedisConfigs ? new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
  }) : mockRatelimit,

  // 10 attempts per 15 minutes by IP
  signin: hasRedisConfigs ? new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(10, "15 m"),
    analytics: true,
  }) : mockRatelimit,

  // 10 posts per hour by user ID
  posts: hasRedisConfigs ? new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
  }) : mockRatelimit,
};
