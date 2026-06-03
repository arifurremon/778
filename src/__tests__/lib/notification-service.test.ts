import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

const mockTrigger = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/pusher", () => ({
  pusher: {
    trigger: (...args: unknown[]) => mockTrigger(...args),
  },
}));

import {
  sendNotification,
  triggerNotificationReadEvent,
  NotificationType,
} from "@/lib/notification-service";

describe("notification-service", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockTrigger.mockClear();
    prismaMock.notification.create.mockResolvedValue({
      id: "notif-1",
      type: NotificationType.NEW_COMMENT,
      entityType: "Post",
      entityId: "post-1",
      metadata: { commentPreview: "Hello" },
      isRead: false,
      createdAt: new Date(),
      actor: null,
    });
  });

  it("persists a notification and triggers Pusher", async () => {
    await sendNotification({
      userId: "user-1",
      actorId: "user-2",
      type: NotificationType.NEW_COMMENT,
      entityType: "Post",
      entityId: "post-1",
      metadata: { commentPreview: "Hello" },
    });

    expect(prismaMock.notification.create).toHaveBeenCalled();
    expect(mockTrigger).toHaveBeenCalledWith(
      "private-user-user-1",
      "new-notification",
      expect.objectContaining({ id: "notif-1" })
    );
  });

  it("does not throw when Pusher trigger fails", async () => {
    mockTrigger.mockRejectedValueOnce(new Error("Pusher down"));

    await expect(
      sendNotification({
        userId: "user-1",
        type: NotificationType.SYSTEM_ALERT,
        metadata: { message: "Test" },
      })
    ).resolves.toBeUndefined();
  });

  it("triggers notification-read events", async () => {
    await triggerNotificationReadEvent("user-1", { id: "notif-1" });

    expect(mockTrigger).toHaveBeenCalledWith(
      "private-user-user-1",
      "notification-read",
      { id: "notif-1" }
    );
  });
});
