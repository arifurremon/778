import { auth } from "@/lib/auth";
import { bookingSelect, serializeServiceBooking } from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

// GET /api/bookings/expert — bookings for the authenticated expert's service
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = await db.expertService.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json({ error: "You don't have an expert service." }, { status: 403 });
    }

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10))
    );
    const skip = (page - 1) * limit;
    const status = req.nextUrl.searchParams.get("status") ?? undefined;

    const where = {
      expertServiceId: service.id,
      ...(status ? { status: status as never } : {}),
    };

    const [bookings, total] = await Promise.all([
      db.serviceBooking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: bookingSelect,
      }),
      db.serviceBooking.count({ where }),
    ]);

    return NextResponse.json({
      expertServiceId: service.id,
      bookings: bookings.map(serializeServiceBooking),
      total,
      page,
      limit,
      nextPage: skip + limit < total ? page + 1 : null,
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/bookings/expert]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
