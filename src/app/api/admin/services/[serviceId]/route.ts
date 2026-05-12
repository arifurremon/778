import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ serviceId: string }> };

// GET /api/admin/services/[serviceId] — expert service detail
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { serviceId } = await params;

    const service = await db.expertService.findUnique({
      where: { id: serviceId },
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
            email: true,
            profileImage: true,
            isVerified: true,
            isServiceProvider: true,
            serviceRegistrationStatus: true,
            mobile: true,
            location: true,
            createdAt: true,
            activityLogs: {
              take: 5,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                type: true,
                description: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found." }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/admin/services/[serviceId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
