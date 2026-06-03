import { processPendingWebhookDeliveries } from "@/lib/webhooks/delivery";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/cron/webhook-retry — process pending webhook deliveries (CRON_SECRET) */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const processed = await processPendingWebhookDeliveries(50);
    return NextResponse.json({ success: true, processed });
  } catch (error) {
    logErrorToSentry(error, { route: "GET /api/cron/webhook-retry" });
    return NextResponse.json({ error: "Webhook retry job failed" }, { status: 500 });
  }
}
