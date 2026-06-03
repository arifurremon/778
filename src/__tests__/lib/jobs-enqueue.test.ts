import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/inngest/client", () => ({
  inngest: { send: vi.fn().mockResolvedValue({ ids: ["job-1"] }) },
  INNGEST_EVENTS: {
    mailSend: "mail/send",
    adminBulkMessage: "admin/bulk-message",
    userExport: "user/export.generate",
    dataRetention: "cron/data-retention",
  },
}));

vi.mock("@/lib/mail-direct", () => ({
  deliverMailJob: vi.fn().mockResolvedValue(undefined),
}));

describe("jobs/enqueue", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("delivers mail synchronously when async mail disabled", async () => {
    vi.stubEnv("FEATURE_ASYNC_MAIL", "false");
    const { deliverMailJob } = await import("@/lib/mail-direct");
    const { enqueueMailJob } = await import("@/lib/jobs/enqueue");

    const result = await enqueueMailJob({
      kind: "verification",
      to: "test@example.com",
      verifyLink: "https://example.com/verify",
    });

    expect(result.queued).toBe(false);
    expect(deliverMailJob).toHaveBeenCalledOnce();
  });

  it("queues mail when async mail enabled", async () => {
    vi.stubEnv("FEATURE_ASYNC_MAIL", "true");
    const { inngest } = await import("@/inngest/client");
    const { deliverMailJob } = await import("@/lib/mail-direct");
    const { enqueueMailJob } = await import("@/lib/jobs/enqueue");

    const result = await enqueueMailJob({
      kind: "verification",
      to: "test@example.com",
      verifyLink: "https://example.com/verify",
    });

    expect(result.queued).toBe(true);
    expect(inngest.send).toHaveBeenCalledOnce();
    expect(deliverMailJob).not.toHaveBeenCalled();
  });
});
