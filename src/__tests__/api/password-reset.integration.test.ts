import crypto from "crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/mail", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => true),
  runRateLimit: vi.fn(
    (limiter: { limit: (key: string) => Promise<{ success: boolean }> }, key: string) =>
      limiter.limit(key)
  ),
  rateLimiters: {
    forgotPassword: { limit: vi.fn().mockResolvedValue({ success: true }) },
    resetPassword: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("127.0.0.1"),
  }),
}));

import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";
import { POST as resetPassword } from "@/app/api/auth/reset-password/route";
import { sendPasswordResetEmail } from "@/lib/mail";

function makeRequest(url: string, body: Record<string, unknown>, includeCsrf = true): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(includeCsrf && {
        origin: "http://localhost:3000",
        "x-csrf-token": "test-csrf-token",
      }),
    },
    body: JSON.stringify(body),
  });
}

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

describe("password reset flow", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.clearAllMocks();
  });

  it("stores only a hash of the reset token and emails the raw token", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: testUsers.regular.id,
      email: testUsers.regular.email,
    });
    prismaMock.user.update.mockResolvedValue({ id: testUsers.regular.id });

    const res = await forgotPassword(
      makeRequest("http://localhost:3000/api/auth/forgot-password", {
        email: testUsers.regular.email.toUpperCase(),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: testUsers.regular.email.toLowerCase() },
      select: { id: true, email: true },
    });

    const updateCall = prismaMock.user.update.mock.calls[0]?.[0];
    const storedHash = updateCall?.data.resetToken;
    expect(storedHash).toMatch(/^[a-f0-9]{64}$/);
    expect(updateCall?.data.resetTokenExp).toBeInstanceOf(Date);

    const emailedLink = (sendPasswordResetEmail as any).mock.calls[0]?.[1] as string;
    const rawToken = emailedLink.split("/reset-password/")[1];
    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(storedHash).not.toBe(rawToken);
    expect(storedHash).toBe(sha256Hex(rawToken!));
  });

  it("returns a generic response for unknown emails without sending mail", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await forgotPassword(
      makeRequest("http://localhost:3000/api/auth/forgot-password", {
        email: "missing@example.com",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("requires a CSRF token before accepting password-reset requests", async () => {
    const res = await forgotPassword(
      makeRequest(
        "http://localhost:3000/api/auth/forgot-password",
        { email: testUsers.regular.email },
        false
      )
    );
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain("CSRF token");
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("looks up reset tokens by hash, updates atomically, and invalidates sessions", async () => {
    const rawToken = "b".repeat(64);
    const tokenHash = sha256Hex(rawToken);
    prismaMock.user.findFirst.mockResolvedValue({ id: testUsers.regular.id });
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.session.deleteMany.mockResolvedValue({ count: 2 });

    const res = await resetPassword(
      makeRequest("http://localhost:3000/api/auth/reset-password", {
        token: rawToken,
        password: "new-secure1!",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        resetToken: tokenHash,
        resetTokenExp: { gt: expect.any(Date) },
      },
      select: { id: true },
    });
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: testUsers.regular.id,
        resetToken: tokenHash,
        resetTokenExp: { gt: expect.any(Date) },
      },
      data: {
        password: expect.stringMatching(/^\$2[ab]\$/),
        resetToken: null,
        resetTokenExp: null,
      },
    });
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: testUsers.regular.id },
    });
  });
});
