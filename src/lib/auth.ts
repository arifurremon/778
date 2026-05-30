import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { rateLimiters } from "@/lib/rate-limit";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { headers } from "next/headers";

/**
 * Full Auth.js configuration including Node.js-only providers and adapters.
 * Only credentials-based authentication (email + password) is enabled.
 *
 * This module exports `handlers`, `auth`, `signIn`, and `signOut`.
 * It does NOT export GET or POST — those HTTP verb handlers belong
 * exclusively in src/app/api/auth/[...nextauth]/route.ts.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  // session strategy is set in auth.config.ts via authConfig spread — JWT for Edge compatibility.
  providers: [
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

        let rateLimitSuccess = true;
        try {
          const result = await Promise.race([
            rateLimiters.signin.limit(ip),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Rate limit timeout")), 2000)
            ),
          ]);
          rateLimitSuccess = result.success;
        } catch (err) {
          console.error("[Auth] Rate limit skipped due to timeout or error:", err);
        }

        if (!rateLimitSuccess) {
          throw new Error("Too many attempts. Please try again later.");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const passwordsMatch = await compare(
          credentials.password as string,
          user.password
        );
        if (!passwordsMatch) return null;

        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

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
});
