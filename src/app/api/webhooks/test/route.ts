import { requireActiveMutation } from "@/lib/session-guards";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { emitWebhookEvent } from "@/lib/webhooks/delivery";
import { NextRequest, NextResponse } from "next/server";

/** POST /api/webhooks/test — queue a signed ping event for the caller's subscriptions */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;

    const activeCount = await db.webhookSubscription.count({
      where: { userId: active.session.user.id, isActive: true, events: { has: "ping" } },
    });

    if (activeCount === 0) {
      return NextResponse.json(
        {
          error: "No active webhook subscriptions with the ping event. Create one via POST /api/webhooks.",
        },
        { status: 400 }
      );
    }

    await emitWebhookEvent(active.session.user.id, "ping", {
      message: "The Chattala webhook test ping",
      triggeredAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { queued: true, subscriptions: activeCount, event: "ping" },
      { status: 202 }
    );
  } catch (error) {
    logErrorToSentry(error, { route: "POST /api/webhooks/test" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
