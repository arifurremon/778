import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// ---------------------------------------------------------------------------
// Security Headers
// ---------------------------------------------------------------------------
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' vercel.live; style-src 'self' 'unsafe-inline'",
};

export default auth(async (req) => {
  const isPostOrSimilar = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  
  // CSRF Validation for non-GET requests
  if (isPostOrSimilar) {
    // NextAuth's CSRF logic
    const csrfCookieName = process.env.NODE_ENV === "production" ? "__Host-authjs.csrf-token" : "authjs.csrf-token";
    const csrfCookie = req.cookies.get(csrfCookieName)?.value;
    
    let csrfToken = req.headers.get("x-csrf-token");
    
    // If not in header, try body
    if (!csrfToken) {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          const clone = req.clone();
          const body = await clone.json();
          csrfToken = body.csrfToken;
        } catch (e) {}
      } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        try {
          const clone = req.clone();
          const formData = await clone.formData();
          csrfToken = formData.get("csrfToken")?.toString() ?? null;
        } catch (e) {}
      }
    }

    if (!csrfToken || !csrfCookie) {
      return new NextResponse(JSON.stringify({ error: "Missing CSRF token" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const [hash, salt] = csrfCookie.split("|");
    const secret = process.env.AUTH_SECRET || "";
    
    // Web Crypto Hash
    const data = new TextEncoder().encode(`${csrfToken}${secret}${salt}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const expectedHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (hash !== expectedHash) {
      return new NextResponse(JSON.stringify({ error: "Invalid CSRF token" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  const res = NextResponse.next();

  // Apply Security Headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  return res;
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

