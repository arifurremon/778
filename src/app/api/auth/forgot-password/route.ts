import { persistSecurityAuditEvent, getClientIp } from "@/lib/security-audit";
import { validateCsrfRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { sendPasswordResetEmail } from "@/lib/mail";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import crypto from "crypto";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const GENERIC_RESET_MESSAGE = "If that email exists, we sent a password reset link.";

const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required."),
});

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateResetToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return {
    rawToken,
    tokenHash: hashResetToken(rawToken),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  };
}

function buildResetUrl(req: NextRequest, token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  return new URL(`/reset-password/${token}`, baseUrl).toString();
}

export async function POST(req: NextRequest) {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

try {
    const headersList = await headers();
    const rawForwarded = headersList.get("x-forwarded-for") ?? "";
    const ip = rawForwarded.split(",")[0]?.trim() || "unknown";

    const body: unknown = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.forgotPassword, `${ip}:${email}`),
      "ForgotPassword"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // Do not reveal whether user exists or not for security.
    if (!user) {
      return NextResponse.json({ success: true, message: GENERIC_RESET_MESSAGE });
    }

    const { rawToken, tokenHash, expiresAt } = generateResetToken();

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: tokenHash,
        resetTokenExp: expiresAt,
      },
    });

    await sendPasswordResetEmail(user.email, buildResetUrl(req, rawToken));

    await persistSecurityAuditEvent({
      action: "PASSWORD_RESET_REQUEST",
      userId: user.id,
      email: user.email,
      ipAddress: ip,
      userAgent: headersList.get("user-agent"),
    });

    return NextResponse.json({ success: true, message: GENERIC_RESET_MESSAGE });
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/auth/forgot-password",
      method: "POST",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
