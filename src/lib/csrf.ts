import { NextRequest, NextResponse } from "next/server";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getAllowedOrigin(req: NextRequest): string {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!configuredAppUrl) return req.nextUrl.origin;

  try {
    return new URL(configuredAppUrl).origin;
  } catch {
    return req.nextUrl.origin;
  }
}

function getRequestSourceOrigin(req: NextRequest): string | null {
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source) return null;

  try {
    return new URL(source).origin;
  } catch {
    return null;
  }
}

/**
 * Validates browser-originated mutation requests before route handlers consume
 * the request body. This is a strict same-origin guard plus a custom header
 * requirement, so forged cross-site form posts cannot mutate cookie-backed
 * sessions.
 */
export function validateCsrfRequest(req: NextRequest): NextResponse | null {
  if (!MUTATION_METHODS.has(req.method.toUpperCase())) return null;

  const csrfToken = req.headers.get("x-csrf-token");
  if (!csrfToken) {
    return NextResponse.json({ error: "Invalid request: missing CSRF token." }, { status: 403 });
  }

  const requestOrigin = getRequestSourceOrigin(req);
  if (!requestOrigin) {
    return NextResponse.json({ error: "Invalid request: missing request origin." }, { status: 403 });
  }

  const allowedOrigin = getAllowedOrigin(req);
  if (requestOrigin !== allowedOrigin) {
    return NextResponse.json({ error: "Invalid request: origin mismatch." }, { status: 403 });
  }

  return null;
}
