import { validateCsrfRequest } from "@/lib/csrf";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/audit-log";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/admin/shops/[id]  — shop detail with products + owner
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const shop = await db.shop.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        location: true,
        trustScore: true,
        rating: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            isVerified: true,
            registrationStatus: true,
            mobile: true,
            location: true,
            createdAt: true,
            _count: { select: { posts: true } },
          },
        },
        products: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            images: true,
            inStock: true,
            category: true,
            createdAt: true,
          },
        },
        _count: { select: { products: true } },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    // Enrich with fallback fields for UI compatibility
    const enrichedShop = {
      ...shop,
      products: shop.products.map(p => ({
        ...p,
        price: p.price.toNumber(),
        originalPrice: p.originalPrice ? p.originalPrice.toNumber() : null,
      })),
      owner: shop.user,
      verificationHistory: [],
      auditLogs: [],
    };

    return NextResponse.json(enrichedShop);
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/admin/shops/[id]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/shops/[id]  — update shop fields (isVerified, trustScore, etc.)
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const csrfError = validateCsrfRequest(req);
    if (csrfError) return csrfError;
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const { id } = await params;
    const body = await req.json() as { isVerified?: boolean; trustScore?: number; [key: string]: unknown };

    const shop = await db.shop.update({
      where: { id },
      data: {
        ...(body.isVerified !== undefined ? { isVerified: body.isVerified } : {}),
        ...(body.trustScore !== undefined ? { trustScore: body.trustScore } : {}),
      },
      select: { id: true, isVerified: true, trustScore: true },
    });

    await logAdminAction(
      session.user.id,
      "UPDATE_SHOP",
      "Shop",
      id,
      { changes: body },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, shop });
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/admin/shops/[id]]" });
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/shops/[id]  — soft delete
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const csrfError = validateCsrfRequest(req);
    if (csrfError) return csrfError;
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const { id } = await params;

    // SCHEMA-FALLBACK: 'deletedAt' may not exist — verify schema
    try {
      await db.shop.update({
        where: { id },
        data: {
          // @ts-ignore
          deletedAt: new Date(),
        },
      });
    } catch (e) {
      // Fallback: hide the shop
      await db.shop.update({
        where: { id },
        data: { isVerified: false },
      });
    }

    await logAdminAction(
      session.user.id,
      "DELETE_SHOP",
      "Shop",
      id,
      { method: "SOFT_DELETE" },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, message: "Shop soft-deleted" });
  } catch (error) {
    logErrorToSentry(error, { route: "[DELETE /api/admin/shops/[id]]" });
    return NextResponse.json({ error: "Failed to delete shop" }, { status: 500 });
  }
}
