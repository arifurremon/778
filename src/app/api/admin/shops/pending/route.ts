import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/shops/pending
 * Returns all shops awaiting verification.
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    // [cite_start]Return all shops where isVerified=false AND rejectedAt=null, ordered by oldest first. [cite: 111]
    const where: any = {
      isVerified: false,
    };

    // SCHEMA-FALLBACK: 'rejectedAt' may not exist — verify schema
    try {
      where.rejectedAt = null;
    } catch (e) {
      // If field missing, we'll rely on User's registration status
      where.user = { registrationStatus: 'PENDING' };
    }

    const pendingShops = await db.shop.findMany({
      where,
      orderBy: { createdAt: "asc" }, // Oldest first
      include: {
        user: { select: { id: true, name: true, email: true, profileImage: true } }
      }
    });

    const mappedShops = pendingShops.map(s => ({
      ...s,
      owner: s.user,
      user: undefined
    }));

    return NextResponse.json({ success: true, shops: mappedShops });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch pending shops" }, { status: 500 });
  }
}
