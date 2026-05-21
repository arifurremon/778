import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/neighbours/requests  — pending requests received by current user
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await db.neighbourConnection.findMany({
      where: {
        receiverId: session.user.id,
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            preferredName: true,
            username: true,
            profileImage: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/neighbours/requests]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/neighbours/requests  — send neighbour request
// ---------------------------------------------------------------------------
const sendRequestSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required."),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const senderId = session.user.id;

    const body: unknown = await req.json();
    const parsed = sendRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const { receiverId } = parsed.data;

    if (senderId === receiverId) {
      return NextResponse.json(
        { error: "You cannot send a request to yourself." },
        { status: 400 }
      );
    }

    // Check if receiver exists
    const receiverExists = await db.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });
    if (!receiverExists) {
      return NextResponse.json({ error: "Receiver not found." }, { status: 404 });
    }

    // Check for existing connection (any direction)
    const existingConnection = await db.neighbourConnection.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existingConnection) {
      return NextResponse.json(
        { error: "A connection or pending request already exists." },
        { status: 409 }
      );
    }

    const connection = await db.neighbourConnection.create({
      data: {
        senderId,
        receiverId,
        status: "PENDING",
      },
    });

    const sender = await db.user.findUnique({ where: { id: senderId } });
    const receiver = await db.user.findUnique({ where: { id: receiverId } });

    if (receiver && sender) {
      await db.activityLog.create({
        data: {
          userId: receiver.id,
          type: "CONNECTION_REQUEST",
          description: `@${sender.username || sender.name} wants to connect with you.`,
          contextUrl: `/profile/${sender.username}`,
        }
      });

      // Send email if possible
      if (receiver.email) {
        // dynamic import or imported at top
        const { sendNotificationEmail } = await import("@/lib/mail");
        await sendNotificationEmail(
          receiver.email,
          "New Trust Request on The Chattala",
          "You have a new Neighbour Request!",
          `${sender.name || '@'+sender.username} wants to add you to their trust network on The Chattala. Accept their request to unlock private contact information.`,
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile/${sender.username}`,
          "View Request"
        );
      }
    }

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/neighbours/requests]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
