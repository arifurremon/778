import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { generateSecret, generateURI } from "otplib";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/auth/mfa/setup — generate TOTP secret for admin MFA enrollment */
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin({ skipMfaCheck: true });
    if (admin.error) return admin.error;

    const secret = generateSecret();
    const otpauth = generateURI({
      issuer: "The Chattala Admin",
      label: admin.session.user.email ?? admin.session.user.id,
      secret,
    });

    await db.user.update({
      where: { id: admin.session.user.id },
      data: { mfaSecret: secret, mfaEnabled: false },
    });

    return NextResponse.json({
      secret,
      otpauthUrl: otpauth,
      issuer: "The Chattala Admin",
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/auth/mfa/setup]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
