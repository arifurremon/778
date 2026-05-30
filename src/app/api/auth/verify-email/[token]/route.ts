import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { sendWelcomeEmail } from "@/lib/mail";
import { NextRequest, NextResponse } from "next/server";

function redirectTo(req: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, req.url));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 32) {
      return redirectTo(req, "/login?error=invalid-verification-token");
    }

    const user = await db.user.findFirst({
      where: {
        emailToken: token,
        emailTokenExp: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return redirectTo(req, "/login?error=invalid-verification-token");
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: user.emailVerified ?? new Date(),
        emailToken: null,
        emailTokenExp: null,
      },
    });

    try {
      await sendWelcomeEmail({
        to: user.email,
        name: user.name || "Neighbour",
      });
    } catch (emailError) {
      console.error("[VerifyEmail] Welcome email failed — verification NOT affected:", emailError);
    }

    return redirectTo(req, "/login?verified=true");
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/auth/verify-email/[token]",
      method: "GET",
    });
    return redirectTo(req, "/login?error=verification-failed");
  }
}
