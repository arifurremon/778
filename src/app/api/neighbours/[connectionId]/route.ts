import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ connectionId: string }> };

// ---------------------------------------------------------------------------
// DELETE /api/neighbours/[connectionId]  — disconnect an accepted neighbour
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { connectionId } = await params;

    const connection = await db.neighbourConnection.findUnique({
      where: { id: connectionId },
      select: { senderId: true, receiverId: true, status: true },
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found." }, { status: 404 });
    }

    // Must be either the sender or receiver
    if (
      connection.senderId !== session.user.id &&
      connection.receiverId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Forbidden. You are not part of this connection." },
        { status: 403 }
      );
    }

    await db.neighbourConnection.delete({ where: { id: connectionId } });

    return NextResponse.json({ success: true, message: "Connection removed." });
  } catch (error) {
    logErrorToSentry(error, { route: "[DELETE /api/neighbours/[connectionId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
