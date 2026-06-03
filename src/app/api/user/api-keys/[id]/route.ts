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
    const existing = await db.apiKey.findFirst({
      where: { id, userId: active.session.user.id, revokedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "API key not found." }, { status: 404 });
    }

    await db.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logErrorToSentry(error, { route: "DELETE /api/user/api-keys/[id]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
