import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// ---------------------------------------------------------------------------
// Security Headers
// ---------------------------------------------------------------------------
const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://res.cloudinary.com https://utfs.io",
  ].join("; "),
};

export default auth((req) => {
  // NOTE: Auth.js v5 handles CSRF validation itself for OAuth and credentials flows.
  // Custom CSRF validation in middleware interferes with /api/auth/callback/* routes.
  // Removing custom CSRF logic allows Auth.js to manage security properly.
  
  const res = NextResponse.next();

  // Apply Security Headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  return res;
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and auth API routes
    // Auth routes MUST NOT be intercepted by custom middleware logic
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth).*)",
  ],
};

