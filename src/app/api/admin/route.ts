import { pendingServiceWhere, pendingShopWhere } from "@/lib/admin/dashboard-metrics";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// GET /api/admin  — Admin dashboard counts
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const [
      totalUsers,
      pendingShops,
      pendingServices,
      pendingVerifications,
    ] = await Promise.all([
      db.user.count(),
      db.shop.count({ where: pendingShopWhere }),
      db.expertService.count({ where: pendingServiceWhere }),
      db.user.count({ where: { verificationRequestStatus: "PENDING" } }),
    ]);

    return NextResponse.json(
      {
        totalUsers,
        pendingShops,
        pendingServices,
        pendingVerifications,
      },
      { headers: { "Cache-Control": "private, max-age=60" } }
    );
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/admin",
      method: "GET",
    });
    return NextResponse.json(
      formatAPIError(error),
      { status: 500 }
    );
  }
}
