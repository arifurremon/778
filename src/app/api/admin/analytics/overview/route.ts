import { requireAdmin } from "@/lib/admin-auth";
import { getAnalyticsOverview } from "@/lib/admin/dashboard-metrics";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range");
    const data = await getAnalyticsOverview(range);

    return NextResponse.json(
      { success: true, data },
      {
        headers: { "Cache-Control": "private, max-age=120" },
      }
    );
  } catch (err) {
    logErrorToSentry(err, {
      endpoint: "/api/admin/analytics/overview",
      method: "GET",
    });
    return NextResponse.json(formatAPIError(err), { status: 500 });
  }
}
