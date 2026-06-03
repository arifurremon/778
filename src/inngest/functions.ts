import { logAdminAction } from "@/lib/audit-log";
import { appSettingsFromPrivacy } from "@/lib/app-settings";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { runDataRetentionJobs } from "@/lib/legal/account-deletion";
import { buildUserDataExport } from "@/lib/legal/user-export";
import {
  completeExportJob,
  createExportJobRecord,
  failExportJob,
} from "@/lib/jobs/export-store";
import { deliverMailJob, sendNotificationEmailDirect } from "@/lib/mail-direct";
import { sendNotification } from "@/lib/notification-service";
import {
  inngest,
  INNGEST_EVENTS,
  type AdminBulkMessageEventData,
} from "@/inngest/client";
import { NotificationType } from "@prisma/client";

export const mailSendFunction = inngest.createFunction(
  { id: "mail-send", retries: 3 },
  { event: INNGEST_EVENTS.mailSend },
  async ({ event }) => {
    await deliverMailJob(event.data);
    return { sent: true, kind: event.data.kind };
  }
);

export const adminBulkMessageFunction = inngest.createFunction(
  { id: "admin-bulk-message", retries: 2 },
  { event: INNGEST_EVENTS.adminBulkMessage },
  async ({ event, step }) => {
    const payload = event.data as AdminBulkMessageEventData;
    const users = await step.run("load-users", () =>
      db.user.findMany({
        where: { id: { in: payload.userIds }, deletedAt: null },
        select: { id: true, email: true, name: true, privacySettings: true },
      })
    );

    let delivered = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      const result = await step.run(`deliver-${user.id}`, async () => {
        try {
          if (payload.channel === "system") {
            await sendNotification({
              userId: user.id,
              actorId: payload.adminUserId,
              type: NotificationType.SYSTEM_ALERT,
              entityType: "User",
              entityId: user.id,
              metadata: {
                message: `${payload.title}\n\n${payload.body}`,
                severity: "LOW",
                adminBroadcast: true,
              },
            });
            return "delivered" as const;
          }

          const prefs = appSettingsFromPrivacy(
            user.privacySettings as Record<string, string> | null | undefined
          );

          if (!prefs.emailUpdates && !prefs.marketing) return "skipped" as const;
          if (!user.email) return "skipped" as const;

          await sendNotificationEmailDirect(
            user.email,
            payload.title,
            payload.title,
            payload.body,
            `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`,
            "Open Dashboard"
          );
          return "delivered" as const;
        } catch (error) {
          logErrorToSentry(error, { route: "inngest/admin-bulk-message", userId: user.id });
          return "failed" as const;
        }
      });

      if (result === "delivered") delivered += 1;
      else if (result === "skipped") skipped += 1;
      else failed += 1;
    }

    await step.run("audit-log", () =>
      logAdminAction(
        payload.adminUserId,
        "BULK_MESSAGE",
        "User",
        payload.userIds.join(","),
        {
          channel: payload.channel,
          title: payload.title,
          requested: payload.userIds.length,
          delivered,
          skipped,
          failed,
          async: true,
        },
        payload.ipAddress ?? undefined
      )
    );

    return { delivered, skipped, failed };
  }
);

export const userExportFunction = inngest.createFunction(
  { id: "user-export-generate", retries: 2 },
  { event: INNGEST_EVENTS.userExport },
  async ({ event, step }) => {
    const { jobId, userId } = event.data;

    await step.run("mark-pending", () => createExportJobRecord(jobId, userId));

    try {
      const exportData = await step.run("build-export", () => buildUserDataExport(userId));
      if (!exportData) {
        await failExportJob(jobId, "User not found.");
        return { status: "failed" };
      }

      await step.run("store-export", () => completeExportJob(jobId, exportData));
      return { status: "completed", jobId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      await failExportJob(jobId, message);
      throw error;
    }
  }
);

export const dataRetentionFunction = inngest.createFunction(
  { id: "data-retention-cron", retries: 2 },
  [{ cron: "0 3 * * *" }, { event: INNGEST_EVENTS.dataRetention }],
  async ({ step }) => {
    const result = await step.run("run-retention", () => runDataRetentionJobs());
    return result;
  }
);

export const inngestFunctions = [
  mailSendFunction,
  adminBulkMessageFunction,
  userExportFunction,
  dataRetentionFunction,
];
