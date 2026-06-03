import { requireActiveSession } from "@/lib/session-guards";
import { buildUserDataExport } from "@/lib/legal/user-export";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { NextResponse } from "next/server";

/** GET /api/user/export — GDPR data portability export (JSON) */
export async function GET(): Promise<NextResponse> {
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
