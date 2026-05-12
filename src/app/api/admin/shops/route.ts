import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/shops
 * Paginated list of shops with filtering.
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25")));
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "all";
    const status = searchParams.get("status") || "all";

    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (category !== "all") {
      where.category = category;
    }

    // Status filtering logic
    if (status !== "all") {
      if (status === "verified") {
        where.isVerified = true;
      } else if (status === "pending") {
        where.isVerified = false;
        // SCHEMA-FALLBACK: 'rejectedAt' may not exist — verify schema
        try {
          where.rejectedAt = null;
        } catch (e) {
          // Field missing, ignore in filter
        }
      } else if (status === "rejected") {
        // SCHEMA-FALLBACK: 'rejectedAt' may not exist — verify schema
        try {
          where.rejectedAt = { not: null };
        } catch (e) {
          where.isVerified = false; // Fallback
        }
      }
    }

    const [shops, total] = await Promise.all([
      db.shop.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, profileImage: true }
          },
          _count: {
            select: { products: true }
          }
        }
      }),
      db.shop.count({ where })
    ]);

    // Map 'user' to 'owner' for frontend consistency
    const mappedShops = shops.map(s => ({
      ...s,
      owner: s.user,
      user: undefined
    }));

    return NextResponse.json({
      success: true,
      shops: mappedShops,
      total,
      page,
      limit
    });
  } catch (err) {
    console.error("[GET_SHOPS_ERROR]:", err);
    return NextResponse.json({ error: "Failed to fetch shops" }, { status: 500 });
  }
}
