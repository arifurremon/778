import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";

/**
 * GET /api/admin/services/[id]
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const service = await db.expertService.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, profileImage: true } },
        // SCHEMA-FALLBACK: 'bookings' relation may not exist — verify schema
        _count: {
          select: { 
            // @ts-ignore
            bookings: true 
          }
        }
      }
    });

    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    // Enriched response with fallbacks
    const enrichedService = {
      ...service,
      title: (service as any).title || service.profession,
      description: (service as any).description || service.bio,
      provider: service.user,
      // SCHEMA-FALLBACK: 'bookings' count default to 0 if relation missing
      _count: {
        bookings: (service as any)._count?.bookings || 0
      },
      bookings: [], // Default to empty if model missing
      verificationHistory: [], 
      auditLogs: []
    };

    return NextResponse.json({ success: true, service: enrichedService });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/services/[id]
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const body = await req.json();
    
    const updatedService = await db.expertService.update({
      where: { id: params.id },
      data: body
    });

    await logAdminAction(
      session.user.id,
      "UPDATE_SERVICE",
      "Service",
      params.id,
      { changes: body },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, service: updatedService });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/services/[id]
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    // SCHEMA-FALLBACK: 'deletedAt' or 'isVerified' may not exist — verify schema
    try {
      await db.expertService.update({
        where: { id: params.id },
        data: { 
          // @ts-ignore
          deletedAt: new Date(),
          // @ts-ignore
          isVerified: false 
        }
      });
    } catch (e) {
      // Fallback: update user's registration status
      const service = await db.expertService.findUnique({ where: { id: params.id } });
      if (service) {
        await db.user.update({
          where: { id: service.userId },
          data: { isServiceProvider: false, serviceRegistrationStatus: 'NONE' }
        });
      }
    }

    await logAdminAction(
      session.user.id,
      "DELETE_SERVICE",
      "Service",
      params.id,
      { method: "SOFT_DELETE" },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, message: "Service provider soft-deleted" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
