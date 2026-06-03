/**
 * Integration Tests — Phase 4 forms API
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => true),
  runRateLimit: vi.fn().mockResolvedValue({ success: true }),
  rateLimiters: {
    suggestions: {},
    contact: {},
  },
}));

vi.mock("@/lib/rate-limit-request", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/mail", () => ({
  sendNotificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/settings-utils", () => ({
  getSupportContactEmail: vi.fn().mockResolvedValue("support@thechattala.com"),
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { POST as createSuggestion } from "@/app/api/suggestions/route";
import { POST as createContact } from "@/app/api/contact/route";

function mockActiveUser(userId: string, name = "Test User", email = "test@example.com") {
  mockAuth.mockResolvedValue({ user: { id: userId, name, email } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: userId,
    isAdmin: false,
    deletedAt: null,
    suspendedAt: null,
  });
}

function makePostRequest(url: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
    body: JSON.stringify(body),
  });
}

describe("Phase 4 forms API — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  it("creates a feature suggestion for an authenticated user", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.featureSuggestion.create.mockResolvedValue({
      id: "suggestion-1",
      title: "Local Event Calendar",
      details: "Help residents discover events.",
      status: "PENDING",
      createdAt: new Date(),
    });

    const res = await createSuggestion(
      makePostRequest("http://localhost:3000/api/suggestions", {
        title: "Local Event Calendar",
        details: "Help residents discover events.",
      })
    );

    expect(res.status).toBe(201);
    expect(prismaMock.featureSuggestion.create).toHaveBeenCalled();
  });

  it("creates a contact inquiry for an authenticated user", async () => {
    mockActiveUser(testUsers.regular.id, testUsers.regular.name, testUsers.regular.email);
    prismaMock.contactInquiry.create.mockResolvedValue({
      id: "inquiry-1",
      subject: "Partnership",
      status: "NEW",
      createdAt: new Date(),
    });

    const res = await createContact(
      makePostRequest("http://localhost:3000/api/contact", {
        name: testUsers.regular.name,
        email: testUsers.regular.email,
        subject: "Partnership",
        message: "We would like to collaborate on a local initiative.",
      })
    );

    expect(res.status).toBe(201);
    expect(prismaMock.contactInquiry.create).toHaveBeenCalled();
  });
});
