import { validateCsrfRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { requireActiveUser } from "@/lib/session-guards";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

  try {
    const active = await requireActiveUser();
    if (active.error) return active.error;
    const { session } = active;

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
