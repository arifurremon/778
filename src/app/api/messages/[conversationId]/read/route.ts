import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { requireActiveMutation } from "@/lib/session-guards";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.messages, session.user.id),
      "Messages"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { conversationId } = await params;

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participantA: session.user.id },
          { participantB: session.user.id },
        ],
      },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logErrorToSentry(error, {
      route: "[PATCH /api/messages/[conversationId]/read]",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
