import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shop = await db.shop.findUnique({
      where: { userId: session.user!.id },
      select: { id: true },
    });

    if (!shop) {
      return NextResponse.json({ error: "You don't own a shop" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
    const status = searchParams.get("status") as any;

    const whereClause: any = { shopId: shop.id };
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
          product: { select: { name: true, images: true } },
          buyer: { select: { email: true } },
        },
      }),
      db.order.count({ where: whereClause }),
    ]);

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      shopId: order.shopId,
      productId: order.productId,
      buyerId: order.buyerId,
      buyerName: order.buyerName,
      buyerPhone: order.buyerPhone,
      status: order.status,
      quantity: order.quantity,
      totalPrice: order.totalPrice.toNumber(),
      address: order.address,
      note: order.note,
      createdAt: order.createdAt,
      product: order.product,
      buyer: order.buyer,
    }));

    return NextResponse.json({
      shopId: shop.id,
      orders: formattedOrders,
      total,
      page,
      limit,
      nextPage: skip + limit < total ? page + 1 : null,
    }, { status: 200 });
  } catch (error) {
    logErrorToSentry(error, { route: "GET /api/orders/seller" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
