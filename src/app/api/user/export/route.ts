import { requireActiveSession } from "@/lib/session-guards";
import { buildUserDataExport } from "@/lib/legal/user-export";
import { logErrorToSentry } from "@/lib/error-handler";
import { createExportJobRecord } from "@/lib/jobs/export-store";
import { enqueueUserExport } from "@/lib/jobs/enqueue";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/user/export — GDPR data portability export (JSON or async job) */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveSession();
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.account, session.user.id),
      "UserExport",
      { quotaExceededMessage: "Export limit reached. Try again later." }
    );
    if (rateLimitResponse) return rateLimitResponse;

    const forceSync = req.nextUrl.searchParams.get("sync") === "1";
    const forceAsync = req.nextUrl.searchParams.get("async") === "1";
    const useAsync = !forceSync && (forceAsync || isFeatureEnabled("asyncExport"));

    if (useAsync) {
      try {
        const jobId = crypto.randomUUID();
        await createExportJobRecord(jobId, session.user.id);
        const queued = await enqueueUserExport({ jobId, userId: session.user.id });

        if (queued.queued) {
          return NextResponse.json(
            {
              jobId,
              status: "pending",
              statusUrl: `/api/user/export/${jobId}`,
              message: "Export queued. Poll statusUrl until completed.",
            },
            { status: 202 }
          );
        }
      } catch (asyncError) {
        logErrorToSentry(asyncError, { route: "[GET /api/user/export/async-fallback]" });
      }
    }

    const exportData = await buildUserDataExport(session.user.id);
    if (!exportData) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(exportData, {
      headers: {
        "Content-Disposition": `attachment; filename="thechattala-export-${session.user.id}.json"`,
      },
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/user/export]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
