import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

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

const ADMIN_PATHS: string[] = ["/admin"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isProtected = PROTECTED_PATHS.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  // Unauthenticated → /
  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL("/", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Admin-only routes
  const isAdminRoute = ADMIN_PATHS.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  if (isAdminRoute && isLoggedIn && !req.auth?.user?.isAdmin) {
    const dashboardUrl = new URL("/dashboard", nextUrl.origin);
    dashboardUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
});

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
  ],
};
