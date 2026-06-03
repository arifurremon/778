import {
  inngest,
  INNGEST_EVENTS,
  type AdminBulkMessageEventData,
  type MailSendEventData,
  type UserExportEventData,
} from "@/inngest/client";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { deliverMailJob } from "@/lib/mail-direct";

export async function enqueueMailJob(data: MailSendEventData): Promise<{ queued: boolean }> {
  if (!isFeatureEnabled("asyncMail")) {
    await deliverMailJob(data);
    return { queued: false };
  }

  await inngest.send({ name: INNGEST_EVENTS.mailSend, data });
  return { queued: true };
}

export async function enqueueAdminBulkMessage(
  data: AdminBulkMessageEventData
): Promise<{ queued: boolean; jobId?: string }> {
  if (!isFeatureEnabled("asyncBulkMessage")) {
    return { queued: false };
  }

  const { ids } = await inngest.send({ name: INNGEST_EVENTS.adminBulkMessage, data });
  return { queued: true, jobId: ids[0] };
}

export async function enqueueUserExport(data: UserExportEventData): Promise<{ queued: boolean }> {
  if (!isFeatureEnabled("asyncExport")) {
    return { queued: false };
  }

  await inngest.send({ name: INNGEST_EVENTS.userExport, data });
  return { queued: true };
}

export async function enqueueDataRetention(): Promise<{ queued: boolean }> {
  if (!isFeatureEnabled("asyncRetention")) {
    return { queued: false };
  }

  await inngest.send({ name: INNGEST_EVENTS.dataRetention, data: { triggeredBy: "api" } });
  return { queued: true };
}
