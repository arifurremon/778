/**
 * Integration Tests — Admin bulk messaging API
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

vi.mock("@/lib/audit-log", () => ({
  logAdminAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notification-service", () => ({
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/mail", () => ({
  sendNotificationEmail: vi.fn().mockResolvedValue(undefined),
}));

const mockRequireAdminMutation = vi.fn();
vi.mock("@/lib/admin-auth", () => ({
  requireAdminMutation: () => mockRequireAdminMutation(),
}));

import { POST as bulkMessage } from "@/app/api/admin/users/bulk-message/route";
import { sendNotification } from "@/lib/notification-service";

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/users/bulk-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
    body: JSON.stringify(body),
  });
}

describe("Admin bulk messaging API — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockRequireAdminMutation.mockResolvedValue({
      session: { user: { id: "admin-1" } },
    });
  });

  it("sends system alerts to selected users", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: "00000000-0000-0000-0000-000000000001",
        email: "user@example.com",
        name: "User One",
        privacySettings: {},
      },
    ]);

    const res = await bulkMessage(
      makePostRequest({
        userIds: ["00000000-0000-0000-0000-000000000001"],
        channel: "system",
        title: "Platform Update",
        body: "We have improved the community feed.",
      })
    );

    expect(res.status).toBe(200);
    expect(sendNotification).toHaveBeenCalled();
  });
});
