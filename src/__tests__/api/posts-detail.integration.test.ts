/**
 * Integration Tests — DELETE /api/posts/[postId]
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({ logErrorToSentry: vi.fn() }));

vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => true),
  runRateLimit: vi.fn(
    (limiter: { limit: (key: string) => Promise<{ success: boolean }> }, key: string) =>
      limiter.limit(key)
  ),
  rateLimiters: {
    posts: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { DELETE } from "@/app/api/posts/[postId]/route";

const postId = "post-001";

function mockActiveUser(userId: string, role: "USER" | "ADMIN" = "USER") {
  mockAuth.mockResolvedValue({ user: { id: userId } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: userId,
    role,
    deletedAt: null,
    suspendedAt: null,
  });
}

function makeDeleteRequest(): NextRequest {
  return new NextRequest(`http://localhost:3000/api/posts/${postId}`, {
    method: "DELETE",
    headers: {
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
  });
}

describe("DELETE /api/posts/[postId] — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ postId }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 when post does not exist", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.post.findUnique.mockResolvedValue(null);

    const res = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ postId }),
    });
    expect(res.status).toBe(404);
  });

  it("allows author to delete own post", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.post.findUnique.mockResolvedValue({
      id: postId,
      authorId: testUsers.regular.id,
    });
    prismaMock.post.delete.mockResolvedValue({ id: postId });

    const res = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ postId }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("allows admin to delete another user's post", async () => {
    mockActiveUser(testUsers.admin.id, "ADMIN");
    prismaMock.post.findUnique.mockResolvedValue({
      id: postId,
      authorId: testUsers.regular.id,
    });
    prismaMock.post.delete.mockResolvedValue({ id: postId });

    const res = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ postId }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 403 when non-author non-admin tries to delete", async () => {
    mockActiveUser("other-user");
    prismaMock.post.findUnique.mockResolvedValue({
      id: postId,
      authorId: testUsers.regular.id,
    });

    const res = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ postId }),
    });
    expect(res.status).toBe(403);
  });
});
