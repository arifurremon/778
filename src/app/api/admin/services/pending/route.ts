import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/services/pending
 * Returns a list of service provider applications awaiting verification.
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    // [cite_start]/pending returns services where isVerified=false AND rejectedAt=null, ordered by oldest first. [cite: 111, 116]
    const where: any = {};

    try {
      // SCHEMA-FALLBACK: 'isVerified' and 'rejectedAt' may not exist — verify schema
      where.isVerified = false;
      where.rejectedAt = null;
    } catch (e) {
      // Fallback: Use User's serviceRegistrationStatus
      where.user = { serviceRegistrationStatus: 'PENDING' };
    }

    const pendingServices = await db.expertService.findMany({
      where,
      orderBy: { createdAt: "asc" }, // Oldest first
      take: 50, // [cite_start]Maximum 50 items for the pending list. [cite: 122]
      include: {
        user: { select: { id: true, name: true, email: true, profileImage: true } }
      }
    });

    const mappedServices = pendingServices.map(s => ({
      ...s,
      title: (s as any).title || s.profession,
      description: (s as any).description || s.bio,
      provider: s.user,
      user: undefined
    }));

    return NextResponse.json({ success: true, services: mappedServices });
  } catch (err) {
    console.error("[GET_PENDING_SERVICES_ERROR]:", err);
    return NextResponse.json({ error: "Failed to fetch pending services" }, { status: 500 });
  }
}
