import type { NextRequest } from "next/server";

/**
 * Extract the leftmost client IP from x-forwarded-for (first trusted hop).
 */
export function getClientIp(req: NextRequest | Request): string {
  const raw =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "";
  const ip = raw.split(",")[0]?.trim();
  return ip || "unknown";
}
