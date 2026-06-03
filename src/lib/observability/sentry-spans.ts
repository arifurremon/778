import * as Sentry from "@sentry/nextjs";

type SpanAttributes = Record<string, string | number | boolean | undefined>;

export async function withBusinessSpan<T>(
  name: string,
  operation: string,
  fn: () => Promise<T>,
  attributes?: SpanAttributes
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: operation,
      attributes: sanitizeSpanAttributes(attributes),
    },
    fn
  );
}

function sanitizeSpanAttributes(
  attributes?: SpanAttributes
): Record<string, string | number | boolean> | undefined {
  if (!attributes) return undefined;

  const sanitized: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const SentryFlows = {
  orderCreate: <T>(fn: () => Promise<T>, shopId: string) =>
    withBusinessSpan("order.create", "commerce.order", fn, { shopId }),

  bookingCreate: <T>(fn: () => Promise<T>, expertId: string) =>
    withBusinessSpan("booking.create", "commerce.booking", fn, { expertId }),

  adminMutation: <T>(fn: () => Promise<T>, action: string, resource: string) =>
    withBusinessSpan(`admin.${action}`, "admin.mutation", fn, { resource, action }),
};
