import { requireAdminMutation } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { appSettingsFromPrivacy } from "@/lib/app-settings";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { enqueueAdminBulkMessage } from "@/lib/jobs/enqueue";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { sendNotificationEmail } from "@/lib/mail";
import { sendNotification } from "@/lib/notification-service";
import { sanitizeUserInput } from "@/lib/sanitize";
import { NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bulkMessageSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(100),
  channel: z.enum(["system", "email"]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
});

async function deliverBulkMessageSync(
  req: NextRequest,
  adminUserId: string,
  userIds: string[],
  channel: "system" | "email",
  cleanTitle: string,
  cleanBody: string
) {
  const users = await db.user.findMany({
    where: { id: { in: userIds }, deletedAt: null },
    select: { id: true, email: true, name: true, privacySettings: true },
  });

  let delivered = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    try {
      if (channel === "system") {
        await sendNotification({
          userId: user.id,
          actorId: adminUserId,
          type: NotificationType.SYSTEM_ALERT,
          entityType: "User",
          entityId: user.id,
          metadata: {
            message: `${cleanTitle}\n\n${cleanBody}`,
            severity: "LOW",
            adminBroadcast: true,
          },
        });
        delivered += 1;
        continue;
      }

      const prefs = appSettingsFromPrivacy(
        user.privacySettings as Record<string, string> | null | undefined
      );

      if (!prefs.emailUpdates && !prefs.marketing) {
        skipped += 1;
        continue;
      }

      if (!user.email) {
        skipped += 1;
        continue;
      }

      await sendNotificationEmail(
        user.email,
        cleanTitle,
        cleanTitle,
        cleanBody,
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`,
        "Open Dashboard"
      );
      delivered += 1;
    } catch (deliveryError) {
      failed += 1;
      logErrorToSentry(deliveryError, {
        route: "[POST /api/admin/users/bulk-message/delivery]",
        userId: user.id,
      });
    }
  }

  await logAdminAction(
    adminUserId,
    "BULK_MESSAGE",
    "User",
    userIds.join(","),
    { channel, title: cleanTitle, requested: userIds.length, delivered, skipped, failed },
    req.headers.get("x-forwarded-for")
  );

  return { delivered, skipped, failed };
}

// POST /api/admin/users/bulk-message — send system alerts or emails to selected users
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdminMutation(req);
    if (admin.error) return admin.error;
    const { session } = admin;

    const body: unknown = await req.json();
    const parsed = bulkMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const { userIds, channel, title, body: messageBody } = parsed.data;
    const cleanTitle = sanitizeUserInput(title);
    const cleanBody = sanitizeUserInput(messageBody);

    if (isFeatureEnabled("asyncBulkMessage")) {
      const queued = await enqueueAdminBulkMessage({
        adminUserId: session.user.id,
        userIds,
        channel,
        title: cleanTitle,
        body: cleanBody,
        ipAddress: req.headers.get("x-forwarded-for"),
      });

      if (queued.queued) {
        return NextResponse.json(
          {
            success: true,
            queued: true,
            jobId: queued.jobId,
            channel,
            requested: userIds.length,
            message: "Bulk message queued for background delivery.",
          },
          { status: 202 }
        );
      }
    }

    const { delivered, skipped, failed } = await deliverBulkMessageSync(
      req,
      session.user.id,
      userIds,
      channel,
      cleanTitle,
      cleanBody
    );

    return NextResponse.json({
      success: true,
      queued: false,
      channel,
      requested: userIds.length,
      delivered,
      skipped,
      failed,
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/admin/users/bulk-message]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
