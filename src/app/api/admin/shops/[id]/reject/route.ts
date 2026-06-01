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
 * POST /api/admin/shops/[id]/reject
 * Rejects a shop registration request.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const { id } = await params;
    const body = await req.json();
    const validatedData = rejectSchema.parse(body);

    const shop = await db.shop.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // [cite_start]Update shop: set rejectedAt and rejectionReason. [cite: 110]
    await db.$transaction(async (tx) => {
      await tx.shop.update({
        where: { id },
        data: {
          isVerified: false,
          rejectedAt: new Date(),
          rejectionReason: validatedData.reason
        }
      });

      await tx.user.update({
        where: { id: shop.userId },
        data: { 
          registrationStatus: 'REJECTED',
          // [cite_start]Update shop: set rejectedAt and rejectionReason. [cite: 110]
          // SCHEMA-FALLBACK: 'verificationReason' exists on User, using it as fallback
          verificationReason: validatedData.reason
        }
      });

      // [cite_start]Notify owner via in-app notification. [cite: 110]
      try {
        await tx.notification.create({
          data: {
            userId: shop.userId,
            type: "SHOP_VERIFIED",
            entityType: "Shop",
            entityId: shop.id,
            metadata: {
              approved: false,
              message: `Your shop registration was not approved. Reason: ${validatedData.reason}`,
            },
          }
        });
      } catch (e) {
        await tx.activityLog.create({
          data: {
            userId: shop.userId,
            type: "SYSTEM",
            description: `Shop registration rejected: ${validatedData.reason}`,
          }
        });
      }
    });

    // [cite_start]Notify owner via email with the reason. [cite: 110]
    try {
      await sendEmail(
        shop.user.email,
        "Update on your Shop Registration",
        `<h1>Shop Registration Update</h1>
         <p>Dear ${shop.user.name || 'Merchant'},</p>
         <p>Unfortunately, your shop "<strong>${shop.name}</strong>" was not approved at this time.</p>
         <p><strong>Reason for rejection:</strong> ${validatedData.reason}</p>
         <p>Please address the issues mentioned above and re-submit your request.</p>`
      );
    } catch (emailErr) {
      logErrorToSentry(emailErr, {
        endpoint: "/api/admin/shops/[id]/reject",
        method: "POST"
      });
    }

    await logAdminAction(
      session.user.id,
      "REJECT_SHOP",
      "Shop",
      id,
      { reason: validatedData.reason },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, message: "Shop rejected successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ errors: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Failed to reject shop" }, { status: 500 });
  }
}
