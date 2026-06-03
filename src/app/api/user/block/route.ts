import { NextRequest, NextResponse } from "next/server";
import { requireActiveMutation, requireActiveUser } from "@/lib/session-guards";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const active = await requireActiveUser();
    if (active.error) return active.error;
    const { session } = active;

    const blocks = await db.blockedUser.findMany({
      where: { blockerId: session.user.id },
      select: { blockedId: true }
    });

    return NextResponse.json({ blockedUserIds: blocks.map(b => b.blockedId) });
  } catch (error) {
    logErrorToSentry(error, { route: "GET /api/user/block" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const blockSchema = z.object({
  blockedId: z.string().uuid()
});

export async function POST(req: NextRequest) {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.blocks, session.user.id),
      "Blocks"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const result = blockSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message ?? "Validation failed." }, { status: 400 });
    }

    const { blockedId } = result.data;

    if (blockedId === session.user.id) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    const blockedUser = await db.blockedUser.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: blockedId
        }
      },
      update: {},
      create: {
        blockerId: session.user.id,
        blockedId: blockedId
      }
    });

    return NextResponse.json({ success: true, blockedUser }, { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "POST /api/user/block" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
