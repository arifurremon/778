import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { requireActiveMutation } from "@/lib/session-guards";

type RouteContext = { params: Promise<{ blockedId: string }> };

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

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
