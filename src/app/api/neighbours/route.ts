import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireActiveSession } from "@/lib/session-guards";

// ---------------------------------------------------------------------------
// GET /api/neighbours  — current user's accepted neighbours
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveSession();
    if (active.error) return active.error;
    const { session } = active;

    const userId = session.user.id;

    // Fetch accepted connections where the user is either sender or receiver
    const connections = await db.neighbourConnection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            preferredName: true,
            username: true,
            profileImage: true,
            isVerified: true,
            location: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            preferredName: true,
            username: true,
            profileImage: true,
            isVerified: true,
            location: true,
          },
        },
      },
    });

    // Map connections to a flat list of neighbour profiles
    const neighbours = connections.map((conn) => {
      if (conn.senderId === userId) {
        return {
          connectionId: conn.id,
          connectedSince: conn.updatedAt,
          ...conn.receiver,
        };
      } else {
        return {
          connectionId: conn.id,
          connectedSince: conn.updatedAt,
          ...conn.sender,
        };
      }
    });

    return NextResponse.json({ neighbours });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/neighbours]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
