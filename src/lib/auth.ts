import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { sendWelcomeEmail } from "@/lib/mail";

/**
 * Extended token shape — we add custom fields so middleware can access them
 * without a separate DB call.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      username?: string | null;
      isAdmin: boolean;
      profileImage: string | null;
    };
  }

  interface User {
    id: string;
    username?: string | null;
    isAdmin: boolean;
    profileImage: string | null;
  }
}

// Removed next-auth/jwt augmentation because in v5 it's handled differently and causes a TS error here.

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
    error: "/",
  },
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          !credentials ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            password: true,
            isAdmin: true,
            profileImage: true,
          },
        });

        if (!user || !user.password) return null;

        const passwordsMatch = await compare(credentials.password, user.password);
        if (!passwordsMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          isAdmin: user.isAdmin,
          profileImage: user.profileImage,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // initial sign in
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.isAdmin = user.isAdmin;
        // for OAuth users, user.image maps to profileImage or standard NextAuth image
        token.profileImage = user.profileImage || user.image;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.isAdmin = token.isAdmin as boolean;
      session.user.profileImage = token.profileImage as string | null;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.email) {
        try {
          await sendWelcomeEmail({
            to: user.email,
            name: user.name || "Neighbour",
          });
        } catch (emailError) {
          console.error("[Auth] Welcome email failed — user creation is NOT affected:", emailError);
        }
      }
    },
  },
});

// Convenience re-export so that route.ts can do: export { GET, POST } from "@/lib/auth"
export const { GET, POST } = handlers;
