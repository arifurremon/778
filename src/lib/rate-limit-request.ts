import { hasRedisConfigs, runRateLimit, type RateLimitResult } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const RATE_LIMIT_TIMEOUT_MS = 2000;

export type RateLimitHeaders = Record<string, string>;

export function buildRateLimitHeaders(result: RateLimitResult): RateLimitHeaders {
  const headers: RateLimitHeaders = {};
  if (result.limit !== undefined) {
    headers["X-RateLimit-Limit"] = String(result.limit);
  }
  if (result.remaining !== undefined) {
    headers["X-RateLimit-Remaining"] = String(Math.max(0, result.remaining));
  }
  if (result.reset !== undefined) {
    headers["X-RateLimit-Reset"] = String(Math.ceil(result.reset / 1000));
  }
  return headers;
}

function rateLimitUnavailableResponse(): NextResponse {
  return NextResponse.json(
    { error: "Service temporarily unavailable. Please try again later." },
    { status: 503, headers: { "Retry-After": "60" } }
  );
}

export type RateLimitSuccess = {
  blocked: null;
  headers: RateLimitHeaders;
};

export type RateLimitFailure = {
  blocked: NextResponse;
  headers: RateLimitHeaders;
};

export type RateLimitOutcome = RateLimitSuccess | RateLimitFailure;

/**
 * Enforces Upstash rate limits with production fail-closed semantics.
 * - Missing Redis in production → 503
 * - Redis errors / timeouts in production → 503
 * - Quota exceeded → 429
 */
export async function enforceRateLimit(
  limit: () => Promise<RateLimitResult>,
  logLabel: string,
  options?: { quotaExceededMessage?: string }
): Promise<NextResponse | null> {
  const outcome = await checkRateLimit(limit, logLabel, options);
  return outcome.blocked;
}

export async function checkRateLimit(
  limit: () => Promise<RateLimitResult>,
  logLabel: string,
  options?: { quotaExceededMessage?: string }
): Promise<RateLimitOutcome> {
  if (process.env.NODE_ENV === "production" && !hasRedisConfigs()) {
    console.error(`[${logLabel}] Rate limit unavailable: missing Upstash env`);
    return { blocked: rateLimitUnavailableResponse(), headers: {} };
  }

  let result: RateLimitResult = { success: true };

  try {
    result = await Promise.race([
      limit(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Rate limit timeout")), RATE_LIMIT_TIMEOUT_MS)
      ),
    ]);
  } catch (err) {
    console.error(`[${logLabel}] Rate limit error:`, err);
    if (process.env.NODE_ENV === "production") {
      return { blocked: rateLimitUnavailableResponse(), headers: {} };
    }
    return { blocked: null, headers: {} };
  }

  const headers = buildRateLimitHeaders(result);

  if (!result.success) {
    const retryAfterSec = result.reset
      ? Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
      : 60;
    return {
      blocked: NextResponse.json(
        {
          error:
            options?.quotaExceededMessage ??
            "Too many attempts. Please try again later.",
        },
        {
          status: 429,
          headers: { ...headers, "Retry-After": String(retryAfterSec) },
        }
      ),
      headers,
    };
  }

  return { blocked: null, headers };
}

export function jsonWithRateLimitHeaders(
  data: unknown,
  init: ResponseInit | undefined,
  rateLimitHeaders: RateLimitHeaders
): NextResponse {
  const headers = new Headers(init?.headers);
  for (const [key, value] of Object.entries(rateLimitHeaders)) {
    headers.set(key, value);
  }
  return NextResponse.json(data, { ...init, headers });
}

export { runRateLimit };
