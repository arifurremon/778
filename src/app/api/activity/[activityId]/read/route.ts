import { requireActiveMutation } from "@/lib/session-guards";
import { activitySelect, serializeActivityLog } from "@/lib/activity-utils";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ activityId: string }> };

// PATCH /api/activity/[activityId]/read — mark a single activity entry as read
export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.activity, session.user.id),
      "Activity"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { activityId } = await params;

    const existing = await db.activityLog.findUnique({
      where: { id: activityId },
      select: { id: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Activity not found." }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.activityLog.update({
      where: { id: activityId },
      data: { isRead: true },
      select: activitySelect,
    });

    return NextResponse.json({ activity: serializeActivityLog(updated) });
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/activity/[activityId]/read]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
