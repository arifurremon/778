import { requireActiveMutation, requireActiveUser } from "@/lib/session-guards";
import {
  activitySelect,
  buildActivityTabFilter,
  serializeActivityLog,
  type ActivityTab,
} from "@/lib/activity-utils";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

const VALID_TABS = new Set<ActivityTab>(["all", "likes", "comments", "saved", "system"]);

// GET /api/activity — authenticated user's activity history
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveUser();
    if (active.error) return active.error;
    const { session } = active;

    const tabParam = (req.nextUrl.searchParams.get("tab") ?? "all") as ActivityTab;
    const tab = VALID_TABS.has(tabParam) ? tabParam : "all";
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10))
    );
    const skip = (page - 1) * limit;

    const typeFilter = buildActivityTabFilter(tab);
    const where = {
      userId: session.user.id,
      ...(typeFilter ? { type: { in: typeFilter } } : {}),
    };

    const [activities, total, unreadCount] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: activitySelect,
      }),
      db.activityLog.count({ where }),
      db.activityLog.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ]);

    return NextResponse.json({
      activities: activities.map(serializeActivityLog),
      total,
      unreadCount,
      page,
      limit,
      nextPage: skip + limit < total ? page + 1 : null,
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/activity]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/activity — mark all activity entries as read
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    await db.activityLog.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/activity]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
