import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

vi.mock("@/lib/notification-service", () => ({
  triggerNotificationReadEvent: vi.fn().mockResolvedValue(undefined),
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { GET, PATCH as patchAll } from "@/app/api/notifications/route";
import { PATCH as patchOne } from "@/app/api/notifications/[id]/read/route";
import { triggerNotificationReadEvent } from "@/lib/notification-service";

function mockActiveUser(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId, name: "Test User" } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: userId,
    isAdmin: false,
    deletedAt: null,
    suspendedAt: null,
  });
}

describe("Notifications API — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
    vi.mocked(triggerNotificationReadEvent).mockClear();
  });

  it("returns notifications and unread count", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.notification.findMany.mockResolvedValue([
      {
        id: "notif-1",
        type: "NEW_COMMENT",
        entityType: "Post",
        entityId: "post-1",
        metadata: {},
        isRead: false,
        createdAt: new Date(),
        actor: null,
      },
    ]);
    prismaMock.notification.count.mockResolvedValue(1);

    const res = await GET(new NextRequest("http://localhost:3000/api/notifications"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.notifications).toHaveLength(1);
    expect(body.unreadCount).toBe(1);
  });

  it("marks all notifications as read", async () => {
    mockActiveUser(testUsers.regular.id);

    const res = await patchAll(
      new NextRequest("http://localhost:3000/api/notifications", {
        method: "PATCH",
        headers: {
          origin: "http://localhost:3000",
          "x-csrf-token": "test-csrf-token",
        },
      })
    );

    expect(res.status).toBe(200);
    expect(prismaMock.notification.updateMany).toHaveBeenCalled();
    expect(triggerNotificationReadEvent).toHaveBeenCalledWith(testUsers.regular.id, {
      all: true,
    });
  });

  it("marks a single notification as read", async () => {
    mockActiveUser(testUsers.regular.id);

    const res = await patchOne(
      new NextRequest("http://localhost:3000/api/notifications/notif-1/read", {
        method: "PATCH",
        headers: {
          origin: "http://localhost:3000",
          "x-csrf-token": "test-csrf-token",
        },
      }),
      { params: Promise.resolve({ id: "notif-1" }) }
    );

    expect(res.status).toBe(200);
    expect(prismaMock.notification.update).toHaveBeenCalledWith({
      where: { id: "notif-1", userId: testUsers.regular.id },
      data: { isRead: true },
    });
    expect(triggerNotificationReadEvent).toHaveBeenCalledWith(testUsers.regular.id, {
      id: "notif-1",
    });
  });
});
