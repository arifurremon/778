import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimiters } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { logErrorToSentry } from "@/lib/error-handler";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || session.user.id;
    
    // Rate limit: 3 attempts per hour per user ID / IP
    const { success } = await rateLimiters.resendVerification.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailToken: true, isVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.emailToken || user.isVerified) {
      return NextResponse.json({ error: "Already verified" }, { status: 400 });
    }

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/verify-email/${user.emailToken}`;
    await sendVerificationEmail(user.email, verifyUrl);

    return NextResponse.json({ success: true, message: "Verification email sent." }, { status: 200 });

  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/auth/resend-verification]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
