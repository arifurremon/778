import { logErrorToSentry } from "@/lib/error-handler";
import { requireActiveMutation } from "@/lib/session-guards";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ shopId: string; productId: string }> };

// ---------------------------------------------------------------------------
// DELETE /api/shops/[shopId]/products/[productId]  — owner only
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const { shopId, productId } = await params;

    // Verify shop ownership
    const shop = await db.shop.findUnique({
      where: { id: shopId },
      select: { userId: true },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    if (shop.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden. You do not own this shop." },
        { status: 403 }
      );
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, shopId: true },
    });

    if (!product || product.shopId !== shopId) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    await db.product.delete({ where: { id: productId } });

    return NextResponse.json({ success: true, message: "Product deleted." });
  } catch (error) {
    logErrorToSentry(error, { route: "[DELETE /api/shops/[shopId]/products/[productId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
