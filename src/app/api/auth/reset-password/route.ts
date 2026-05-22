// Fixed: 3 — Added rate limiting and Zod validation to reset-password endpoint.
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { rateLimiters } from "@/lib/rate-limit";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    
    const { success } = await rateLimiters.resetPassword.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Validation failed." }, { status: 400 });
    }

    const { token, password } = parsed.data;

    // Find user with token and ensure it's not expired
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hash(password, 12);

    // Update user and clear reset tokens
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/auth/reset-password",
      method: "POST",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
