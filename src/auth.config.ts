import { NextAuthConfig } from "next-auth";

/**
 * Shared Auth.js configuration that is Edge-compatible.
 * This file should NOT import the database or any Node.js-only APIs.
 *
 * IMPORTANT: Do NOT set session.strategy here when using PrismaAdapter
 * in lib/auth.ts. The adapter requires the default "database" strategy.
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
        return { ...token, ...session };
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
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[Auth] Path: ${nextUrl.pathname}, LoggedIn: ${isLoggedIn}`);
      }
      
      const isProtectedRoute = [
        "/dashboard", "/profile", "/settings", "/community", 
        "/messages", "/admin", "/seller", "/expert", 
        "/activity", "/neighbours", "/sos"
      ].some(path => nextUrl.pathname.startsWith(path));

      const isAdminRoute = nextUrl.pathname.startsWith("/admin");

      if (isProtectedRoute) {
        if (!isLoggedIn) {
          console.log(`[Auth] Redirecting unauthenticated user from ${nextUrl.pathname} to sign-in`);
          return false;
        }
        if (isAdminRoute && !isAdmin) {
          console.log(`[Auth] Forbidden: Non-admin user attempted to access ${nextUrl.pathname}`);
          return Response.redirect(new URL("/dashboard?error=unauthorized", nextUrl.origin));
        }
        return true;
      }
      return true;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  // Enable debug logs in development for troubleshooting
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === "development"
};
