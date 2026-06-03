import { validateCsrfRequest } from "@/lib/csrf";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { appSettingsFromPrivacy } from "@/lib/app-settings";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
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

// POST /api/admin/users/bulk-message — send system alerts or emails to selected users
export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

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

    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        privacySettings: true,
      },
    });

    let delivered = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      try {
        if (channel === "system") {
          await sendNotification({
            userId: user.id,
            actorId: session.user.id,
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
      session.user.id,
      "BULK_MESSAGE",
      "User",
      userIds.join(","),
      {
        channel,
        title: cleanTitle,
        requested: userIds.length,
        delivered,
        skipped,
        failed,
      },
      req.headers.get("x-forwarded-for")
    );

    return NextResponse.json({
      success: true,
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
