import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ id: user.id });
  } catch (error) {
    logErrorToSentry(error, { route: "GET /api/user/resolve" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
