import { requireActiveMutation } from "@/lib/session-guards";
import { requireAdmin } from "@/lib/admin-auth";
import { persistSecurityAuditEvent, getClientIp } from "@/lib/security-audit";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { verify } from "otplib";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const verifySchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code from your authenticator app."),
});

/** POST /api/auth/mfa/verify — confirm TOTP and enable MFA for admin account */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;

    const admin = await requireAdmin({ skipMfaCheck: true });
    if (admin.error) return admin.error;

    const body: unknown = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const dbUser = await db.user.findUnique({
      where: { id: admin.session.user.id },
      select: { mfaSecret: true },
    });

    if (!dbUser?.mfaSecret) {
      return NextResponse.json(
        { error: "Run MFA setup first." },
        { status: 400 }
      );
    }

    const result = await verify({
      token: parsed.data.code,
      secret: dbUser.mfaSecret,
    });

    if (!result.valid) {
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }

    await db.user.update({
      where: { id: admin.session.user.id },
      data: { mfaEnabled: true },
    });

    await persistSecurityAuditEvent({
      action: "MFA_ENABLED",
      userId: admin.session.user.id,
      ipAddress: getClientIp(req.headers),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true, mfaEnabled: true });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/auth/mfa/verify]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
