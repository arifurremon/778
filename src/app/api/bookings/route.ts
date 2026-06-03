import { auth } from "@/lib/auth";
import { bookingSelect, serializeServiceBooking } from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

// GET /api/bookings — authenticated client's bookings
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10))
    );
    const skip = (page - 1) * limit;

    const where = { clientId: session.user.id };

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
      bookings: bookings.map(serializeServiceBooking),
      total,
      page,
      limit,
      nextPage: skip + limit < total ? page + 1 : null,
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/bookings]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
