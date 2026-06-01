import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { pusher } from "@/lib/pusher";
import { rateLimiters } from "@/lib/rate-limit";
import { sanitizeUserInput } from "@/lib/sanitize";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function GET(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { searchParams } = req.nextUrl;
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = 50;

    // Verify this user belongs to this conversation
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

    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        text: true,
        isRead: true,
        createdAt: true,
        senderId: true,
        sender: {
          select: { id: true, name: true, username: true, profileImage: true },
        },
      },
    });

    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? page[page.length - 1]?.id : null;

    return NextResponse.json({
      messages: page.reverse(), // oldest first for display
      nextCursor,
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/messages/[conversationId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const sendMessageSchema = z.object({
  text: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message too long."),
});

export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 30 messages per minute per user
    const { success, reset } = await rateLimiters.messages.limit(session.user.id);
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Sending too fast. Please slow down." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const { conversationId } = await params;

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participantA: session.user.id },
          { participantB: session.user.id },
        ],
      },
      select: { id: true, participantA: true, participantB: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const body: unknown = await req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const cleanText = sanitizeUserInput(parsed.data.text);

    // Determine recipient
    const recipientId =
      conversation.participantA === session.user.id
        ? conversation.participantB
        : conversation.participantA;

    const [message] = await db.$transaction([
      db.message.create({
        data: {
          conversationId,
          senderId: session.user.id,
          text: cleanText,
        },
        select: {
          id: true,
          text: true,
          isRead: true,
          createdAt: true,
          senderId: true,
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
            },
          },
        },
      }),
      db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    // Fire-and-forget Pusher event — messaging must not fail if Pusher is down
    try {
      await pusher?.trigger(
        `private-user-${recipientId}`,
        "new-message",
        {
          conversationId,
          message,
        }
      );
    } catch (pusherError) {
      logErrorToSentry(pusherError, {
        route: "[POST /api/messages/[conversationId]]",
        note: "Pusher trigger failed — message saved to DB successfully",
      });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/messages/[conversationId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
