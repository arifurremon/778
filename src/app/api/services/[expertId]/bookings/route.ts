import { requireActiveMutation } from "@/lib/session-guards";
import { bookingSelect, serializeServiceBooking } from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { sanitizeUserInput } from "@/lib/sanitize";
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
export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;
    const { expertId } = await params;

    const body: unknown = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

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
      return NextResponse.json({ error: "Expert service not found." }, { status: 404 });
    }

    if (service.userId === session.user.id) {
      return NextResponse.json({ error: "You cannot book your own service." }, { status: 400 });
    }

    const { scheduledDate, address, notes } = parsed.data;

    const booking = await db.$transaction(async (tx) => {
      const created = await tx.serviceBooking.create({
        data: {
          expertServiceId: service.id,
          clientId: session.user.id,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          address: address ? sanitizeUserInput(address) : null,
          notes: notes ? sanitizeUserInput(notes) : null,
          fee: service.fee,
        },
        select: bookingSelect,
      });

      await tx.notification.create({
        data: {
          userId: service.userId,
          actorId: session.user.id,
          type: "SERVICE_BOOKED",
          entityType: "ServiceBooking",
          entityId: created.id,
          metadata: {
            bookingId: created.id,
            expertServiceId: service.id,
            profession: service.profession,
            clientName: session.user.name ?? "Client",
          },
        },
      });

      return created;
    });

    return NextResponse.json(serializeServiceBooking(booking), { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/services/[expertId]/bookings]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
