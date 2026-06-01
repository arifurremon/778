import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { requireActiveMutation } from "@/lib/session-guards";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

const ALLOWED_SELLER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const { orderId } = await params;

    const body = await req.json();
    const result = patchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message ?? "Validation failed." }, { status: 400 });
    }

    const { status: newStatus } = result.data;

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { shop: true, product: { select: { name: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isBuyer = order.buyerId === session.user!.id;
    const isSeller = order.shop.userId === session.user!.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Buyer logic
    if (isBuyer && !isSeller) {
      if (newStatus !== "CANCELLED") {
        return NextResponse.json({ error: "Buyers can only cancel orders" }, { status: 403 });
      }
      if (order.status !== "PENDING") {
        return NextResponse.json({ error: "Can only cancel pending orders" }, { status: 400 });
      }
    }

    // Seller logic
    if (isSeller) {
      const allowedNext = ALLOWED_SELLER_TRANSITIONS[order.status] || [];
      if (!allowedNext.includes(newStatus)) {
        return NextResponse.json(
          { error: `Invalid transition from ${order.status} to ${newStatus}` },
          { status: 400 }
        );
      }
    }

    const updatedOrder = await db.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      // Notify the other party
      const recipientId = isBuyer ? order.shop.userId : order.buyerId;
      
      await tx.notification.create({
        data: {
          userId: recipientId,
          actorId: session.user!.id,
          type: "ORDER_UPDATED",
          entityType: "Order",
          entityId: order.id,
          metadata: {
            orderId: order.id,
            oldStatus: order.status,
            newStatus,
            productName: order.product.name,
          },
        },
      });

      return updated;
    });

    return NextResponse.json({ order: updatedOrder }, { status: 200 });
  } catch (error) {
    logErrorToSentry(error, { route: "PATCH /api/orders/[orderId]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
