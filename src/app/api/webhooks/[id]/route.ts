import { requireActiveMutation } from "@/lib/session-guards";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;

    const { id } = await params;
    const existing = await db.webhookSubscription.findFirst({
      where: { id, userId: active.session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook subscription not found." }, { status: 404 });
    }

    await db.webhookSubscription.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logErrorToSentry(error, { route: "DELETE /api/webhooks/[id]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
