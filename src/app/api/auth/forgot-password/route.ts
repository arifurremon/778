import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { sendPasswordResetEmail } from "@/lib/mail";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    // Don't reveal whether user exists or not for security
    if (!user) {
      return NextResponse.json({ success: true, message: "If that email exists, we sent a password reset link." });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExp = new Date(Date.now() + 3600000); // 1 hour from now

    await db.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExp,
      },
    });

    // Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json({ success: true, message: "If that email exists, we sent a password reset link." });
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
