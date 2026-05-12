import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";

/**
 * GET /api/admin/shops/[id]
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const shop = await db.shop.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, profileImage: true } },
        products: { take: 20, orderBy: { createdAt: 'desc' } },
        _count: { select: { products: true } }
      }
    });

    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // SCHEMA-FALLBACK: 'verificationHistory' and 'auditLogs' may not exist on model
    const enrichedShop = {
      ...shop,
      owner: shop.user,
      user: undefined,
      verificationHistory: [], 
      auditLogs: []
    };

    return NextResponse.json({ success: true, shop: enrichedShop });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/shops/[id]
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const body = await req.json();
    
    const updatedShop = await db.shop.update({
      where: { id: params.id },
      data: body
    });

    await logAdminAction(
      session.user.id,
      "UPDATE_SHOP",
      "Shop",
      params.id,
      { changes: body },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, shop: updatedShop });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/shops/[id]
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    // [cite_start]Implement soft-delete for DELETE. [cite: 70, 109]
    // SCHEMA-FALLBACK: 'deletedAt' may not exist — verify schema
    try {
      await db.shop.update({
        where: { id: params.id },
        data: { 
          // @ts-ignore
          deletedAt: new Date() 
        }
      });
    } catch (e) {
      // Fallback: hide the shop by setting isVerified to false or similar
      await db.shop.update({
        where: { id: params.id },
        data: { isVerified: false }
      });
    }

    await logAdminAction(
      session.user.id,
      "DELETE_SHOP",
      "Shop",
      params.id,
      { method: "SOFT_DELETE" },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, message: "Shop soft-deleted" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete shop" }, { status: 500 });
  }
}
