/**
 * Integration Tests — PATCH /api/messages/[conversationId]/read
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
    messages: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { PATCH } from "@/app/api/messages/[conversationId]/read/route";

const conversationId = "conv-001";

function mockActiveUser() {
  mockAuth.mockResolvedValue({ user: { id: testUsers.regular.id } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: testUsers.regular.id,
    role: "USER",
    deletedAt: null,
    suspendedAt: null,
  });
}

function makePatchRequest(): NextRequest {
  return new NextRequest(`http://localhost:3000/api/messages/${conversationId}/read`, {
    method: "PATCH",
    headers: {
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
  });
}

describe("PATCH /api/messages/[conversationId]/read — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  it("returns 404 when conversation is not found for user", async () => {
    mockActiveUser();
    prismaMock.conversation.findFirst.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest(), {
      params: Promise.resolve({ conversationId }),
    });
    expect(res.status).toBe(404);
  });

  it("marks incoming messages as read", async () => {
    mockActiveUser();
    prismaMock.conversation.findFirst.mockResolvedValue({ id: conversationId });
    prismaMock.message.updateMany.mockResolvedValue({ count: 3 });

    const res = await PATCH(makePatchRequest(), {
      params: Promise.resolve({ conversationId }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.message.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          conversationId,
          senderId: { not: testUsers.regular.id },
          isRead: false,
        }),
      })
    );
  });
});
