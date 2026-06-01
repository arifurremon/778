import { requireAdmin } from "@/lib/admin-auth";
import { getDashboardOverview } from "@/lib/admin/dashboard-metrics";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/dashboard/stats
 * Fetches centralized statistics for the admin dashboard including growth metrics.
 */
export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { stats } = await getDashboardOverview();

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/admin/dashboard/stats",
      method: "GET",
    });
    return NextResponse.json(formatAPIError(error), { status: 500 });
  }
}
