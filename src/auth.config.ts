import { NextAuthConfig } from "next-auth";

/**
 * Shared Auth.js configuration that is Edge-compatible.
 * This file should NOT import the database or any Node.js-only APIs.
 */
export const authConfig: NextAuthConfig = {
  providers: [], // Providers will be added in auth.ts for Node.js or kept empty for Middleware
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.isAdmin = user.isAdmin;
        token.profileImage = user.profileImage;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.profileImage = token.profileImage as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
};
