import { requireActiveMutation } from "@/lib/session-guards";
import { bookingSelect, serializeServiceBooking } from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { withIdempotency, idempotentError } from "@/lib/idempotency";
import { sendNotification, NotificationType } from "@/lib/notification-service";
import { SentryFlows } from "@/lib/observability/sentry-spans";
import { withRouteObservability } from "@/lib/observability/with-route-observability";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { checkRateLimit, jsonWithRateLimitHeaders } from "@/lib/rate-limit-request";
import { sanitizeUserInput } from "@/lib/sanitize";
import { emitWebhookEvent } from "@/lib/webhooks/delivery";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = { params: Promise<{ expertId: string }> };

const createBookingSchema = z
  .object({
    scheduledDate: z.string().datetime().optional(),
    address: z.string().min(5, "Address must be at least 5 characters.").optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine((data) => Boolean(data.scheduledDate || data.address?.trim()), {
    message: "Provide either a preferred date or a service address.",
  });

// POST /api/services/[expertId]/bookings — client books an expert service
export const POST = withRouteObservability(async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimit = await checkRateLimit(
      () => runRateLimit(rateLimiters.bookings, session.user.id),
      "Bookings",
      { quotaExceededMessage: "Booking limit reached (10/hour)." }
    );
    if (rateLimit.blocked) return rateLimit.blocked;

    const { expertId } = await params;
    const body: unknown = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return jsonWithRateLimitHeaders(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 },
        rateLimit.headers
      );
    }

    const idempotent = await withIdempotency(req, {
      userId: session.user.id,
      route: `POST /api/services/${expertId}/bookings`,
      body: parsed.data,
      handler: async () => {
        const result = await createBooking(session.user, expertId, parsed.data);
        if ("error" in result) {
          return idempotentError(result.error ?? "Request failed", result.status ?? 400);
        }
        return {
          status: 201,
          body: serializeServiceBooking(result.booking),
          resourceId: result.booking.id,
        };
      },
    });
    if (idempotent) {
      for (const [key, value] of Object.entries(rateLimit.headers)) {
        idempotent.headers.set(key, value);
      }
      return idempotent;
    }

    const result = await createBooking(session.user, expertId, parsed.data);
    if ("error" in result) {
      return jsonWithRateLimitHeaders({ error: result.error }, { status: result.status }, rateLimit.headers);
    }

    return jsonWithRateLimitHeaders(
      serializeServiceBooking(result.booking),
      { status: 201 },
      rateLimit.headers
    );
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/services/[expertId]/bookings]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}, { route: "POST /api/services/[expertId]/bookings" });

async function createBooking(
  user: { id: string; name?: string | null },
  expertId: string,
  data: z.infer<typeof createBookingSchema>
) {
  const service = await db.expertService.findUnique({
    where: { id: expertId },
    select: {
      id: true,
      userId: true,
      profession: true,
      fee: true,
      isVerified: true,
    },
  });

  if (!service) {
    return { error: "Expert service not found.", status: 404 };
  }

  if (service.userId === user.id) {
    return { error: "You cannot book your own service.", status: 400 };
  }

  const { scheduledDate, address, notes } = data;

  const booking = await SentryFlows.bookingCreate(
    () =>
      db.serviceBooking.create({
        data: {
          expertServiceId: service.id,
          clientId: user.id,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          address: address ? sanitizeUserInput(address) : null,
          notes: notes ? sanitizeUserInput(notes) : null,
          fee: service.fee,
        },
        select: bookingSelect,
      }),
    expertId
  );

  await sendNotification({
    userId: service.userId,
    actorId: user.id,
    type: NotificationType.SERVICE_BOOKED,
    entityType: "ServiceBooking",
    entityId: booking.id,
    metadata: {
      bookingId: booking.id,
      expertServiceId: service.id,
      profession: service.profession,
      clientName: user.name ?? "Client",
    },
  });

  await emitWebhookEvent(service.userId, "booking.created", {
    bookingId: booking.id,
    expertServiceId: service.id,
    clientId: user.id,
    status: booking.status,
  });

  return { booking };
}
