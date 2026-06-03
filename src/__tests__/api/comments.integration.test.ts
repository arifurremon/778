import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => true),
  runRateLimit: vi.fn(async (limiter: { limit: (key: string) => Promise<{ success: boolean }> }, key: string) =>
    limiter.limit(key)
  ),
  rateLimiters: {
    comments: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

vi.mock("@/lib/notification-service", () => ({
  sendNotification: vi.fn().mockResolvedValue(undefined),
  NotificationType: {
    NEW_COMMENT: "NEW_COMMENT",
  },
}));

vi.mock("@/lib/notification-email", () => ({
  sendNotificationEmailIfAllowed: vi.fn().mockResolvedValue(false),
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { POST as createComment } from "@/app/api/posts/[postId]/comments/route";
import { sendNotification } from "@/lib/notification-service";

function mockActiveUser(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId, name: "Test User" } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: userId,
    isAdmin: false,
    deletedAt: null,
    suspendedAt: null,
    email: "author@example.com",
    privacySettings: {},
  });
}

describe("Post comments API — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
    vi.mocked(sendNotification).mockClear();
  });

  it("creates a comment and notifies the post author", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.post.findUnique.mockResolvedValue({
      id: "post-1",
      authorId: "author-1",
      content: "Sample post content",
    });
    prismaMock.comment.create.mockResolvedValue({
      id: "comment-1",
      text: "Nice post!",
      likes: 0,
      unlikes: 0,
      createdAt: new Date(),
      author: {
        id: testUsers.regular.id,
        name: testUsers.regular.name,
        preferredName: null,
        profileImage: null,
        isVerified: false,
        username: testUsers.regular.username,
      },
    });

    const res = await createComment(
      new NextRequest("http://localhost:3000/api/posts/post-1/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost:3000",
          "x-csrf-token": "test-csrf-token",
        },
        body: JSON.stringify({ text: "Nice post!" }),
      }),
      { params: Promise.resolve({ postId: "post-1" }) }
    );

    expect(res.status).toBe(201);
    expect(sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "author-1",
        actorId: testUsers.regular.id,
        type: "NEW_COMMENT",
      })
    );
    expect(prismaMock.activityLog.create).toHaveBeenCalled();
  });
});
