import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireActiveMutation } from "@/lib/session-guards";
import { logErrorToSentry } from "@/lib/error-handler";
import { sanitizeUserInput } from "@/lib/sanitize";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const conversations = await db.conversation.findMany({
      where: {
        OR: [{ participantA: userId }, { participantB: userId }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        userA: {
          select: { id: true, name: true, username: true, profileImage: true },
        },
        userB: {
          select: { id: true, name: true, username: true, profileImage: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { text: true, createdAt: true, senderId: true },
        },
        _count: {
          select: {
            messages: {
              where: { isRead: false, senderId: { not: userId } },
            },
          },
        },
      },
    });

    // Shape each conversation so the client always sees "participant" = the OTHER person
    const shaped = conversations.map((conv) => {
      const participant =
        conv.participantA === userId ? conv.userB : conv.userA;
      const lastMessage = conv.messages[0] ?? null;

      return {
        id: conv.id,
        participantId: participant.id,
        participantName: participant.name ?? participant.username ?? "User",
        participantAvatar: participant.profileImage ?? "",
        participantUsername: participant.username ?? "",
        lastMessage: lastMessage?.text ?? "",
        lastMessageAt: lastMessage?.createdAt ?? conv.createdAt,
        unreadCount: conv._count.messages,
      };
    });

    return NextResponse.json({ conversations: shaped });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/messages]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const startConvSchema = z.object({
  recipientId: z.string().min(1),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const body: unknown = await req.json();
    const parsed = startConvSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const { recipientId } = parsed.data;
    const userId = session.user.id;

    if (userId === recipientId) {
      return NextResponse.json(
        { error: "Cannot start a conversation with yourself." },
        { status: 400 }
      );
    }

    // Check recipient exists
    const recipient = await db.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });
    if (!recipient) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Normalise participant order so [A,B] and [B,A] map to the same row
    const sorted = [userId, recipientId].sort();
    const participantA = sorted[0] as string;
    const participantB = sorted[1] as string;

    const conversation = await db.conversation.upsert({
      where: { participantA_participantB: { participantA, participantB } },
      update: {},
      create: { participantA, participantB },
      select: { id: true },
    });

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/messages]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
