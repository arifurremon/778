/**
 * Integration Tests — Activity API
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { GET as getActivity, PATCH as patchActivity } from "@/app/api/activity/route";

function mockActiveUser(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId, name: "Test User" } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: userId,
    role: "USER",
    deletedAt: null,
    suspendedAt: null,
  });
}

describe("Activity API — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  it("returns activity logs for the authenticated user", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.activityLog.findMany.mockResolvedValue([
      {
        id: "act-1",
        type: "COMMENT",
        description: "You commented on a post.",
        contextUrl: "/community#post-1",
        isRead: false,
        createdAt: new Date(),
      },
    ]);
    prismaMock.activityLog.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const res = await getActivity(new NextRequest("http://localhost:3000/api/activity?tab=all"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activities).toHaveLength(1);
    expect(body.unreadCount).toBe(1);
  });

  it("marks all activity entries as read", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.activityLog.updateMany.mockResolvedValue({ count: 2 });

    const res = await patchActivity(
      new NextRequest("http://localhost:3000/api/activity", {
        method: "PATCH",
        headers: {
          origin: "http://localhost:3000",
          "x-csrf-token": "test-csrf-token",
        },
      })
    );

    expect(res.status).toBe(200);
    expect(prismaMock.activityLog.updateMany).toHaveBeenCalled();
  });
});
