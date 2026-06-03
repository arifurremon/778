import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { sendNotification, NotificationType } from "@/lib/notification-service";
import {
  normalizeReviewScope,
  recalculateShopRating,
  reviewSelect,
  serializeProductReview,
} from "@/lib/review-utils";
import { requireActiveMutation } from "@/lib/session-guards";
import { sanitizeUserInput } from "@/lib/sanitize";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = { params: Promise<{ shopId: string }> };

const createReviewSchema = z.object({
  productId: z.string().min(1).default("general"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3, "Review must be at least 3 characters.").max(2000),
});

async function getReviewEligibility(
  shopId: string,
  scope: string,
  userId: string | undefined,
  shopOwnerId: string
) {
  if (!userId || userId === shopOwnerId) {
    return { canReview: false, hasReviewed: false };
  }

  const existingReview = userId
    ? await db.productReview.findUnique({
        where: {
          buyerId_shopId_scope: {
            buyerId: userId,
            shopId,
            scope,
          },
        },
        select: { id: true },
      })
    : null;

  if (existingReview) {
    return { canReview: false, hasReviewed: true };
  }

  const orderWhere =
    scope === "general"
      ? {
          shopId,
          buyerId: userId,
          status: "DELIVERED" as const,
        }
      : {
          shopId,
          buyerId: userId,
          productId: scope,
          status: "DELIVERED" as const,
        };

  const deliveredOrder = await db.order.findFirst({
    where: orderWhere,
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    canReview: Boolean(deliveredOrder),
    hasReviewed: false,
    orderId: deliveredOrder?.id ?? null,
  };
}

// GET /api/shops/[shopId]/reviews — list reviews for a shop or product scope
export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { shopId } = await params;
    const scope = normalizeReviewScope(req.nextUrl.searchParams.get("productId") ?? "general");

    const shop = await db.shop.findUnique({
      where: { id: shopId },
      select: { id: true, userId: true },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    const session = await auth();
    const [reviews, eligibility] = await Promise.all([
      db.productReview.findMany({
        where: { shopId, scope },
        orderBy: { createdAt: "desc" },
        select: reviewSelect,
      }),
      getReviewEligibility(shopId, scope, session?.user?.id, shop.userId),
    ]);

    const serialized = reviews.map(serializeProductReview);
    const averageRating =
      serialized.length > 0
        ? Math.round(
            (serialized.reduce((total, review) => total + review.rating, 0) / serialized.length) *
              10
          ) / 10
        : 5;

    return NextResponse.json({
      reviews: serialized,
      averageRating,
      canReview: eligibility.canReview,
      hasReviewed: eligibility.hasReviewed,
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/shops/[shopId]/reviews]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/shops/[shopId]/reviews — verified buyer posts a review
export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;
    const { shopId } = await params;

    const body: unknown = await req.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const scope = normalizeReviewScope(parsed.data.productId);
    const { rating, comment } = parsed.data;

    const shop = await db.shop.findUnique({
      where: { id: shopId },
      select: { id: true, userId: true, name: true },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    if (shop.userId === session.user.id) {
      return NextResponse.json({ error: "You cannot review your own shop." }, { status: 400 });
    }

    if (scope !== "general") {
      const product = await db.product.findFirst({
        where: { id: scope, shopId },
        select: { id: true },
      });

      if (!product) {
        return NextResponse.json({ error: "Product not found in this shop." }, { status: 404 });
      }
    }

    const eligibility = await getReviewEligibility(
      shopId,
      scope,
      session.user.id,
      shop.userId
    );

    if (eligibility.hasReviewed) {
      return NextResponse.json({ error: "You have already reviewed this item." }, { status: 409 });
    }

    if (!eligibility.canReview || !eligibility.orderId) {
      return NextResponse.json(
        { error: "Only verified buyers with delivered orders can leave a review." },
        { status: 403 }
      );
    }

    const review = await db.$transaction(async (tx) => {
      const created = await tx.productReview.create({
        data: {
          shopId,
          scope,
          productId: scope === "general" ? null : scope,
          buyerId: session.user.id,
          orderId: eligibility.orderId,
          rating,
          comment: sanitizeUserInput(comment),
          isVerified: true,
        },
        select: reviewSelect,
      });

      await recalculateShopRating(tx, shopId);

      return created;
    });

    await sendNotification({
      userId: shop.userId,
      actorId: session.user.id,
      type: NotificationType.NEW_PRODUCT_REVIEW,
      entityType: "ProductReview",
      entityId: review.id,
      metadata: {
        reviewId: review.id,
        shopId,
        shopName: shop.name,
        scope,
        rating,
        reviewerName: session.user.name ?? "Customer",
      },
    });

    return NextResponse.json(serializeProductReview(review), { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/shops/[shopId]/reviews]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
