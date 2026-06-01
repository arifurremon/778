import { NextAuthConfig } from "next-auth";

/**
 * Shared Auth.js configuration that is Edge-compatible.
 * This file should NOT import the database or any Node.js-only APIs.
 *
 * JWT strategy is intentional: CredentialsProvider does not support database sessions.
 * PrismaAdapter is retained for OAuth account linking (Account model) only.
 * JWT callbacks below are used only for enriching the session token
 * with extra fields (id, username, isAdmin, profileImage).
 */
export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.isAdmin = user.isAdmin;
        // Fallback to Google image if profileImage is not set
        token.profileImage = user.profileImage || user.image;
      }

      // Support manual session updates
      if (trigger === "update" && session) {
        // Only merge safe, scalar session fields to prevent JWT size overflow
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
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.isAdmin = token.isAdmin;
        session.user.profileImage = token.profileImage;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.isAdmin;

      // Propagate EmailNotVerified error to the login page with proper context
      if (nextUrl.searchParams.get("error") === "EmailNotVerified") {
        return Response.redirect(
          new URL("/login?error=EmailNotVerified", nextUrl.origin)
        );
      }

      // FIX(P1): Added missing protected routes that were previously accessible
      // without authentication:
      //   - /register-service  (service provider registration)
      //   - /register-shop     (seller shop registration)
      //   - /employee          (employee-only area)
      // Unauthenticated access to these routes allowed partial form submissions
      // and data exposure before login enforcement.
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
        // --- Previously missing routes (FIX) ---
        "/register-service",
        "/register-shop",
        "/employee",
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
  // Auth.js native debug output in development — no manual console.log needed
  debug: process.env.NODE_ENV === "development",
};
