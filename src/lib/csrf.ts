// Fixed: 11 — Added server-side CSRF validation utility.
import { NextRequest, NextResponse } from "next/server";

/**
 * Validates that a mutation request originated from the same application.
 * Checks for: (1) presence of x-csrf-token header, (2) Origin/Referer matches APP_URL.
 * This is defense-in-depth alongside session authentication.
 */
export function validateCsrfRequest(req: NextRequest): NextResponse | null {
  const csrfToken = req.headers.get("x-csrf-token");
  if (!csrfToken) {
    return NextResponse.json({ error: "Invalid request: missing CSRF token." }, { status: 403 });
  }
  
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  
  if (appUrl && origin && !origin.startsWith(appUrl)) {
    return NextResponse.json({ error: "Invalid request: origin mismatch." }, { status: 403 });
  }
  
  return null; // valid
}
