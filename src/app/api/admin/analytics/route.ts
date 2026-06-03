import { requireAdmin } from "@/lib/admin-auth";
import { getAnalyticsOverview, parseTimeRange } from "@/lib/admin/dashboard-metrics";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/admin/analytics — platform overview (SQL-backed, shared with admin UI) */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const range = req.nextUrl.searchParams.get("range");
    const overview = await getAnalyticsOverview(range);
    const { range: _rangeKey, ...overviewData } = overview;

    return NextResponse.json({
      range: parseTimeRange(range).key,
      ...overviewData,
      summary: {
        totalUsers: overview.totals.users,
        totalPosts: overview.totals.posts,
        totalShops: overview.totals.shops,
        totalServices: overview.totals.services,
        totalOrders: overview.totals.orders,
      },
    });
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/admin/analytics",
      method: "GET",
    });
    return NextResponse.json(formatAPIError(error), { status: 500 });
  }
}
