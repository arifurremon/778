import { NextRequest, NextResponse } from "next/server";
import { requireActiveMutation, requireActiveUser } from "@/lib/session-guards";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { sendNotification, NotificationType } from "@/lib/notification-service";
import { SentryFlows } from "@/lib/observability/sentry-spans";
import { withRouteObservability } from "@/lib/observability/with-route-observability";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { z } from "zod";

const orderSchema = z.object({
  shopId: z.string().uuid(),
  productId: z.string().uuid(),
  phone: z.string().regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Invalid Bangladeshi phone number"),
  address: z.string().min(1, "Address is required"),
  quantity: z.number().int().positive().max(99).optional().default(1),
  note: z.string().optional(),
});

export const POST = withRouteObservability(async function POST(req: NextRequest) {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.orders, session.user.id),
      "Orders",
      { quotaExceededMessage: "Order limit reached (5/hour)" }
    );
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const result = orderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message ?? "Validation failed." }, { status: 400 });
    }

    const { shopId, productId, phone, address, quantity, note } = result.data;

    const shop = await db.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const product = await db.product.findUnique({
      where: { id: productId, shopId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 400 });
    }

    if (!product.inStock) {
      return NextResponse.json({ error: "Product is out of stock" }, { status: 400 });
    }

    const totalPrice = product.price.toNumber() * quantity;

    const newOrder = await SentryFlows.orderCreate(
      () =>
        db.$transaction(async (tx) => {
          return tx.order.create({
            data: {
              shopId,
              productId,
              buyerId: session.user!.id,
              buyerName: session.user!.name || "Anonymous",
              buyerPhone: phone,
              address,
              quantity,
              totalPrice,
              note,
              status: "PENDING",
            },
          });
        }),
      shopId
    );

    await sendNotification({
      userId: shop.userId,
      actorId: session.user!.id,
      type: NotificationType.NEW_ORDER,
      entityType: "Order",
      entityId: newOrder.id,
      metadata: {
        orderId: newOrder.id,
        productName: product.name,
        buyerName: session.user!.name || "Anonymous",
      },
    });

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "POST /api/orders" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}, { route: "POST /api/orders" });

export async function GET(req: NextRequest) {
  try {
    const active = await requireActiveUser();
    if (active.error) return active.error;
    const { session } = active;

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
    const status = searchParams.get("status") as any;

    const whereClause: any = { buyerId: session.user!.id };
    if (status) {
      whereClause.status = status;
    }

    const skip = (Math.max(page, 1) - 1) * limit;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          shop: { select: { name: true } },
          product: { select: { name: true, images: true } }
        }
      }),
      db.order.count({ where: whereClause })
    ]);

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      nextPage: skip + limit < total ? page + 1 : null,
    }, { status: 200 });
  } catch (error) {
    logErrorToSentry(error, { route: "GET /api/orders" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
