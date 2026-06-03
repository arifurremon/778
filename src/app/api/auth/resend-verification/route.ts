import { validateCsrfRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import crypto from "crypto";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

const resendVerificationSchema = z.object({
  email: z.string().email("Valid email is required."),
});

function buildVerificationUrl(req: NextRequest, token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  return new URL(`/api/auth/verify-email/${token}`, baseUrl).toString();
}

function generateEmailToken(): { token: string; expiresAt: Date } {
  return {
    token: crypto.randomBytes(32).toString("hex"),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  };
}

export async function POST(req: NextRequest) {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

try {
    const body: unknown = await req.json();
    const parsed = resendVerificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const headersList = await headers();
    const rawForwarded = headersList.get("x-forwarded-for") ?? "";
    const ip = rawForwarded.split(",")[0]?.trim() || "unknown";

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.resendVerification, `${ip}:${email}`),
      "ResendVerification"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerified: true },
    });

    // Do not reveal whether an account exists. The login form only calls this
    // after an EmailNotVerified response, but the endpoint is still public.
    const genericMessage = "If that email exists and is unverified, we sent a verification link.";

    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true, message: genericMessage }, { status: 200 });
    }

    const { token, expiresAt } = generateEmailToken();
    await db.user.update({
      where: { id: user.id },
      data: {
        emailToken: token,
        emailTokenExp: expiresAt,
      },
    });

    await sendVerificationEmail(user.email, buildVerificationUrl(req, token));

    return NextResponse.json({ success: true, message: genericMessage }, { status: 200 });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/auth/resend-verification]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
