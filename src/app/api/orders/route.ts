import { NextRequest, NextResponse } from "next/server";
import { requireActiveMutation, requireActiveUser } from "@/lib/session-guards";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { withIdempotency, idempotentError } from "@/lib/idempotency";
import { sendNotification, NotificationType } from "@/lib/notification-service";
import { SentryFlows } from "@/lib/observability/sentry-spans";
import { withRouteObservability } from "@/lib/observability/with-route-observability";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { checkRateLimit, jsonWithRateLimitHeaders } from "@/lib/rate-limit-request";
import { emitWebhookEvent } from "@/lib/webhooks/delivery";
import { z } from "zod";

const orderSchema = z.object({
  shopId: z.string().uuid(),
  productId: z.string().uuid(),
  phone: z.string().regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Invalid Bangladeshi phone number"),
  address: z.string().min(1, "Address is required"),
  quantity: z.number().int().positive().max(99).optional().default(1),
  note: z.string().optional(),
});

class OrderCreateError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function createOrder(
  user: { id: string; name?: string | null },
  data: z.infer<typeof orderSchema>
) {
  const { shopId, productId, phone, address, quantity, note } = data;

  const shop = await db.shop.findUnique({
    where: { id: shopId },
  });

  if (!shop) {
    throw new OrderCreateError("Shop not found", 404);
  }

  const product = await db.product.findUnique({
    where: { id: productId, shopId },
  });

  if (!product) {
    throw new OrderCreateError("Product not found", 400);
  }

  if (!product.inStock) {
    throw new OrderCreateError("Product is out of stock", 400);
  }

  const totalPrice = product.price.toNumber() * quantity;

  const newOrder = await SentryFlows.orderCreate(
    () =>
      db.$transaction(async (tx) => {
        return tx.order.create({
          data: {
            shopId,
            productId,
            buyerId: user.id,
            buyerName: user.name || "Anonymous",
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
    actorId: user.id,
    type: NotificationType.NEW_ORDER,
    entityType: "Order",
    entityId: newOrder.id,
    metadata: {
      orderId: newOrder.id,
      productName: product.name,
      buyerName: user.name || "Anonymous",
    },
  });

  await emitWebhookEvent(shop.userId, "order.created", {
    orderId: newOrder.id,
    shopId,
    productId,
    buyerId: user.id,
    status: newOrder.status,
    totalPrice: newOrder.totalPrice,
  });

  return newOrder;
}

export const POST = withRouteObservability(async function POST(req: NextRequest) {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimit = await checkRateLimit(
      () => runRateLimit(rateLimiters.orders, session.user.id),
      "Orders",
      { quotaExceededMessage: "Order limit reached (5/hour)" }
    );
    if (rateLimit.blocked) return rateLimit.blocked;

    const body = await req.json();
    const result = orderSchema.safeParse(body);

    if (!result.success) {
      return jsonWithRateLimitHeaders(
        { error: result.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 },
        rateLimit.headers
      );
    }

    const idempotent = await withIdempotency(req, {
      userId: session.user!.id,
      route: "POST /api/orders",
      body: result.data,
      handler: async () => {
        try {
          const created = await createOrder(session.user!, result.data);
          return { status: 201, body: { order: created }, resourceId: created.id };
        } catch (error) {
          if (error instanceof OrderCreateError) {
            return idempotentError(error.message, error.status);
          }
          throw error;
        }
      },
    });
    if (idempotent) {
      for (const [key, value] of Object.entries(rateLimit.headers)) {
        idempotent.headers.set(key, value);
      }
      return idempotent;
    }

    try {
      const newOrder = await createOrder(session.user!, result.data);
      return jsonWithRateLimitHeaders({ order: newOrder }, { status: 201 }, rateLimit.headers);
    } catch (error) {
      if (error instanceof OrderCreateError) {
        return jsonWithRateLimitHeaders({ error: error.message }, { status: error.status }, rateLimit.headers);
      }
      throw error;
    }
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
