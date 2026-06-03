import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { requireActiveSession } from "@/lib/session-guards";
import { NextResponse } from "next/server";

const expertServiceSelect = {
  id: true,
  profession: true,
  category: true,
  location: true,
  fee: true,
  bio: true,
  rating: true,
  isVerified: true,
  experienceYears: true,
} as const;

// GET /api/services/me — current user's expert service profile
export async function GET(): Promise<NextResponse> {
  try {
    const active = await requireActiveSession();
    if (active.error) return active.error;
    const { session } = active;

    const service = await db.expertService.findUnique({
      where: { userId: session.user.id },
      select: expertServiceSelect,
    });

    if (!service) {
      return NextResponse.json({ error: "You don't have an expert service yet." }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/services/me]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
