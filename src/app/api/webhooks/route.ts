import { requireActiveMutation, requireActiveUser } from "@/lib/session-guards";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { generateWebhookSecret, isWebhookEvent, WEBHOOK_EVENTS } from "@/lib/webhooks/events";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  url: z.string().url("A valid HTTPS URL is required."),
  events: z.array(z.string()).min(1, "Select at least one event."),
});

export async function GET(): Promise<NextResponse> {
  try {
    const active = await requireActiveUser();
    if (active.error) return active.error;

    const subscriptions = await db.webhookSubscription.findMany({
      where: { userId: active.session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    logErrorToSentry(error, { route: "GET /api/webhooks" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.profile, active.session.user.id),
      "WebhookCreate"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const invalidEvents = parsed.data.events.filter((event) => !isWebhookEvent(event));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid events: ${invalidEvents.join(", ")}. Allowed: ${WEBHOOK_EVENTS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!parsed.data.url.startsWith("https://")) {
      return NextResponse.json({ error: "Webhook URL must use HTTPS." }, { status: 400 });
    }

    const secret = generateWebhookSecret();
    const subscription = await db.webhookSubscription.create({
      data: {
        userId: active.session.user.id,
        url: parsed.data.url,
        events: parsed.data.events,
        secret,
      },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        subscription,
        secret,
        message: "Store the secret securely; it is shown only once.",
      },
      { status: 201 }
    );
  } catch (error) {
    logErrorToSentry(error, { route: "POST /api/webhooks" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
