import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ connectionId: string }> };

// ---------------------------------------------------------------------------
// PATCH /api/neighbours/requests/[connectionId]  — accept or reject (receiver only)
// ---------------------------------------------------------------------------
const actionSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { connectionId } = await params;
    const body: unknown = await req.json();
    const parsed = actionSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Action must be 'accept' or 'reject'." },
        { status: 400 }
      );
    }
    const { action } = parsed.data;

    const connection = await db.neighbourConnection.findUnique({
      where: { id: connectionId },
      include: { receiver: { select: { name: true, preferredName: true } } },
    });

    if (!connection) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (connection.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the receiver can accept or reject this request." },
        { status: 403 }
      );
    }

    if (connection.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request is no longer pending." },
        { status: 400 }
      );
    }

    const receiverName = connection.receiver.preferredName || connection.receiver.name || "A user";

    if (action === "accept") {
      await db.neighbourConnection.update({
        where: { id: connectionId },
        data: { status: "ACCEPTED" },
      });
      await db.activityLog.create({
        data: {
          userId: connection.senderId,
          type: "SYSTEM",
          description: `${receiverName} accepted your neighbour request.`,
          contextUrl: "/neighbours",
        },
      });
      return NextResponse.json({ success: true, message: "Request accepted." });
    } else {
      await db.neighbourConnection.delete({ where: { id: connectionId } });
      await db.activityLog.create({
        data: {
          userId: connection.senderId,
          type: "SYSTEM",
          description: `${receiverName} declined your neighbour request.`,
        },
      });
      return NextResponse.json({ success: true, message: "Request rejected." });
    }
  } catch (error) {
    console.error("[PATCH /api/neighbours/requests/[connectionId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/neighbours/requests/[connectionId]  — cancel sent request (sender only)
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
      select: { senderId: true, status: true },
    });

    if (!connection) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (connection.senderId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the sender can cancel this request." },
        { status: 403 }
      );
    }
    
    if (connection.status !== "PENDING") {
       return NextResponse.json(
        { error: "Cannot cancel a request that is not pending." },
        { status: 400 }
      );
    }

    await db.neighbourConnection.delete({ where: { id: connectionId } });

    return NextResponse.json({ success: true, message: "Request cancelled." });
  } catch (error) {
    console.error("[DELETE /api/neighbours/requests/[connectionId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
