import { anonymizeUserAccount } from "@/lib/legal/account-deletion";
import { requireActiveMutation } from "@/lib/session-guards";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { getClientIp } from "@/lib/security-audit";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.account, session.user.id),
      "Account"
    );
    if (rateLimitResponse) return rateLimitResponse;

    await anonymizeUserAccount({
      userId: session.user.id,
      ipAddress: getClientIp(req.headers),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted and personal data anonymized.",
    });
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/user/delete-account",
      method: "DELETE",
    });
    return NextResponse.json(formatAPIError(error), { status: 500 });
  }
}
