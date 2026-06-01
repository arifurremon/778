import { logErrorToSentry } from "@/lib/error-handler";
import { requireActiveMutation } from "@/lib/session-guards";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

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
      
      const sender = await db.user.findUnique({ where: { id: connection.senderId } });
      const receiver = connection.receiver;
      const receiverName = receiver.preferredName || receiver.name || "A user";

      await db.activityLog.create({
        data: {
          userId: connection.senderId,
          type: "CONNECTION_ACCEPTED",
          description: `${receiverName} accepted your neighbour request.`,
          contextUrl: `/profile/${session.user.username || 'me'}`,
        },
      });

      if (sender?.email) {
        const { sendNotificationEmail } = await import("@/lib/mail");
        await sendNotificationEmail(
          sender.email,
          "Trust Request Accepted!",
          "You have a new Neighbour!",
          `${receiverName} has accepted your trust request. You can now view their private contact information and interact closely with them on The Chattala.`,
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile/${session.user.username || 'me'}`,
          "View Profile"
        );
      }

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
    logErrorToSentry(error, { route: "[PATCH /api/neighbours/requests/[connectionId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/neighbours/requests/[connectionId]  — cancel sent request (sender only)
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

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
    logErrorToSentry(error, { route: "[DELETE /api/neighbours/requests/[connectionId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
