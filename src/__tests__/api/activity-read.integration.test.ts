/**
 * Integration Tests — PATCH /api/activity/[activityId]/read
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
    activity: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { PATCH } from "@/app/api/activity/[activityId]/read/route";

const activityId = "activity-001";

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
  return new NextRequest(`http://localhost:3000/api/activity/${activityId}/read`, {
    method: "PATCH",
    headers: {
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
  });
}

describe("PATCH /api/activity/[activityId]/read — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  it("returns 404 when activity does not exist", async () => {
    mockActiveUser();
    prismaMock.activityLog.findUnique.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest(), {
      params: Promise.resolve({ activityId }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 403 when activity belongs to another user", async () => {
    mockActiveUser();
    prismaMock.activityLog.findUnique.mockResolvedValue({
      id: activityId,
      userId: "other-user",
    });

    const res = await PATCH(makePatchRequest(), {
      params: Promise.resolve({ activityId }),
    });
    expect(res.status).toBe(403);
  });

  it("marks activity as read", async () => {
    mockActiveUser();
    prismaMock.activityLog.findUnique.mockResolvedValue({
      id: activityId,
      userId: testUsers.regular.id,
    });
    prismaMock.activityLog.update.mockResolvedValue({
      id: activityId,
      type: "POST_CREATED",
      description: "You created a post",
      createdAt: new Date(),
      isRead: true,
      contextUrl: "/community",
      metadata: {},
    });

    const res = await PATCH(makePatchRequest(), {
      params: Promise.resolve({ activityId }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.activity.isRead).toBe(true);
  });
});
