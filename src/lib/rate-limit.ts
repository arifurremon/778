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

// Fallback used when Redis credentials are absent (e.g. local dev without .env).
// All requests are allowed through — rate limiting is effectively disabled.
// Never deploy to production without UPSTASH_REDIS_REST_URL/TOKEN set.
const mockRatelimit = {
  limit: async () => ({
    success: true,
    pending: Promise.resolve(),
    limit: 100,
    remaining: 99,
    reset: Date.now() + 10_000,
  }),
};

export const rateLimiters = {
  // Keyed by IP. 5 registration attempts per 15 minutes per IP.
  register: hasRedisConfigs
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        analytics: true,
      })
    : mockRatelimit,

  // Keyed by composite `${ip}:${email}` (constructed in src/lib/auth.ts).
  // 10 attempts per 15 minutes per unique ip+account pair.
  // See auth.ts authorize() for the full rationale on the composite key.
  signin: hasRedisConfigs
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(10, "15 m"),
        analytics: true,
      })
    : mockRatelimit,

  // Keyed by IP. 3 attempts per 15 minutes.
  forgotPassword: hasRedisConfigs
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(3, "15 m"),
        analytics: true,
      })
    : mockRatelimit,

  // Keyed by IP. 5 attempts per 15 minutes.
  resetPassword: hasRedisConfigs
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        analytics: true,
      })
    : mockRatelimit,

  // Keyed by IP. 3 attempts per hour.
  resendVerification: hasRedisConfigs
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        analytics: true,
      })
    : mockRatelimit,

  // Keyed by user ID. 10 posts per hour per authenticated user.
  posts: hasRedisConfigs
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        analytics: true,
      })
    : mockRatelimit,
};
