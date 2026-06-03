import { requireActiveMutation } from "@/lib/session-guards";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { reviewSelect, serializeProductReview } from "@/lib/review-utils";
import { sanitizeUserInput } from "@/lib/sanitize";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = { params: Promise<{ reviewId: string }> };

const patchReviewSchema = z.object({
  reply: z.string().min(1, "Reply cannot be empty.").max(2000),
});

// PATCH /api/reviews/[reviewId] — shop owner replies to a review
export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;
    const { reviewId } = await params;

    const body: unknown = await req.json();
    const parsed = patchReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const review = await db.productReview.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        buyerId: true,
        shop: {
          select: {
            userId: true,
            name: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    if (review.shop.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.$transaction(async (tx) => {
      const saved = await tx.productReview.update({
        where: { id: reviewId },
        data: {
          reply: sanitizeUserInput(parsed.data.reply),
        },
        select: reviewSelect,
      });

      await tx.notification.create({
        data: {
          userId: review.buyerId,
          actorId: session.user.id,
          type: "NEW_PRODUCT_REVIEW",
          entityType: "ProductReview",
          entityId: review.id,
          metadata: {
            reviewId: review.id,
            shopName: review.shop.name,
            replyPreview: parsed.data.reply.slice(0, 120),
          },
        },
      });

      return saved;
    });

    return NextResponse.json({ review: serializeProductReview(updated) });
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/reviews/[reviewId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
