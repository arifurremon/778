import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { reviewSelect, serializeProductReview } from "@/lib/review-utils";
import { requireActiveSession } from "@/lib/session-guards";
import { NextRequest, NextResponse } from "next/server";

// GET /api/reviews/seller — authenticated seller's product reviews
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveSession();
    if (active.error) return active.error;
    const { session } = active;

    const shop = await db.shop.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10))
    );
    const skip = (page - 1) * limit;

    const where = { shopId: shop.id };

    const [reviews, total] = await Promise.all([
      db.productReview.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: reviewSelect,
      }),
      db.productReview.count({ where }),
    ]);

    return NextResponse.json({
      reviews: reviews.map(serializeProductReview),
      total,
      page,
      limit,
      nextPage: skip + limit < total ? page + 1 : null,
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/reviews/seller]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
