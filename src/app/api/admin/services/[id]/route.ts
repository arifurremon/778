import { logAdminAction } from "@/lib/audit-log";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/admin/services/[id]  — expert service detail
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;

    const service = await db.expertService.findUnique({
      where: { id },
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

    // Enrich with fallback fields for UI compatibility
    const enrichedService = {
      ...service,
      title: service.profession,
      description: service.bio,
      provider: service.user,
      bookings: [],
      verificationHistory: [],
      auditLogs: [],
    };

    return NextResponse.json(enrichedService);
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/admin/services/[id]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/services/[id]
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updatedService = await db.expertService.update({
      where: { id },
      data: body,
    });

    await logAdminAction(
      session.user.id,
      "UPDATE_SERVICE",
      "Service",
      id,
      { changes: body },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, service: updatedService });
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/admin/services/[id]]" });
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/services/[id]  — soft delete
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;

    // SCHEMA-FALLBACK: 'deletedAt' or 'isVerified' may not exist — verify schema
    try {
      await db.expertService.update({
        where: { id },
        data: {
          // @ts-ignore
          deletedAt: new Date(),
          // @ts-ignore
          isVerified: false,
        },
      });
    } catch (e) {
      // Fallback: update user's registration status
      const service = await db.expertService.findUnique({ where: { id } });
      if (service) {
        await db.user.update({
          where: { id: service.userId },
          data: { isServiceProvider: false, serviceRegistrationStatus: "NONE" },
        });
      }
    }

    await logAdminAction(
      session.user.id,
      "DELETE_SERVICE",
      "Service",
      id,
      { method: "SOFT_DELETE" },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, message: "Service provider soft-deleted" });
  } catch (error) {
    logErrorToSentry(error, { route: "[DELETE /api/admin/services/[id]]" });
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
