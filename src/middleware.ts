import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ---------------------------------------------------------------------------
// Routes that require a valid session
// ---------------------------------------------------------------------------
const PROTECTED_PATHS: string[] = [
  "/dashboard",
  "/profile",
  "/settings",
  "/community",
  "/messages",
  "/admin",
  "/seller",
  "/expert",
  "/activity",
  "/neighbours",
  "/register-shop",
  "/register-service",
  "/sos",
];

// ---------------------------------------------------------------------------
// Routes that additionally require isAdmin === true
// ---------------------------------------------------------------------------
const ADMIN_PATHS: string[] = ["/admin"];

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  // Use NEXTAUTH_SECRET to match auth.ts
  const secureCookie = process.env.NODE_ENV === "production" || nextUrl.protocol === "https:";
  const cookieName = secureCookie ? "__Secure-authjs.session-token" : "authjs.session-token";
  
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET,
    salt: cookieName,
    secureCookie
  });

  const isProtected = PROTECTED_PATHS.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Unauthenticated → /
  if (!token) {
    const signInUrl = new URL("/", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Admin-only routes
  const isAdminRoute = ADMIN_PATHS.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  if (isAdminRoute && !token.isAdmin) {
    const dashboardUrl = new URL("/dashboard", nextUrl.origin);
    dashboardUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — covers all protected paths, excluding Next.js internals,
// static files, and the NextAuth API itself.
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/community/:path*",
    "/messages/:path*",
    "/admin/:path*",
    "/seller/:path*",
    "/expert/:path*",
    "/activity/:path*",
    "/neighbours/:path*",
    "/register-shop/:path*",
    "/register-service/:path*",
    "/sos/:path*",
    /*
     * Explicitly exclude:
     *  - /_next/ (static assets, HMR, etc.)
     *  - /api/auth (NextAuth endpoints — must be publicly reachable)
     *  - /favicon.ico, image files, etc.
     */
  ],
};
