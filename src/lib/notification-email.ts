import { appSettingsFromPrivacy } from "@/lib/app-settings";
import { sendNotificationEmail } from "@/lib/mail";

type EmailRecipient = {
  email: string | null;
  privacySettings: unknown;
};

/**
 * Sends a notification email only when the recipient opted in via emailUpdates.
 */
export async function sendNotificationEmailIfAllowed(
  recipient: EmailRecipient,
  subject: string,
  heading: string,
  body: string,
  actionUrl: string,
  actionLabel: string
): Promise<boolean> {
  if (!recipient.email) return false;

  const prefs = appSettingsFromPrivacy(
    recipient.privacySettings as Record<string, string> | null | undefined
  );

  if (!prefs.emailUpdates) return false;

  await sendNotificationEmail(
    recipient.email,
    subject,
    heading,
    body,
    actionUrl,
    actionLabel
  );

  return true;
}
