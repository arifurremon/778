import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters } from "@/lib/rate-limit";
import { z } from "zod";

const orderSchema = z.object({
  shopId: z.string().uuid(),
  productId: z.string().uuid(),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  price: z.number().positive("Price must be a positive number."),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success } = await rateLimiters.orders.limit(session.user.id);
    if (!success) {
      return NextResponse.json({ error: "Order limit reached (5/hour)" }, { status: 429 });
    }

    const body = await req.json();
    const result = orderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message ?? "Validation failed." }, { status: 400 });
    }

    const { shopId, productId, phone, address, price, note } = result.data;

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
          totalPrice: price,
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
