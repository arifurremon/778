export const WEBHOOK_EVENTS = [
  "order.created",
  "order.updated",
  "booking.created",
  "booking.updated",
  "shop.registered",
  "service.registered",
  "ping",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function isWebhookEvent(value: string): value is WebhookEvent {
  return (WEBHOOK_EVENTS as readonly string[]).includes(value);
}

export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomUUID().replace(/-/g, "")}`;
}
