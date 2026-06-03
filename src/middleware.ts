import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { buildContentSecurityPolicy, generateCspNonce } from "@/lib/csp";
import { logApiRequest } from "@/lib/observability/logger";

const { auth } = NextAuth(authConfig);

function resolveRequestId(req: Request): string {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}

export default auth((req) => {
  const requestId = resolveRequestId(req);
  const nonce = generateCspNonce();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-request-id", requestId);

  const isDev = process.env.NODE_ENV === "development";
  const csp = buildContentSecurityPolicy(nonce, isDev);
  // Next.js reads CSP from the request during SSR to inject matching script nonces.
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("x-request-id", requestId);

  const pathname = req.nextUrl.pathname;
  const isLegacyApi =
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/v1/") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/openapi") &&
    pathname !== "/api/docs" &&
    !pathname.startsWith("/api/cron") &&
    !pathname.startsWith("/api/inngest") &&
    !pathname.startsWith("/api/uploadthing") &&
    !pathname.startsWith("/api/tunnel");

  if (isLegacyApi) {
    response.headers.set("Deprecation", "true");
    response.headers.set("Sunset", new Date("2026-12-31T00:00:00.000Z").toUTCString());
    response.headers.set("Link", '</api/v1>; rel="successor-version"');
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    logApiRequest({
      requestId,
      method: req.method,
      path: req.nextUrl.pathname,
    }).debug("incoming api request");
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth).*)",
  ],
};
