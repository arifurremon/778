import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing token or password" }, { status: 400 });
    }

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
