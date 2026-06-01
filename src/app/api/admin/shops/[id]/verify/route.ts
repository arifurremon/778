import { validateCsrfRequest } from "@/lib/csrf";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/shops/[id]/verify
 * Approves a shop registration.
 */
export async function POST(req: NextRequest, { params }: any) {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

try {
    const csrfError = validateCsrfRequest(req);
    if (csrfError) return csrfError;

    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const { id } = await params;

    const shop = await db.shop.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // [cite_start]Use Prisma transaction to update shop status and create notification. [cite: 109]
    await db.$transaction(async (tx) => {
      // Update shop status
      await tx.shop.update({
        where: { id },
        data: { 
          isVerified: true,
          verifiedAt: new Date()
        }
      });

      // Update user role if needed
      await tx.user.update({
        where: { id: shop.userId },
        data: { isSeller: true, registrationStatus: 'APPROVED' }
      });

      // [cite_start]Create an in-app notification for the owner. [cite: 109]
      // SCHEMA-FALLBACK: 'notification' may not exist — verify schema
      try {
        await tx.notification.create({
          data: {
            userId: shop.userId,
            type: "SHOP_VERIFIED",
            entityType: "Shop",
            entityId: shop.id,
            metadata: {
              approved: true,
              message: "Your Chattala Shop Has Been Verified! You can now start listing products.",
            },
          }
        });
      } catch (e) {
        // Fallback: Create an activity log instead
        await tx.activityLog.create({
          data: {
            userId: shop.userId,
            type: "SYSTEM",
            description: "Your shop has been verified successfully.",
          }
        });
      }
    });

    // [cite_start]Send a success email: "Your Chattala Shop Has Been Verified! 🎉". [cite: 110]
    // Email failures must NOT fail the API response — catch separately.
    try {
      await sendEmail(
        shop.user.email,
        "Your Chattala Shop Has Been Verified! 🎉",
        `<h1>Congratulations ${shop.user.name || 'Merchant'}!</h1>
         <p>Your shop "<strong>${shop.name}</strong>" has been approved by our moderation team.</p>
         <p>You can now log in to your dashboard and start adding products to your storefront.</p>`
      );
    } catch (emailErr) {
      logErrorToSentry(emailErr, {
        endpoint: "/api/admin/shops/[id]/verify",
        method: "POST"
      });
    }

    // [cite_start]Log the admin action. [cite: 110]
    await logAdminAction(
      session.user.id,
      "VERIFY_SHOP",
      "Shop",
      id,
      { shopName: shop.name },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, message: "Shop verified successfully" });
  } catch (err) {
    logErrorToSentry(err, {
      endpoint: "/api/admin/shops/[id]/verify",
      method: "POST"
    });
    return NextResponse.json(
      formatAPIError(err),
      { status: 500 }
    );
  }
}

