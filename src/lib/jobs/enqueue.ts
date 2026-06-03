import type {
  AdminBulkMessageEventData,
  MailSendEventData,
  UserExportEventData,
} from "@/inngest/client";
import { isFeatureEnabled } from "@/lib/feature-flags";

export async function enqueueMailJob(data: MailSendEventData): Promise<{ queued: boolean }> {
  if (!isFeatureEnabled("asyncMail")) {
    const { deliverMailJob } = await import("@/lib/mail-direct");
    await deliverMailJob(data);
    return { queued: false };
  }

  const { inngest, INNGEST_EVENTS } = await import("@/inngest/client");
  await inngest.send({ name: INNGEST_EVENTS.mailSend, data });
  return { queued: true };
}

export async function enqueueAdminBulkMessage(
  data: AdminBulkMessageEventData
): Promise<{ queued: boolean; jobId?: string }> {
  if (!isFeatureEnabled("asyncBulkMessage")) {
    return { queued: false };
  }

  const { inngest, INNGEST_EVENTS } = await import("@/inngest/client");
  const { ids } = await inngest.send({ name: INNGEST_EVENTS.adminBulkMessage, data });
  return { queued: true, jobId: ids[0] };
}

export async function enqueueUserExport(data: UserExportEventData): Promise<{ queued: boolean }> {
  if (!isFeatureEnabled("asyncExport")) {
    return { queued: false };
  }

  const { inngest, INNGEST_EVENTS } = await import("@/inngest/client");
  await inngest.send({ name: INNGEST_EVENTS.userExport, data });
  return { queued: true };
}

export async function enqueueDataRetention(): Promise<{ queued: boolean }> {
  if (!isFeatureEnabled("asyncRetention")) {
    return { queued: false };
  }

  const { inngest, INNGEST_EVENTS } = await import("@/inngest/client");
  await inngest.send({ name: INNGEST_EVENTS.dataRetention, data: { triggeredBy: "api" } });
  return { queued: true };
}
