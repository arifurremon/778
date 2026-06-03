/**
 * Integration Tests — POST /api/admin/users/[id]/suspend
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/audit-log", () => ({
  logAdminAction: vi.fn().mockResolvedValue(undefined),
}));

const mockRequireAdminMutation = vi.fn();
vi.mock("@/lib/admin-auth", () => ({
  requireAdminMutation: () => mockRequireAdminMutation(),
}));

import { POST } from "@/app/api/admin/users/[id]/suspend/route";

const targetUserId = "user-target-001";

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost:3000/api/admin/users/${targetUserId}/suspend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/users/[id]/suspend — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockRequireAdminMutation.mockResolvedValue({
      session: { user: { id: testUsers.admin.id } },
    });
    prismaMock.user.update.mockResolvedValue({ id: targetUserId });
    prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });
  });

  it("suspends a user with a valid reason", async () => {
    const res = await POST(makePostRequest({
      suspended: true,
      reason: "Repeated policy violations on community posts.",
    }), {
      params: Promise.resolve({ id: targetUserId }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: targetUserId },
    });
  });

  it("returns 400 when reason is too short", async () => {
    const res = await POST(makePostRequest({
      suspended: true,
      reason: "short",
    }), {
      params: Promise.resolve({ id: targetUserId }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when admin tries to suspend themselves", async () => {
    const res = await POST(makePostRequest({
      suspended: true,
      reason: "Attempting self suspension for testing.",
    }), {
      params: Promise.resolve({ id: testUsers.admin.id }),
    });
    expect(res.status).toBe(400);
  });

  it("unsuspends a user", async () => {
    const res = await POST(makePostRequest({
      suspended: false,
      reason: "Appeal approved after review.",
    }), {
      params: Promise.resolve({ id: targetUserId }),
    });

    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          suspendedAt: null,
          suspensionReason: null,
        }),
      })
    );
  });
});
