import { db } from "@/lib/db";
import { createHmac } from "crypto";
import type { WebhookEvent } from "@/lib/webhooks/events";

const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000, 3_600_000, 14_400_000];

export function signWebhookPayload(secret: string, payload: string, timestamp: number): string {
  const signedContent = `${timestamp}.${payload}`;
  return createHmac("sha256", secret).update(signedContent).digest("hex");
}

export async function enqueueWebhookDeliveries(
  userId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  const subscriptions = await db.webhookSubscription.findMany({
    where: {
      userId,
      isActive: true,
      events: { has: event },
    },
    select: { id: true },
  });

  if (subscriptions.length === 0) return;

  await db.webhookDelivery.createMany({
    data: subscriptions.map((sub) => ({
      subscriptionId: sub.id,
      event,
      payload,
      status: "PENDING" as const,
      nextRetryAt: new Date(),
    })),
  });

  void processPendingWebhookDeliveries();
}

export async function deliverWebhookNow(
  deliveryId: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const delivery = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: {
      subscription: {
        select: { url: true, secret: true, isActive: true },
      },
    },
  });

  if (!delivery || !delivery.subscription.isActive) {
    return { ok: false, error: "Delivery or subscription not found." };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({
    id: delivery.id,
    event: delivery.event,
    createdAt: delivery.createdAt.toISOString(),
    data: delivery.payload,
  });
  const signature = signWebhookPayload(delivery.subscription.secret, body, timestamp);

  let responseStatus: number | undefined;
  let responseBody: string | undefined;
  let errorMessage: string | undefined;

  try {
    const response = await fetch(delivery.subscription.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "TheChattala-Webhooks/1.0",
        "X-Webhook-Id": delivery.id,
        "X-Webhook-Event": delivery.event,
        "X-Webhook-Timestamp": String(timestamp),
        "X-Webhook-Signature": `sha256=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    responseStatus = response.status;
    responseBody = (await response.text()).slice(0, 2000);

    if (response.ok) {
      await db.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "DELIVERED",
          attempts: delivery.attempts + 1,
          lastAttemptAt: new Date(),
          nextRetryAt: null,
          responseStatus,
          responseBody,
          errorMessage: null,
        },
      });
      return { ok: true, status: responseStatus };
    }

    errorMessage = `HTTP ${response.status}`;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Delivery failed";
  }

  const attempts = delivery.attempts + 1;
  const isFinal = attempts >= MAX_ATTEMPTS;

  await db.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      status: isFinal ? "DLQ" : "FAILED",
      attempts,
      lastAttemptAt: new Date(),
      nextRetryAt: isFinal ? null : new Date(Date.now() + RETRY_DELAYS_MS[attempts - 1]!),
      responseStatus: responseStatus ?? null,
      responseBody: responseBody ?? null,
      errorMessage,
    },
  });

  return { ok: false, status: responseStatus, error: errorMessage };
}

export async function processPendingWebhookDeliveries(limit = 20): Promise<number> {
  const pending = await db.webhookDelivery.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true },
  });

  for (const item of pending) {
    await deliverWebhookNow(item.id);
  }

  return pending.length;
}

export async function emitWebhookEvent(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  try {
    await enqueueWebhookDeliveries(userId, event, data);
  } catch (error) {
    console.error("[Webhooks] enqueue failed:", error);
  }
}
