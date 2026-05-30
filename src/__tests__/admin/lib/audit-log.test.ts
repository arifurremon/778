import { logAdminAction } from "@/lib/audit-log";
import { db } from "@/lib/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe("logAdminAction() Library Utility", () => {
  const originalAuditLog = db.auditLog;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Reset db.auditLog to original mock before each test
    (db as { auditLog: typeof db.auditLog }).auditLog = originalAuditLog;
  });

  afterEach(() => {
    (db as { auditLog: typeof db.auditLog }).auditLog = originalAuditLog;
  });

  it("should successfully create an audit log record with correct params", async () => {
    const mockPayload = {
      adminId: "admin-123",
      action: "UPDATE_USER",
      entityType: "User",
      entityId: "user-456",
      details: { role: "ADMIN" },
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0"
    };

    await logAdminAction(
      mockPayload.adminId,
      mockPayload.action,
      mockPayload.entityType,
      mockPayload.entityId,
      mockPayload.details,
      mockPayload.ipAddress,
      mockPayload.userAgent
    );

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: {
        adminId: mockPayload.adminId,
        action: mockPayload.action,
        entityType: mockPayload.entityType,
        entityId: mockPayload.entityId,
        details: mockPayload.details,
        ipAddress: mockPayload.ipAddress,
        userAgent: mockPayload.userAgent,
      }
    });
  });

  it("should swallow database errors without throwing", async () => {
    (db.auditLog.create as any).mockRejectedValue(new Error("DB Down"));

    await logAdminAction("a", "b", "c", "d", {});
    
    expect(console.error).toHaveBeenCalled();
  });

  it("should handle missing ipAddress and userAgent", async () => {
    await logAdminAction("admin-1", "ACTION", "Type", "id", { test: true });

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipAddress: null,
        userAgent: null
      })
    });
  });

  it("should handle AuditLog model missing in db client (schema fallback)", async () => {
    // @ts-ignore
    db.auditLog = undefined;

    await logAdminAction("a", "b", "c", "d", {});
    
    expect(console.warn).toHaveBeenCalled();
  });

  it("should accept any string as action for schema flexibility", async () => {
    const customAction = "CUSTOM_NON_ENUM_ACTION";
    await logAdminAction("admin-1", customAction, "Entity", "1", {});

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: customAction })
    });
  });

  it("should log the correct entity type and ID", async () => {
    await logAdminAction("adm", "ACT", "Settings", "global", {});
    
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityType: "Settings",
        entityId: "global"
      })
    });
  });
});
