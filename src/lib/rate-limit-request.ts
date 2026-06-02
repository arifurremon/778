import { hasRedisConfigs, runRateLimit, type RateLimitResult } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const RATE_LIMIT_TIMEOUT_MS = 2000;

function rateLimitUnavailableResponse(): NextResponse {
  return NextResponse.json(
    { error: "Service temporarily unavailable. Please try again later." },
    { status: 503, headers: { "Retry-After": "60" } }
  );
}

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
  if (process.env.NODE_ENV === "production" && !hasRedisConfigs()) {
    console.error(`[${logLabel}] Rate limit unavailable: missing Upstash env`);
    return rateLimitUnavailableResponse();
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
      return rateLimitUnavailableResponse();
    }
    return null;
  }

  if (!result.success) {
    const retryAfterSec = result.reset
      ? Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
      : 60;
    return NextResponse.json(
      {
        error:
          options?.quotaExceededMessage ??
          "Too many attempts. Please try again later.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      }
    );
  }

  return null;
}

export { runRateLimit };
