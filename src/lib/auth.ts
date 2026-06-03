import { authConfig } from "@/auth.config";
import { evaluateGoogleSignIn, isGoogleOAuthEnabled } from "@/lib/auth-providers";
import { persistSecurityAuditEvent, getClientIp } from "@/lib/security-audit";
import { isAdminRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { rateLimiters } from "@/lib/rate-limit";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { headers } from "next/headers";

/**
 * Full Auth.js configuration including Node.js-only providers and adapters.
 * Credentials (email + password) is always enabled; Google OAuth is optional
 * when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are configured.
 *
 * This module exports `handlers`, `auth`, `signIn`, and `signOut`.
 * It does NOT export GET or POST — those HTTP verb handlers belong
 * exclusively in src/app/api/auth/[...nextauth]/route.ts.
 */
const baseCallbacks = authConfig.callbacks ?? {};

const googleProvider = isGoogleOAuthEnabled()
  ? Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  : null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  events: {
    async signIn({ user, account, isNewUser }) {
      if (account?.provider !== "google" || !user.id) return;

      const headersList = await headers();
      const clientIp = getClientIp(headersList);
      const userAgent = headersList.get("user-agent");

      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          ...(user.image ? { profileImage: user.image, image: user.image } : {}),
          ...(isNewUser ? { joinDate: new Date() } : {}),
        },
      });

      await persistSecurityAuditEvent({
        action: "USER_LOGIN_SUCCESS",
        userId: user.id,
        email: user.email,
        ipAddress: clientIp,
        userAgent,
        details: { provider: "google", isNewUser: !!isNewUser },
      });
    },
  },
  callbacks: {
    ...baseCallbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email?.toLowerCase().trim();
      if (!email) {
        return false;
      }

      const headersList = await headers();
      const clientIp = getClientIp(headersList);
      const userAgent = headersList.get("user-agent");

      const dbUser = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          deletedAt: true,
          suspendedAt: true,
          role: true,
          mfaEnabled: true,
        },
      });

      const decision = evaluateGoogleSignIn(dbUser);
      if (!decision.allowed) {
        if (dbUser?.id) {
          await persistSecurityAuditEvent({
            action: "USER_LOGIN_FAILED",
            userId: dbUser.id,
            email,
            ipAddress: clientIp,
            userAgent,
            details: { reason: decision.reason, provider: "google" },
          });
        }
        return decision.redirect ?? false;
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (baseCallbacks.jwt) {
        const nextToken = await baseCallbacks.jwt({ token, user, trigger, session } as Parameters<
          NonNullable<typeof baseCallbacks.jwt>
        >[0]);
        if (nextToken) token = nextToken;
      }

      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            suspendedAt: true,
            deletedAt: true,
            username: true,
            profileImage: true,
          },
        });

        if (!dbUser || dbUser.deletedAt || dbUser.suspendedAt) {
          return { ...token, invalid: true };
        }

        token.role = dbUser.role;
        token.username = dbUser.username ?? token.username;
        token.profileImage = dbUser.profileImage ?? token.profileImage;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.invalid) {
        return { ...session, user: undefined, expires: new Date(0).toISOString() };
      }
      if (baseCallbacks.session) {
        return baseCallbacks.session({ session, token } as Parameters<
          NonNullable<typeof baseCallbacks.session>
        >[0]);
      }
      return session;
    },
    authorized: baseCallbacks.authorized,
  },
  providers: [
    ...(googleProvider ? [googleProvider] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "TOTP Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const headersList = await headers();
        const userAgent = headersList.get("user-agent");
        const clientIp = getClientIp(headersList);

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

        if (!user || !user.password) {
          await persistSecurityAuditEvent({
            action: "USER_LOGIN_FAILED",
            email,
            ipAddress: clientIp,
            userAgent,
            details: { reason: "unknown_account" },
          });
          return null;
        }

        if (user.suspendedAt !== null) {
          await persistSecurityAuditEvent({
            action: "USER_LOGIN_FAILED",
            userId: user.id,
            email,
            ipAddress: clientIp,
            userAgent,
            details: { reason: "suspended" },
          });
          throw new Error("AccountSuspended");
        }

        const passwordsMatch = await compare(
          credentials.password as string,
          user.password
        );
        if (!passwordsMatch) {
          await persistSecurityAuditEvent({
            action: "USER_LOGIN_FAILED",
            userId: user.id,
            email,
            ipAddress: clientIp,
            userAgent,
            details: { reason: "invalid_password" },
          });
          return null;
        }

        if (!user.emailVerified) {
          await persistSecurityAuditEvent({
            action: "USER_LOGIN_FAILED",
            userId: user.id,
            email,
            ipAddress: clientIp,
            userAgent,
            details: { reason: "email_not_verified" },
          });
          throw new Error("EmailNotVerified");
        }

        if (
          user.mfaEnabled &&
          user.mfaSecret &&
          isAdminRole(user.role)
        ) {
          const totpCode = (credentials.totpCode as string | undefined)?.trim();
          if (!totpCode) {
            throw new Error("MfaRequired");
          }
          const { verify } = await import("otplib");
          const result = await verify({
            token: totpCode,
            secret: user.mfaSecret,
          });
          if (!result.valid) {
            await persistSecurityAuditEvent({
              action: "USER_LOGIN_FAILED",
              userId: user.id,
              email,
              ipAddress: clientIp,
              userAgent,
              details: { reason: "invalid_mfa" },
            });
            throw new Error("InvalidMfaCode");
          }
        }

        await persistSecurityAuditEvent({
          action: "USER_LOGIN_SUCCESS",
          userId: user.id,
          email,
          ipAddress: clientIp,
          userAgent,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
          profileImage: user.profileImage,
        };
      },
    }),
  ],
});
