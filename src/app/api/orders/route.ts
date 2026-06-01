import { validateCsrfRequest } from "@/lib/csrf";
import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/session-guards";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters } from "@/lib/rate-limit";
import { z } from "zod";

const orderSchema = z.object({
  shopId: z.string().uuid(),
  productId: z.string().uuid(),
  phone: z.string().regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Invalid Bangladeshi phone number"),
  address: z.string().min(1, "Address is required"),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

try {
    const active = await requireActiveUser();
    if (active.error) return active.error;
    const { session } = active;

    const { success } = await rateLimiters.orders.limit(session.user.id);
    if (!success) {
      return NextResponse.json({ error: "Order limit reached (5/hour)" }, { status: 429 });
    }

    const body = await req.json();
    const result = orderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message ?? "Validation failed." }, { status: 400 });
    }

    const { shopId, productId, phone, address, note } = result.data;

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
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.inStock) {
      return NextResponse.json({ error: "Product is out of stock" }, { status: 400 });
    }

    const totalPrice = Number(product.price);

    const newOrder = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          shopId,
          productId,
          buyerId: session.user!.id,
          buyerName: session.user!.name || "Anonymous",
          buyerPhone: phone,
          address,
          quantity: 1,
          totalPrice,
          note,
          status: "PENDING",
        },
      });

      await tx.notification.create({
        data: {
          userId: shop.userId,
          actorId: session.user!.id,
          type: "NEW_ORDER",
          entityType: "Order",
          entityId: order.id,
          metadata: {
            orderId: order.id,
            productName: product.name,
            buyerName: session.user!.name || "Anonymous"
          },
        },
      });

      return order;
    });

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "POST /api/orders" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
