import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: {
        emailToken: token,
      },
    });

    if (!user) {
      // Redirect to an error page or show an error
      return NextResponse.redirect(new URL("/?error=invalid-verification-token", req.url));
    }

    // Mark email as verified and clear the token
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailToken: null,
      },
    });

    // Redirect to login with success message
    return NextResponse.redirect(new URL("/?verified=true", req.url));
  } catch (error) {
    console.error("[VERIFY_EMAIL]", error);
    return NextResponse.redirect(new URL("/?error=verification-failed", req.url));
  }
}
