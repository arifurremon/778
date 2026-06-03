/**
 * Integration Tests — /api/admin/users/[id]
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

vi.mock("@/lib/audit-log", () => ({
  logAdminAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => true),
  runRateLimit: vi.fn(
    (limiter: { limit: (key: string) => Promise<{ success: boolean }> }, key: string) =>
      limiter.limit(key)
  ),
  rateLimiters: {
    admin: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { DELETE, GET, PATCH } from "@/app/api/admin/users/[id]/route";
import { logAdminAction } from "@/lib/audit-log";

const targetUserId = "user-target-001";

const sampleUserDetail = {
  id: targetUserId,
  name: "Target User",
  email: "target@chattala.test",
  username: "target_user",
  profileImage: null,
  location: "Agrabad",
  mobile: "01712345678",
  dob: new Date("1995-01-01"),
  joinDate: "January 2026",
  role: "USER",
  isVerified: false,
  isSeller: false,
  isServiceProvider: false,
  registrationStatus: "NONE",
  serviceRegistrationStatus: "NONE",
  verificationRequestStatus: "NONE",
  verificationReason: null,
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { posts: 2, comments: 1, sentRequests: 0, receivedRequests: 0 },
  shop: null,
  expertService: null,
  activityLogs: [],
};

function mockAdminSession(adminId = testUsers.admin.id) {
  mockAuth.mockResolvedValue({ user: { id: adminId, role: "ADMIN" } });
  prismaMock.user.findUnique.mockImplementation(({ where, select }: any) => {
    if (where.id === adminId && select?.role) {
      return Promise.resolve({
        id: adminId,
        role: "ADMIN",
        mfaEnabled: false,
        deletedAt: null,
        suspendedAt: null,
      });
    }
    if (where.id === targetUserId) {
      if (select?.deletedAt) {
        return Promise.resolve({ deletedAt: null });
      }
      return Promise.resolve(sampleUserDetail);
    }
    return Promise.resolve(null);
  });
}

function makeMutationRequest(
  method: "PATCH" | "DELETE",
  body?: Record<string, unknown>
): NextRequest {
  return new NextRequest(`http://localhost:3000/api/admin/users/${targetUserId}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe("/api/admin/users/[id] — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await GET(new NextRequest("http://localhost/api/admin/users/x"), {
        params: Promise.resolve({ id: targetUserId }),
      });
      expect(res.status).toBe(401);
    });

    it("returns user detail for admin", async () => {
      mockAdminSession();
      const res = await GET(new NextRequest("http://localhost/api/admin/users/x"), {
        params: Promise.resolve({ id: targetUserId }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.id).toBe(targetUserId);
      expect(json.deletedAt).toBeNull();
    });

    it("returns 404 when user missing", async () => {
      mockAdminSession();
      prismaMock.user.findUnique.mockImplementation(({ where, select }: any) => {
        if (where.id === testUsers.admin.id && select?.role) {
          return Promise.resolve({
            id: testUsers.admin.id,
            role: "ADMIN",
            mfaEnabled: false,
            deletedAt: null,
            suspendedAt: null,
          });
        }
        return Promise.resolve(null);
      });

      const res = await GET(new NextRequest("http://localhost/api/admin/users/x"), {
        params: Promise.resolve({ id: "missing-user" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH", () => {
    it("returns 400 when admin tries to modify own role", async () => {
      mockAdminSession(testUsers.admin.id);
      const res = await PATCH(
        makeMutationRequest("PATCH", { role: "USER" }),
        { params: Promise.resolve({ id: testUsers.admin.id }) }
      );
      expect(res.status).toBe(400);
    });

    it("updates user role and logs audit entry", async () => {
      mockAdminSession();
      prismaMock.user.update.mockResolvedValue({
        id: targetUserId,
        name: sampleUserDetail.name,
        email: sampleUserDetail.email,
        role: "ADMIN",
        isVerified: false,
        isSeller: false,
        isServiceProvider: false,
      });

      const res = await PATCH(
        makeMutationRequest("PATCH", { role: "ADMIN" }),
        { params: Promise.resolve({ id: targetUserId }) }
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.role).toBe("ADMIN");
      expect(logAdminAction).toHaveBeenCalled();
    });

    it("returns 400 for invalid payload", async () => {
      mockAdminSession();
      const res = await PATCH(
        makeMutationRequest("PATCH", { email: "not-an-email" }),
        { params: Promise.resolve({ id: targetUserId }) }
      );
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE", () => {
    it("returns 400 when admin tries to delete themselves", async () => {
      mockAdminSession(testUsers.admin.id);
      const res = await DELETE(
        makeMutationRequest("DELETE"),
        { params: Promise.resolve({ id: testUsers.admin.id }) }
      );
      expect(res.status).toBe(400);
    });

    it("soft-deletes target user", async () => {
      mockAdminSession();
      prismaMock.user.update.mockResolvedValue({ id: targetUserId });

      const res = await DELETE(
        makeMutationRequest("DELETE"),
        { params: Promise.resolve({ id: targetUserId }) }
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: targetUserId },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );
    });
  });
});
