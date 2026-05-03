import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ expertId: string }> };

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { expertId } = await params;

    const service = await db.expertService.findUnique({
      where: { id: expertId },
      select: {
        id: true,
        profession: true,
        category: true,
        location: true,
        experienceYears: true,
        fee: true,
        bio: true,
        qualifications: true,
        rating: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            preferredName: true,
            username: true,
            profileImage: true,
            isVerified: true,
            location: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Expert service not found." }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("[GET /api/services/[expertId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
