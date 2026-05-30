/**
 * src/app/api/notifications/route.ts
 *
 * Notification inbox endpoints.
 *
 * GET  /api/notifications      — fetch the latest 50 notifications for the
 *                                 current user, ordered by recency.
 * PATCH /api/notifications     — bulk mark-all-as-read.
 *
 * These endpoints serve the initial hydration of the useNotifications hook.
 * Real-time delivery of new notifications is handled by the Pusher channel;
 * this endpoint is the fallback / initial load source.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";

// Shared select shape — matches what the client needs to render a notification
// row without a follow-up fetch.
const notificationSelect = {
  id: true,
  type: true,
  entityType: true,
  entityId: true,
  metadata: true,
  isRead: true,
  createdAt: true,
  actor: {
    select: {
      id: true,
      name: true,
      preferredName: true,
      username: true,
      profileImage: true,
    },
  },
} as const;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: notificationSelect,
    });

    // Compute unreadCount server-side to avoid a second round-trip.
    const unreadCount = await db.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/notifications]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/notifications]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
