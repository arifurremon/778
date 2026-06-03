import { runDataRetentionJobs } from "@/lib/legal/account-deletion";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/cron/data-retention — purge old logs and hard-delete stale accounts */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDataRetentionJobs();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/cron/data-retention]" });
    return NextResponse.json({ error: "Retention job failed" }, { status: 500 });
  }
}
