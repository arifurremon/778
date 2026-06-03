import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({ logErrorToSentry: vi.fn() }));

vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => false),
  runRateLimit: vi.fn(async () => ({ success: true, limit: 30, remaining: 29, reset: Date.now() + 60_000 })),
  rateLimiters: {
    messages: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

const mockRequireActiveMutation = vi.fn();
vi.mock("@/lib/session-guards", () => ({
  requireActiveMutation: (req: NextRequest) => mockRequireActiveMutation(req),
}));

import { POST } from "@/app/api/messages/route";

describe("POST /api/messages — block enforcement", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockRequireActiveMutation.mockResolvedValue({
      error: null,
      session: { user: { id: "viewer-1" } },
    });
    prismaMock.user.findUnique.mockResolvedValue({ id: "blocked-target" });
    prismaMock.blockedUser.findFirst.mockResolvedValue({ blockerId: "viewer-1", blockedId: "blocked-target" });
  });

  it("returns 403 when starting conversation with blocked user", async () => {
    const req = new NextRequest("http://localhost/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "http://localhost",
        "x-csrf-token": "test",
      },
      body: JSON.stringify({ recipientId: "blocked-target" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(prismaMock.user.findUnique).toHaveBeenCalled();
  });
});
