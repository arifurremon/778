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

        // Extract the real client IP from the x-forwarded-for chain.
        //
        // When a request passes through multiple proxies, the header is a
        // comma-separated list of IPs appended by each hop in order:
        //   "203.0.113.1, 10.0.0.1, 172.16.0.1"
        // The leftmost value is the original client IP as seen by the first
        // trusted proxy (Vercel edge / load balancer). All subsequent values
        // are internal infrastructure addresses and must not be used as the
        // client identifier. Using the raw header string as a rate-limit key
        // on a multi-hop deployment produces a unique key per proxy path,
        // silently defeating the limiter for a rotating-proxy attacker.
        const rawForwarded = headersList.get("x-forwarded-for") ?? "";
        const ip = rawForwarded.split(",")[0]?.trim() || "unknown";

        // Normalise email to lowercase to prevent key fragmentation.
        // An attacker using "Victim@Evil.com" vs "victim@evil.com" would
        // otherwise get two independent rate-limit buckets for the same
        // account, doubling their effective attempt budget.
        const email = (credentials.email as string).toLowerCase().trim();

        // Composite rate-limit key: ip + email.
        //
        // Keying on IP alone has two failure modes:
        //   - Under-blocking: attackers rotate IPs to brute-force one account.
        //   - Over-blocking: multiple valid users on a shared corporate NAT
        //     exhaust the shared IP budget, locking out innocent users.
        //
        // The composite key fixes both:
        //   - Per-account protection: each ip:email pair has its own sliding
        //     window, so the account dimension is bounded regardless of how
        //     many IPs the attacker uses.
        //   - Per-user fairness: two users behind the same NAT target different
        //     accounts, so they each consume their own independent budget.
        const rateLimitKey = `${ip}:${email}`;

        let rateLimitResult: { success: boolean; reset?: number } = { success: true };
        try {
          rateLimitResult = await Promise.race([
            rateLimiters.signin.limit(rateLimitKey),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Rate limit timeout")), 2000)
            ),
          ]);
        } catch (err) {
          console.error("[Auth] Rate limit skipped due to timeout or error:", err);
          if (process.env.NODE_ENV === "production") {
            throw new Error("Too many attempts. Please try again later.");
          }
        }

        if (!rateLimitResult.success) {
          const retryAfterSec = rateLimitResult.reset ? Math.max(1, Math.ceil((rateLimitResult.reset - Date.now()) / 1000)) : 60;
          throw new Error(`Too many attempts. Please try again in ${retryAfterSec} seconds.`);
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        if (user.suspendedAt !== null) {
          throw new Error("AccountSuspended");
        }

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
