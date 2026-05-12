/**
 * Integration Tests — POST /api/auth/register
 *
 * These tests call the actual route handler function with mocked dependencies
 * (Prisma, rate limiter, mail) to verify correct HTTP responses, validation,
 * password hashing, and duplicate-detection logic.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";
import { testUsers, validRegistrationPayload, getTestPasswordHash } from "../fixtures/seed";

// Mock rate-limiter to always allow
vi.mock("@/lib/rate-limit", () => ({
  rateLimiters: {
    register: { limit: vi.fn().mockResolvedValue({ success: true }) },
    signin: { limit: vi.fn().mockResolvedValue({ success: true }) },
    posts: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

// Mock mail to prevent real SMTP calls
vi.mock("@/lib/mail", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock error handler
vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("127.0.0.1"),
  }),
}));

// Import the handler AFTER mocks are configured
import { POST } from "@/app/api/auth/register/route";

// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------

describe("POST /api/auth/register — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  // ----- Validation --------------------------------------------------------

  it("rejects request with invalid email", async () => {
    const res = await POST(makeRequest({ ...validRegistrationPayload, email: "not-an-email" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toContain("Invalid email");
  });

  it("rejects request with password too short", async () => {
    const res = await POST(makeRequest({ ...validRegistrationPayload, password: "123" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toContain("at least 6 characters");
  });

  it("rejects request with missing required fields", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", password: "123456" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("rejects invalid username characters", async () => {
    const res = await POST(
      makeRequest({ ...validRegistrationPayload, username: "bad user!@#" })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toContain("letters, numbers, and underscores");
  });

  // ----- Duplicate checks --------------------------------------------------

  it("rejects duplicate email (409)", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: testUsers.regular.id }); // email exists

    const res = await POST(makeRequest(validRegistrationPayload));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.message).toContain("Email already registered");
  });

  it("rejects duplicate username (409)", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce(null) // email check passes
      .mockResolvedValueOnce({ id: testUsers.regular.id }); // username exists

    const res = await POST(makeRequest(validRegistrationPayload));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.message).toContain("Username taken");
  });

  // ----- Successful registration -------------------------------------------

  it("creates user and returns 201 on valid input", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null); // no duplicates
    prismaMock.user.create.mockResolvedValue({ id: "new-user-id" });

    const res = await POST(makeRequest(validRegistrationPayload));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.message).toBe("Account created.");
    expect(prismaMock.user.create).toHaveBeenCalledOnce();
  });

  it("stores hashed password (not plaintext)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "new-user-id" });

    await POST(makeRequest(validRegistrationPayload));

    const createCall = prismaMock.user.create.mock.calls[0][0];
    const storedPassword = createCall.data.password;

    // bcryptjs hashes start with "$2a$" or "$2b$"
    expect(storedPassword).toMatch(/^\$2[ab]\$/);
    expect(storedPassword).not.toBe(validRegistrationPayload.password);
  });

  // ----- Rate limiting -----------------------------------------------------

  it("returns 429 when rate limited", async () => {
    const { rateLimiters } = await import("@/lib/rate-limit");
    (rateLimiters.register.limit as any).mockResolvedValueOnce({ success: false });

    const res = await POST(makeRequest(validRegistrationPayload));
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.message).toContain("Too many attempts");
  });
});
