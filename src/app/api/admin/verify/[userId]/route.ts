import { requireAdminMutation } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { sendNotification, NotificationType } from "@/lib/notification-service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = { params: Promise<{ userId: string }> };

const verifySchema = z.object({
  action: z.enum(["approve", "reject"]),
  type: z.enum(["resident", "shop", "service"]),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const admin = await requireAdminMutation(req);
    if (admin.error) return admin.error;
    const { session } = admin;

    const { userId } = await params;

    const body: unknown = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const { action, type, reason } = parsed.data;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const isApproved = action === "approve";
    const statusText = isApproved ? "APPROVED" : "REJECTED";
    let message = "";

    if (type === "resident") {
      await db.user.update({
        where: { id: userId },
        data: {
          verificationRequestStatus: statusText,
          ...(isApproved ? { isVerified: true } : {}),
          ...(!isApproved && reason ? { verificationReason: reason } : {}),
        },
      });
      message = isApproved
        ? "Your resident verification request has been approved."
        : `Your resident verification request was rejected. Reason: ${reason || "N/A"}`;
    } else if (type === "shop") {
      await db.user.update({
        where: { id: userId },
        data: {
          registrationStatus: statusText,
          ...(isApproved ? { isSeller: true } : {}),
          ...(!isApproved && reason ? { verificationReason: reason } : {}),
        },
      });
      if (isApproved) {
        await db.shop.updateMany({
          where: { userId },
          data: { isVerified: true },
        });
      }
      message = isApproved
        ? "Your shop registration has been approved."
        : `Your shop registration was rejected. Reason: ${reason || "N/A"}`;
    } else if (type === "service") {
      await db.user.update({
        where: { id: userId },
        data: {
          serviceRegistrationStatus: statusText,
          ...(isApproved ? { isServiceProvider: true } : {}),
          ...(!isApproved && reason ? { verificationReason: reason } : {}),
        },
      });
      message = isApproved
        ? "Your expert service registration has been approved."
        : `Your expert service registration was rejected. Reason: ${reason || "N/A"}`;
    }

    await sendNotification({
      userId,
      actorId: session.user.id,
      type: NotificationType.MODERATION_ACTION,
      entityType: "User",
      entityId: userId,
      metadata: {
        message,
        severity: isApproved ? "LOW" : "HIGH",
        applicationType: type,
        approved: String(isApproved),
        reason: reason ?? null,
      },
    });

    await db.activityLog.create({
      data: {
        userId,
        type: "SYSTEM",
        description: message,
      },
    });

    return NextResponse.json({ success: true, message: `Application ${action}d successfully.` });
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/admin/verify/[userId]",
      method: "POST",
    });
    return NextResponse.json(formatAPIError(error), { status: 500 });
  }
}
