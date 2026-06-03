import { requireActiveMutation } from "@/lib/session-guards";
import { CURRENT_POLICY_VERSION } from "@/lib/legal/policy";
import { recordPolicyAcceptance } from "@/lib/legal/consent";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { getClientIp } from "@/lib/security-audit";
import { NextRequest, NextResponse } from "next/server";

/** POST /api/user/policy-accept — record terms + privacy acceptance / re-consent */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const now = new Date();

    await db.user.update({
      where: { id: session.user.id },
      data: {
        policyAcceptedAt: now,
        policyVersion: CURRENT_POLICY_VERSION,
      },
    });

    await recordPolicyAcceptance(
      session.user.id,
      getClientIp(req.headers),
      req.headers.get("user-agent"),
      CURRENT_POLICY_VERSION
    );

    return NextResponse.json({
      success: true,
      policyVersion: CURRENT_POLICY_VERSION,
      policyAcceptedAt: now.toISOString(),
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/user/policy-accept]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
