import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";

type RouteContext = { params: Promise<{ username: string }> };

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id; // Optional: user might be logged out

    const { username } = await params;

    // Fetch the target user by username
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

    let connectionStatus: "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "ACCEPTED" | "SELF" = "NONE";
    let connectionId: string | null = null;
    let mutualNeighboursCount = 0;
    
    // Get total accepted connections for target user
    const targetConnections = await db.neighbourConnection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: targetUser.id }, { receiverId: targetUser.id }],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });

    const targetNeighbourIds = targetConnections.map(c => 
      c.senderId === targetUser.id ? c.receiverId : c.senderId
    );
    const neighboursCount = targetNeighbourIds.length;

    if (currentUserId) {
      if (currentUserId === targetUser.id) {
        connectionStatus = "SELF";
      } else {
        // Check connection status between current user and target user
        const connection = await db.neighbourConnection.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: targetUser.id },
              { senderId: targetUser.id, receiverId: currentUserId },
            ],
          },
        });

        if (connection) {
          connectionId = connection.id;
          if (connection.status === "ACCEPTED") {
            connectionStatus = "ACCEPTED";
          } else if (connection.senderId === currentUserId) {
            connectionStatus = "PENDING_SENT";
          } else {
            connectionStatus = "PENDING_RECEIVED";
          }
        }

        // Get count of mutual neighbours
        const currentUserConnections = await db.neighbourConnection.findMany({
          where: {
            status: "ACCEPTED",
            OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
          },
          select: {
            senderId: true,
            receiverId: true,
          },
        });

        const currentUserNeighbourIds = currentUserConnections.map(c =>
          c.senderId === currentUserId ? c.receiverId : c.senderId
        );

        mutualNeighboursCount = targetNeighbourIds.filter(id => 
          currentUserNeighbourIds.includes(id)
        ).length;
      }
    }

    // Filter fields based on target user's privacy settings
    const isNeighbour = connectionStatus === "ACCEPTED";
    const privacy = (targetUser.privacySettings as Record<string, string>) || {};

    const showEmail = privacy.email === "Public" || (isNeighbour && privacy.email === "Neighbours") || connectionStatus === "SELF";
    const showMobile = privacy.mobile === "Public" || (isNeighbour && privacy.mobile === "Neighbours") || connectionStatus === "SELF";

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
