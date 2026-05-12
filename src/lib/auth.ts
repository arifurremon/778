import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";
import { sendWelcomeEmail } from "@/lib/mail";
import { rateLimiters } from "@/lib/rate-limit";
import { headers } from "next/headers";

/**
 * Full Auth.js configuration including Node.js-only providers and adapters.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
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
        if (!credentials?.email || !credentials?.password) return null;

        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || "unknown";

        const { success } = await rateLimiters.signin.limit(ip);
        if (!success) {
          throw new Error("Too many attempts. Please try again later.");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const passwordsMatch = await compare(credentials.password as string, user.password);
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

export const { GET, POST } = handlers;
