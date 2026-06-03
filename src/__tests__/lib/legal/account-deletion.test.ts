import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../../helpers/prisma-mock";

vi.mock("@/lib/legal/consent", () => ({
  recordConsent: vi.fn().mockResolvedValue(undefined),
}));

import {
  anonymizeUserAccount,
  purgeOldActivityLogs,
  purgeOldAuditLogs,
  purgeSoftDeletedUsers,
  runDataRetentionJobs,
} from "@/lib/legal/account-deletion";
import { recordConsent } from "@/lib/legal/consent";

describe("account-deletion helpers", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.clearAllMocks();
  });

  it("anonymizes user profile and scrubs related content", async () => {
    prismaMock.$transaction.mockResolvedValue([]);

    await anonymizeUserAccount({
      userId: "user-123",
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
    });

    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(recordConsent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        type: "PRIVACY",
        granted: false,
      })
    );
  });

  it("purges activity logs older than retention window", async () => {
    prismaMock.activityLog.deleteMany.mockResolvedValue({ count: 5 });

    const count = await purgeOldActivityLogs(12);

    expect(count).toBe(5);
    expect(prismaMock.activityLog.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { createdAt: { lt: expect.any(Date) } },
      })
    );
  });

  it("purges audit logs older than retention window", async () => {
    prismaMock.auditLog.deleteMany.mockResolvedValue({ count: 3 });

    const count = await purgeOldAuditLogs(24);

    expect(count).toBe(3);
    expect(prismaMock.auditLog.deleteMany).toHaveBeenCalled();
  });

  it("hard-deletes stale soft-deleted users", async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: "stale-user" }]);
    prismaMock.$transaction.mockResolvedValue([]);

    const count = await purgeSoftDeletedUsers(30);

    expect(count).toBe(1);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: "stale-user" },
    });
  });

  it("runs all retention jobs in parallel", async () => {
    prismaMock.activityLog.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.auditLog.deleteMany.mockResolvedValue({ count: 2 });
    prismaMock.user.findMany.mockResolvedValue([]);

    const result = await runDataRetentionJobs();

    expect(result).toEqual({
      activityPurged: 1,
      auditPurged: 2,
      usersPurged: 0,
    });
  });
});
