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
    pusherAuth: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

const mockAuthorizeChannel = vi.fn().mockReturnValue({ auth: "test-key:signature" });

vi.mock("@/lib/pusher", () => ({
  pusher: {
    authorizeChannel: (...args: unknown[]) => mockAuthorizeChannel(...args),
  },
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { POST as pusherAuth } from "@/app/api/pusher/auth/route";

function makeAuthRequest(body: string, csrf = "test-csrf-token"): NextRequest {
  return new NextRequest("http://localhost:3000/api/pusher/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      origin: "http://localhost:3000",
      "x-csrf-token": csrf,
    },
    body,
  });
}

describe("Pusher auth API — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
    mockAuthorizeChannel.mockClear();
  });

  it("returns 401 for unauthenticated requests", async () => {
    const res = await pusherAuth(makeAuthRequest("socket_id=123&channel_name=private-user-x"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when channel does not belong to the user", async () => {
    mockAuth.mockResolvedValue({ user: { id: testUsers.regular.id } });
    prismaMock.user.findUnique.mockResolvedValue({
      id: testUsers.regular.id,
      role: "USER",
      deletedAt: null,
      suspendedAt: null,
    });

    const res = await pusherAuth(
      makeAuthRequest(
        `socket_id=123&channel_name=private-user-${testUsers.admin.id}`
      )
    );

    expect(res.status).toBe(403);
  });

  it("authorizes the user's own private channel", async () => {
    mockAuth.mockResolvedValue({ user: { id: testUsers.regular.id } });
    prismaMock.user.findUnique.mockResolvedValue({
      id: testUsers.regular.id,
      role: "USER",
      deletedAt: null,
      suspendedAt: null,
    });

    const res = await pusherAuth(
      makeAuthRequest(
        `socket_id=123.456&channel_name=private-user-${testUsers.regular.id}`
      )
    );

    expect(res.status).toBe(200);
    expect(mockAuthorizeChannel).toHaveBeenCalledWith(
      "123.456",
      `private-user-${testUsers.regular.id}`
    );
    const body = await res.json();
    expect(body.auth).toBe("test-key:signature");
  });
});
