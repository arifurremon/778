import { requireAdminMutation } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import { sendNotification, NotificationType } from "@/lib/notification-service";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { SentryFlows } from "@/lib/observability/sentry-spans";
import { withRouteObservability } from "@/lib/observability/with-route-observability";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/services/[id]/verify
 * Approves a service provider application.
 */
export const POST = withRouteObservability(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminMutation(req);
    if (admin.error) return admin.error;
    const { session } = admin;

    const { id } = await params;

    const service = await db.expertService.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const serviceTitle = service.profession;

    await SentryFlows.adminMutation(
      () =>
        db.$transaction(async (tx) => {
          await tx.expertService.update({
            where: { id },
            data: {
              isVerified: true,
              verifiedAt: new Date()
            }
          });

          await tx.user.update({
            where: { id: service.userId },
            data: {
              isServiceProvider: true,
              serviceRegistrationStatus: 'APPROVED'
            }
          });
        }),
      "verify",
      "ExpertService"
    );

    await sendNotification({
      userId: service.userId,
      actorId: session.user.id,
      type: NotificationType.SERVICE_VERIFIED,
      entityType: "ExpertService",
      entityId: service.id,
      metadata: {
        approved: "true",
        message: `Your service '${serviceTitle}' has been verified and is now live!`,
      },
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
}, { route: "POST /api/admin/services/[id]/verify" });
