/**
 * Integration Tests — POST /api/services
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => true),
  runRateLimit: vi.fn(
    (limiter: { limit: (key: string) => Promise<{ success: boolean }> }, key: string) =>
      limiter.limit(key)
  ),
  rateLimiters: {
    register: { limit: vi.fn().mockResolvedValue({ success: true }) },
    signin: { limit: vi.fn().mockResolvedValue({ success: true }) },
    posts: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

vi.mock("@/lib/cache", () => ({
  cachedQuery: vi.fn((_key: string, fn: () => Promise<unknown>) => fn()),
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

import { POST } from "@/app/api/services/route";

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/services", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
    body: JSON.stringify(body),
  });
}

function mockActiveUser(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: userId,
    role: "USER",
    deletedAt: null,
    suspendedAt: null,
  });
}

const validServicePayload = {
  profession: "Heart Specialist",
  category: "Doctor",
  location: "Panchlaish, Agrabad",
  experienceYears: 8,
  fee: "1500",
  bio: "Heart Specialist provides Doctor services in Chittagong. Service mode: Home. Coverage: Panchlaish, Agrabad. Available on Sat, Sun during 4 PM - 8 PM.",
  qualifications: ["Doctor", "Heart Specialist", "8 years experience", "BMDC A-12345"],
  payoutMethod: "BKASH",
  registrationDetails: {
    nidNumber: "1234567890",
    payoutDetails: "01712345678",
  },
};

const createdService = {
  id: "service-1",
  profession: validServicePayload.profession,
  category: validServicePayload.category,
  location: validServicePayload.location,
  experienceYears: validServicePayload.experienceYears,
  fee: validServicePayload.fee,
  bio: validServicePayload.bio,
  qualifications: validServicePayload.qualifications,
  rating: 5,
  createdAt: new Date(),
  user: {
    id: testUsers.regular.id,
    name: testUsers.regular.name,
    preferredName: testUsers.regular.preferredName,
    username: testUsers.regular.username,
    profileImage: null,
    isVerified: false,
  },
};

describe("POST /api/services — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  it("returns 401 when user is unauthenticated", async () => {
    const res = await POST(makePostRequest(validServicePayload));
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    mockActiveUser(testUsers.regular.id);

    const res = await POST(makePostRequest({ profession: "A" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBeTruthy();
  });

  it("returns 409 when user already has a service", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.expertService.findUnique.mockResolvedValue({ id: "existing-service" });

    const res = await POST(makePostRequest(validServicePayload));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain("already have a registered expert service");
  });

  it("creates a service and sets serviceRegistrationStatus to PENDING", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.expertService.findUnique.mockResolvedValue(null);
    prismaMock.expertService.create.mockResolvedValue(createdService);
    prismaMock.user.update.mockResolvedValue({});

    const res = await POST(makePostRequest(validServicePayload));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.id).toBe("service-1");
    expect(prismaMock.expertService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: testUsers.regular.id,
          profession: validServicePayload.profession,
          payoutMethod: "BKASH",
          registrationDetails: validServicePayload.registrationDetails,
        }),
      })
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: testUsers.regular.id },
      data: { serviceRegistrationStatus: "PENDING" },
    });
  });
});
