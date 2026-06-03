import { requireActiveSession } from "@/lib/session-guards";
import { getExportJobForUser } from "@/lib/jobs/export-status";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ jobId: string }> };

/** GET /api/user/export/[jobId] — poll async GDPR export job */
export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const active = await requireActiveSession();
    if (active.error) return active.error;

    const { jobId } = await params;
    const response = await getExportJobForUser(jobId, active.session.user.id);
    return response ?? NextResponse.json({ error: "Export job not found." }, { status: 404 });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/user/export/[jobId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
