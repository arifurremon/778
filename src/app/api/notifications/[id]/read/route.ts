import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.activityLog.update({
      where: { id, userId: session.user.id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/notifications/[id]/read]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
