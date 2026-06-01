import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";

type RouteContext = { params: Promise<{ blockedId: string }> };

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blockedId } = await params;

    await db.blockedUser.delete({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: blockedId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Ignore error if record doesn't exist
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: true });
    }
    
    logErrorToSentry(error, { route: "DELETE /api/user/block/[blockedId]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
