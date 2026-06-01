import { NextResponse } from "next/server";

type RateLimitResult = {
  success: boolean;
  reset?: number;
};

const RATE_LIMIT_TIMEOUT_MS = 2000;

/**
 * Enforces Upstash rate limits with production fail-closed semantics.
 * On Redis errors or timeouts in production, requests are rejected (429).
 */
export async function enforceRateLimit(
  limit: () => Promise<RateLimitResult>,
  logLabel: string,
  options?: { quotaExceededMessage?: string }
): Promise<NextResponse | null> {
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
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
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
