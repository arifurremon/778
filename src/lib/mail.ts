import { logErrorToSentry } from "@/lib/error-handler";
import { enqueueMailJob } from "@/lib/jobs/enqueue";
import { deliverMailJob } from "@/lib/mail-direct";
import { isFeatureEnabled } from "@/lib/feature-flags";

interface SendWelcomeEmailParams {
  to: string;
  name: string;
}

async function queueOrSend<T extends Parameters<typeof enqueueMailJob>[0]>(
  data: T,
  direct: () => Promise<void>
): Promise<void> {
  if (isFeatureEnabled("asyncMail")) {
    try {
      await enqueueMailJob(data);
      return;
    } catch (error) {
      logErrorToSentry(error, { route: "mail-queue-fallback", kind: data.kind });
    }
  }

  await direct();
}

export const sendWelcomeEmail = async ({ to, name }: SendWelcomeEmailParams) => {
  try {
    await queueOrSend({ kind: "welcome", to, name }, () => deliverMailJob({ kind: "welcome", to, name }));
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  try {
    await queueOrSend(
      { kind: "password-reset", to, resetLink },
      () => deliverMailJob({ kind: "password-reset", to, resetLink })
    );
  } catch (error) {
    console.error("Error sending reset email:", error);
    throw error;
  }
};

export const sendVerificationEmail = async (to: string, verifyLink: string) => {
  try {
    await queueOrSend(
      { kind: "verification", to, verifyLink },
      () => deliverMailJob({ kind: "verification", to, verifyLink })
    );
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
    await queueOrSend(
      { kind: "notification", to, subject, title, message, actionLink, actionText },
      () =>
        deliverMailJob({
          kind: "notification",
          to,
          subject,
          title,
          message,
          actionLink,
          actionText,
        })
    );
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await queueOrSend({ kind: "raw", to, subject, html }, () =>
      deliverMailJob({ kind: "raw", to, subject, html })
    );
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
