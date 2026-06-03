import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { requireActiveSession } from "@/lib/session-guards";
import { ConnectionStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ username: string }> };

function neighbourIdsFromEdges(
  userId: string,
  edges: { senderId: string; receiverId: string }[]
): string[] {
  const ids = new Set<string>();
  for (const edge of edges) {
    if (edge.senderId === userId) ids.add(edge.receiverId);
    else if (edge.receiverId === userId) ids.add(edge.senderId);
  }
  return [...ids];
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    let currentUserId: string | undefined;
    if (session?.user?.id) {
      const active = await requireActiveSession();
      if (active.error) return active.error;
      currentUserId = active.session.user.id;
    }

    const { username } = await params;

    const targetUser = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        preferredName: true,
        mobile: true,
        location: true,
        profession: true,
        bio: true,
        dob: true,
        profileImage: true,
        joinDate: true,
        isVerified: true,
        isSeller: true,
        isServiceProvider: true,
        privacySettings: true,
        showShopBadge: true,
        showExpertBadge: true,
        showFullAge: true,
        showBirthdayOnly: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let connectionStatus:
      | "NONE"
      | "PENDING_SENT"
      | "PENDING_RECEIVED"
      | "ACCEPTED"
      | "SELF" = "NONE";
    let connectionId: string | null = null;
    let mutualNeighboursCount = 0;
    let neighboursCount = 0;

    if (currentUserId === targetUser.id) {
      connectionStatus = "SELF";
    }

    const viewingOther =
      currentUserId && currentUserId !== targetUser.id;

    if (viewingOther && currentUserId) {
      const viewerId = currentUserId;
      const [pairConnection, acceptedEdges] = await Promise.all([
        db.neighbourConnection.findFirst({
          where: {
            OR: [
              { senderId: viewerId, receiverId: targetUser.id },
              { senderId: targetUser.id, receiverId: viewerId },
            ],
          },
          select: { id: true, status: true, senderId: true },
        }),
        db.neighbourConnection.findMany({
          where: {
            status: ConnectionStatus.ACCEPTED,
            OR: [
              { senderId: targetUser.id },
              { receiverId: targetUser.id },
              { senderId: viewerId },
              { receiverId: viewerId },
            ],
          },
          select: { senderId: true, receiverId: true },
        }),
      ]);

      if (pairConnection) {
        connectionId = pairConnection.id;
        if (pairConnection.status === ConnectionStatus.ACCEPTED) {
          connectionStatus = "ACCEPTED";
        } else if (pairConnection.senderId === viewerId) {
          connectionStatus = "PENDING_SENT";
        } else {
          connectionStatus = "PENDING_RECEIVED";
        }
      }

      const targetNeighbourIds = new Set(
        neighbourIdsFromEdges(targetUser.id, acceptedEdges)
      );
      const currentNeighbourIds = new Set(
        neighbourIdsFromEdges(viewerId, acceptedEdges)
      );
      neighboursCount = targetNeighbourIds.size;
      for (const id of targetNeighbourIds) {
        if (currentNeighbourIds.has(id)) mutualNeighboursCount++;
      }
    } else {
      const targetEdges = await db.neighbourConnection.findMany({
        where: {
          status: ConnectionStatus.ACCEPTED,
          OR: [{ senderId: targetUser.id }, { receiverId: targetUser.id }],
        },
        select: { senderId: true, receiverId: true },
      });
      neighboursCount = neighbourIdsFromEdges(targetUser.id, targetEdges).length;
    }

    const isNeighbour = connectionStatus === "ACCEPTED";
    const privacy = (targetUser.privacySettings as Record<string, string>) || {};

    const showEmail =
      privacy.email === "Public" ||
      (isNeighbour && privacy.email === "Neighbours") ||
      connectionStatus === "SELF";
    const showMobile =
      privacy.mobile === "Public" ||
      (isNeighbour && privacy.mobile === "Neighbours") ||
      connectionStatus === "SELF";

    return NextResponse.json({
      profile: {
        ...targetUser,
        email: showEmail ? targetUser.email : null,
        mobile: showMobile ? targetUser.mobile : null,
        neighboursCount,
        mutualNeighboursCount,
      },
      connectionStatus,
      connectionId,
    });
  } catch (error) {
    logErrorToSentry(error, { route: `[GET /api/user/profile/[username]]` });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
