import { requireActiveMutation } from "@/lib/session-guards";
import { bookingSelect, serializeServiceBooking } from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { sendNotification, NotificationType } from "@/lib/notification-service";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = { params: Promise<{ bookingId: string }> };

const patchBookingSchema = z.object({
  status: z.enum(["CONFIRMED", "REJECTED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  subStatus: z.enum(["CONFIRMED", "ON_MY_WAY", "SERVICE_STARTED"]).optional(),
});

const EXPERT_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "REJECTED"],
  CONFIRMED: ["ONGOING", "COMPLETED", "CANCELLED"],
  ONGOING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.bookings, session.user.id),
      "Bookings"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { bookingId } = await params;

    const body: unknown = await req.json();
    const parsed = patchBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    if (!parsed.data.status && !parsed.data.subStatus) {
      return NextResponse.json({ error: "No update fields provided." }, { status: 400 });
    }

    const booking = await db.serviceBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        subStatus: true,
        clientId: true,
        expertService: {
          select: {
            userId: true,
            profession: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const isClient = booking.clientId === session.user.id;
    const isExpert = booking.expertService.userId === session.user.id;

    if (!isClient && !isExpert) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let nextStatus = parsed.data.status ?? booking.status;
    let nextSubStatus =
      parsed.data.subStatus !== undefined ? parsed.data.subStatus : booking.subStatus;

    if (isClient && !isExpert) {
      if (nextStatus !== "CANCELLED") {
        return NextResponse.json({ error: "Clients can only cancel bookings." }, { status: 403 });
      }
      if (booking.status !== "PENDING") {
        return NextResponse.json({ error: "Only pending bookings can be cancelled." }, { status: 400 });
      }
      nextSubStatus = null;
    }

    if (isExpert) {
      if (parsed.data.status) {
        const allowed = EXPERT_STATUS_TRANSITIONS[booking.status] ?? [];
        if (!allowed.includes(parsed.data.status)) {
          return NextResponse.json(
            { error: `Invalid transition from ${booking.status} to ${parsed.data.status}` },
            { status: 400 }
          );
        }
      }

      if (parsed.data.status === "CONFIRMED" && !parsed.data.subStatus) {
        nextSubStatus = "CONFIRMED";
      }

      if (
        parsed.data.subStatus &&
        ["ON_MY_WAY", "SERVICE_STARTED"].includes(parsed.data.subStatus)
      ) {
        nextStatus = "ONGOING";
      }

      if (parsed.data.status === "COMPLETED" || parsed.data.status === "REJECTED") {
        nextSubStatus = null;
      }
    }

    const updated = await db.serviceBooking.update({
      where: { id: bookingId },
      data: {
        status: nextStatus as never,
        subStatus: nextSubStatus as never,
      },
      select: bookingSelect,
    });

    const recipientId = isExpert ? booking.clientId : booking.expertService.userId;

    await sendNotification({
      userId: recipientId,
      actorId: session.user.id,
      type: NotificationType.SERVICE_UPDATED,
      entityType: "ServiceBooking",
      entityId: booking.id,
      metadata: {
        bookingId: booking.id,
        oldStatus: booking.status,
        newStatus: nextStatus,
        subStatus: nextSubStatus,
        profession: booking.expertService.profession,
      },
    });

    return NextResponse.json({ booking: serializeServiceBooking(updated) });
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/bookings/[bookingId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
