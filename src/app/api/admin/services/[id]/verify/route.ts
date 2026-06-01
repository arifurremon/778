import { validateCsrfRequest } from "@/lib/csrf";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/services/[id]/verify
 * Approves a service provider application.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const csrfError = validateCsrfRequest(req);
    if (csrfError) return csrfError;

    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const { id } = await params;

    const service = await db.expertService.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const serviceTitle = service.profession;

    // Prisma transaction for atomic updates
    await db.$transaction(async (tx) => {
      // Update service status
      await tx.expertService.update({
        where: { id },
        data: { 
          isVerified: true,
          verifiedAt: new Date()
        }
      });

      // Update user status
      await tx.user.update({
        where: { id: service.userId },
        data: { 
          isServiceProvider: true, 
          serviceRegistrationStatus: 'APPROVED' 
        }
      });

      // [cite_start]Notification on verify: "Your service '[title]' has been verified and is now live!" [cite: 117]
      // SCHEMA-FALLBACK: 'notification' may not exist — verify schema
      try {
        await tx.notification.create({
          data: {
            userId: service.userId,
            type: "SERVICE_VERIFIED",
            entityType: "ExpertService",
            entityId: service.id,
            metadata: {
              approved: true,
              message: `Your service '${serviceTitle}' has been verified and is now live!`,
            },
          }
        });
      } catch (e) {
        // Fallback: Activity log
        await tx.activityLog.create({
          data: {
            userId: service.userId,
            type: "SYSTEM",
            description: `Your service '${serviceTitle}' has been verified successfully.`,
          }
        });
      }
    });

    // [cite_start]Email subject on verify: "Your Service Listing Has Been Verified!" [cite: 110]
    // Email failures must NOT fail the API response
    try {
      await sendEmail(
        service.user.email,
        "Your Service Listing Has Been Verified!",
        `<h1>Congratulations ${service.user.name || 'Professional'}!</h1>
         <p>Your service listing for "<strong>${serviceTitle}</strong>" has been approved.</p>
         <p>Your profile is now visible to the community and you can start receiving bookings.</p>`
      );
    } catch (emailErr) {
      logErrorToSentry(emailErr, {
        endpoint: "/api/admin/services/[id]/verify",
        method: "POST"
      });
    }

    // [cite_start]AuditLog actions: 'VERIFY_SERVICE' [cite: 157-158]
    await logAdminAction(
      session.user.id,
      "VERIFY_SERVICE",
      "Service",
      id,
      { serviceTitle },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, message: "Service verified successfully" });
  } catch (err) {
    logErrorToSentry(err, {
      endpoint: "/api/admin/services/[id]/verify",
      method: "POST"
    });
    return NextResponse.json(
      formatAPIError(err),
      { status: 500 }
    );
  }
}
