import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "thechattala",
  name: "The Chattala",
});

export const INNGEST_EVENTS = {
  mailSend: "mail/send",
  adminBulkMessage: "admin/bulk-message",
  userExport: "user/export.generate",
  dataRetention: "cron/data-retention",
} as const;

export type MailSendEventData =
  | { kind: "welcome"; to: string; name: string }
  | { kind: "password-reset"; to: string; resetLink: string }
  | { kind: "verification"; to: string; verifyLink: string }
  | {
      kind: "notification";
      to: string;
      subject: string;
      title: string;
      message: string;
      actionLink?: string;
      actionText?: string;
    }
  | { kind: "raw"; to: string; subject: string; html: string };

export type AdminBulkMessageEventData = {
  adminUserId: string;
  userIds: string[];
  channel: "system" | "email";
  title: string;
  body: string;
  ipAddress?: string | null;
};

export type UserExportEventData = {
  jobId: string;
  userId: string;
};
