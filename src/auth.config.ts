import type { Role } from "@prisma/client";
import { NextAuthConfig } from "next-auth";
import { isAdminRole } from "@/lib/rbac";

/**
 * Shared Auth.js configuration that is Edge-compatible.
 * This file should NOT import the database or any Node.js-only APIs.
 *
 * JWT strategy is intentional: CredentialsProvider does not support database sessions.
 * PrismaAdapter is retained for OAuth account linking (Account model) only.
 * JWT callbacks below enrich the session token with id, username, role, profileImage.
 */
export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.profileImage = user.profileImage || user.image;
      }

      if (trigger === "update" && session) {
        const allowed = ["username", "profileImage"] as const;
        for (const key of allowed) {
          if (session[key] !== undefined) token[key] = session[key];
        }
        return token;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | null | undefined;
        session.user.role = token.role as Role | undefined;
        session.user.profileImage = token.profileImage as string | null | undefined;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = isAdminRole(auth?.user?.role);

      if (nextUrl.searchParams.get("error") === "EmailNotVerified") {
        return Response.redirect(
          new URL("/login?error=EmailNotVerified", nextUrl.origin)
        );
      }

      const isProtectedRoute = [
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
        "/emergency",
        "/shops",
        "/services",
        "/directory",
        "/register-service",
        "/register-shop",
      ].some((path) => nextUrl.pathname.startsWith(path));

      const isAdminRoute = nextUrl.pathname.startsWith("/admin");

      if (isProtectedRoute) {
        if (!isLoggedIn) {
          return false;
        }
        if (isAdminRoute && !isAdmin) {
          return Response.redirect(
            new URL("/dashboard?error=unauthorized", nextUrl.origin)
          );
        }
        return true;
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
};
