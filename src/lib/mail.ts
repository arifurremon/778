import { logErrorToSentry } from "@/lib/error-handler";
import { isFeatureEnabled } from "@/lib/feature-flags";
import type { MailSendEventData } from "@/inngest/client";

interface SendWelcomeEmailParams {
  to: string;
  name: string;
}

async function deliverDirect(data: MailSendEventData): Promise<void> {
  const { deliverMailJob } = await import("@/lib/mail-direct");
  await deliverMailJob(data);
}

async function queueOrSend(data: MailSendEventData): Promise<void> {
  if (isFeatureEnabled("asyncMail")) {
    try {
      const { enqueueMailJob } = await import("@/lib/jobs/enqueue");
      await enqueueMailJob(data);
      return;
    } catch (error) {
      logErrorToSentry(error, { route: "mail-queue-fallback", kind: data.kind });
    }
  }

  await deliverDirect(data);
}

export const sendWelcomeEmail = async ({ to, name }: SendWelcomeEmailParams) => {
  try {
    await queueOrSend({ kind: "welcome", to, name });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  try {
    await queueOrSend({ kind: "password-reset", to, resetLink });
  } catch (error) {
    console.error("Error sending reset email:", error);
    throw error;
  }
};

export const sendVerificationEmail = async (to: string, verifyLink: string) => {
  try {
    await queueOrSend({ kind: "verification", to, verifyLink });
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

export const sendNotificationEmail = async (
  to: string,
  subject: string,
  title: string,
  message: string,
  actionLink?: string,
  actionText?: string
) => {
  try {
    await queueOrSend({
      kind: "notification",
      to,
      subject,
      title,
      message,
      actionLink,
      actionText,
    });
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await queueOrSend({ kind: "raw", to, subject, html });
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
