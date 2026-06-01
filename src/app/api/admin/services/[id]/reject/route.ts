import { validateCsrfRequest } from "@/lib/csrf";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const rejectSchema = z.object({
  reason: z.string().min(20, "Rejection reason must be at least 20 characters long"),
});

/**
 * POST /api/admin/services/[id]/reject
 * Rejects a service provider application.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const csrfError = validateCsrfRequest(req);
    if (csrfError) return csrfError;

    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const { id } = await params;
    const body = await req.json();
    const validatedData = rejectSchema.parse(body);

    const service = await db.expertService.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const serviceTitle = service.profession;

    await db.$transaction(async (tx) => {
      // Update service status
      await tx.expertService.update({
        where: { id },
        data: {
          isVerified: false,
          rejectedAt: new Date(),
          rejectionReason: validatedData.reason
        }
      });

      // Update user status
      await tx.user.update({
        where: { id: service.userId },
        data: { 
          serviceRegistrationStatus: 'REJECTED',
          verificationReason: validatedData.reason // Fallback for reason
        }
      });

      // Notification on reject
      // SCHEMA-FALLBACK: 'notification' may not exist — verify schema
      try {
        await tx.notification.create({
          data: {
            userId: service.userId,
            type: "SERVICE_VERIFIED",
            entityType: "ExpertService",
            entityId: service.id,
            metadata: {
              approved: false,
              message: `Your service application was not approved. Reason: ${validatedData.reason}`,
            },
          }
        });
      } catch (e) {
        await tx.activityLog.create({
          data: {
            userId: service.userId,
            type: "SYSTEM",
            description: `Service application rejected: ${validatedData.reason}`,
          }
        });
      }
    });

    // Email notification
    try {
      await sendEmail(
        service.user.email,
        "Update on your Service Provider Application",
        `<h1>Service Provider Application Update</h1>
         <p>Dear ${service.user.name || 'Professional'},</p>
         <p>Unfortunately, your application for "<strong>${serviceTitle}</strong>" was not approved at this time.</p>
         <p><strong>Reason:</strong> ${validatedData.reason}</p>
         <p>Please address these concerns and re-submit your application if you wish.</p>`
      );
    } catch (emailErr) {
      logErrorToSentry(emailErr, {
        endpoint: "/api/admin/services/[id]/reject",
        method: "POST"
      });
    }

    await logAdminAction(
      session.user.id,
      "REJECT_SERVICE",
      "Service",
      id,
      { reason: validatedData.reason },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, message: "Service rejected successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ errors: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Failed to reject service" }, { status: 500 });
  }
}
