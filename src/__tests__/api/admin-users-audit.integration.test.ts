/**
 * Integration Tests — GET /api/admin/users/[id]/audit
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { GET } from "@/app/api/admin/users/[id]/audit/route";

const targetUserId = "user-target-001";

function mockAdminSession() {
  mockAuth.mockResolvedValue({ user: { id: testUsers.admin.id, role: "ADMIN" } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: testUsers.admin.id,
    role: "ADMIN",
    mfaEnabled: false,
    deletedAt: null,
    suspendedAt: null,
  });
}

describe("GET /api/admin/users/[id]/audit — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await GET(new NextRequest("http://localhost/api/admin/users/x/audit"), {
      params: Promise.resolve({ id: targetUserId }),
    });
    expect(res.status).toBe(401);
  });

  it("returns audit logs for admin", async () => {
    mockAdminSession();
    prismaMock.auditLog.findMany.mockResolvedValue([
      {
        id: "log-1",
        action: "UPDATE_USER",
        entityType: "User",
        entityId: targetUserId,
        createdAt: new Date(),
        admin: { name: "Admin User", email: testUsers.admin.email },
      },
    ]);

    const res = await GET(new NextRequest("http://localhost/api/admin/users/x/audit"), {
      params: Promise.resolve({ id: targetUserId }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.logs).toHaveLength(1);
  });

  it("falls back to activity logs when audit log query fails", async () => {
    mockAdminSession();
    prismaMock.auditLog.findMany.mockRejectedValue(new Error("audit unavailable"));
    prismaMock.activityLog.findMany.mockResolvedValue([
      {
        id: "activity-1",
        type: "SYSTEM",
        description: "Account updated",
        createdAt: new Date(),
        user: { name: "Target User" },
      },
    ]);

    const res = await GET(new NextRequest("http://localhost/api/admin/users/x/audit"), {
      params: Promise.resolve({ id: targetUserId }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.logs).toHaveLength(1);
  });
});
