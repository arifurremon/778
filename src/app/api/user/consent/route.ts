import { validateCsrfRequest } from "@/lib/csrf";
import { recordConsent } from "@/lib/legal/consent";
import { requireActiveSession } from "@/lib/session-guards";
import { getClientIp } from "@/lib/security-audit";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const consentSchema = z.object({
  type: z.enum(["COOKIES_ANALYTICS", "MARKETING"]),
  granted: z.boolean(),
});

/** POST /api/user/consent — persist cookie/marketing consent for authenticated users */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

  try {
    const active = await requireActiveSession();
    if (active.error) return active.error;

    const body: unknown = await req.json();
    const parsed = consentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    await recordConsent({
      userId: active.session.user.id,
      type: parsed.data.type,
      granted: parsed.data.granted,
      ipAddress: getClientIp(req.headers),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/user/consent]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
