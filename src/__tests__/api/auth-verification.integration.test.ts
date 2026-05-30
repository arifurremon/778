import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/mail", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimiters: {
    resendVerification: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("127.0.0.1"),
  }),
}));

import { GET as verifyEmail } from "@/app/api/auth/verify-email/[token]/route";
import { POST as resendVerification } from "@/app/api/auth/resend-verification/route";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/mail";

const VALID_EMAIL_TOKEN = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function makeResendRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("email verification flow", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.clearAllMocks();
  });

  it("verifies a valid, unexpired token and clears it", async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: testUsers.regular.id,
      email: testUsers.regular.email,
      name: testUsers.regular.name,
      emailVerified: null,
    });

    const req = new NextRequest(`http://localhost:3000/api/auth/verify-email/${VALID_EMAIL_TOKEN}`);
    const res = await verifyEmail(req, { params: Promise.resolve({ token: VALID_EMAIL_TOKEN }) });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?verified=true");
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        emailToken: VALID_EMAIL_TOKEN,
        emailTokenExp: { gt: expect.any(Date) },
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: testUsers.regular.id },
      data: {
        emailVerified: expect.any(Date),
        emailToken: null,
        emailTokenExp: null,
      },
    });
    expect(sendWelcomeEmail).toHaveBeenCalledWith({
      to: testUsers.regular.email,
      name: testUsers.regular.name,
    });
  });

  it("redirects invalid or expired tokens to login error", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/auth/verify-email/bad-token");
    const res = await verifyEmail(req, { params: Promise.resolve({ token: "bad-token" }) });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?error=invalid-verification-token");
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("resends a fresh verification token for an unverified email without requiring login", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: testUsers.regular.id,
      email: testUsers.regular.email,
      emailVerified: null,
    });

    const res = await resendVerification(makeResendRequest({ email: testUsers.regular.email }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: testUsers.regular.id },
      data: {
        emailToken: expect.stringMatching(/^[a-f0-9]{64}$/),
        emailTokenExp: expect.any(Date),
      },
    });
    const token = prismaMock.user.update.mock.calls[0]?.[0].data.emailToken;
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      testUsers.regular.email,
      `http://localhost:3000/api/auth/verify-email/${token}`
    );
  });
});
