/**
 * Integration Tests — Phase 3 compliance routes
 */
import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

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
    account: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

const mockRequireActiveSession = vi.fn();
const mockRequireActiveMutation = vi.fn();

vi.mock("@/lib/session-guards", () => ({
  requireActiveSession: () => mockRequireActiveSession(),
  requireActiveMutation: (req: NextRequest) => mockRequireActiveMutation(req),
}));

import { GET as exportGET } from "@/app/api/user/export/route";
import { POST as policyAcceptPOST } from "@/app/api/user/policy-accept/route";
import { GET as retentionGET } from "@/app/api/cron/data-retention/route";

function makeMutationRequest(
  url: string,
  method: "POST" | "DELETE" = "POST"
): NextRequest {
  return new NextRequest(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
  });
}

describe("GET /api/user/export — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockRequireActiveSession.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
  });

  it("returns 401 when unauthenticated", async () => {
    const req = new NextRequest("http://localhost/api/user/export?sync=1");
    const res = await exportGET(req);
    expect(res.status).toBe(401);
  });

  it("returns JSON export for authenticated user", async () => {
    mockRequireActiveSession.mockResolvedValue({
      session: { user: { id: testUsers.regular.id } },
    });

    prismaMock.user.findUnique.mockResolvedValue({
      id: testUsers.regular.id,
      email: testUsers.regular.email,
      username: testUsers.regular.username,
      name: testUsers.regular.name,
      joinDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.post.findMany.mockResolvedValue([]);
    prismaMock.comment.findMany.mockResolvedValue([]);
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.serviceBooking.findMany.mockResolvedValue([]);
    prismaMock.notification.findMany.mockResolvedValue([]);
    prismaMock.neighbourConnection.findMany.mockResolvedValue([]);
    prismaMock.blockedUser.findMany.mockResolvedValue([]);
    prismaMock.savedPost.findMany.mockResolvedValue([]);
    prismaMock.followedPost.findMany.mockResolvedValue([]);
    prismaMock.consentRecord.findMany.mockResolvedValue([]);
    prismaMock.activityLog.findMany.mockResolvedValue([]);
    prismaMock.shop.findUnique.mockResolvedValue(null);
    prismaMock.expertService.findUnique.mockResolvedValue(null);
    prismaMock.contactInquiry.findMany.mockResolvedValue([]);
    prismaMock.featureSuggestion.findMany.mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/user/export?sync=1");
    const res = await exportGET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.profile.email).toBe(testUsers.regular.email);
    expect(json.exportedAt).toBeTruthy();
    expect(json.exportVersion).toBe("1.0.0");
  });
});

describe("POST /api/user/policy-accept — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockRequireActiveMutation.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await policyAcceptPOST(makeMutationRequest("http://localhost/api/user/policy-accept"));
    expect(res.status).toBe(401);
  });

  it("records policy acceptance for authenticated user", async () => {
    mockRequireActiveMutation.mockResolvedValue({
      session: { user: { id: testUsers.regular.id } },
    });
    prismaMock.user.update.mockResolvedValue({
      id: testUsers.regular.id,
      policyVersion: "1.0.0",
    });
    prismaMock.consentRecord.create.mockResolvedValue({ id: "consent-1" });

    const res = await policyAcceptPOST(
      makeMutationRequest("http://localhost/api/user/policy-accept")
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.policyVersion).toBe("1.0.0");
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: testUsers.regular.id },
        data: expect.objectContaining({ policyVersion: "1.0.0" }),
      })
    );
    expect(prismaMock.consentRecord.create).toHaveBeenCalled();
  });
});

describe("GET /api/cron/data-retention — Integration", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    resetPrismaMock();
    process.env.CRON_SECRET = "test-cron-secret";
    prismaMock.activityLog.deleteMany.mockResolvedValue({ count: 2 });
    prismaMock.auditLog.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.user.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  it("returns 401 without valid bearer token", async () => {
    const req = new NextRequest("http://localhost/api/cron/data-retention");
    const res = await retentionGET(req);
    expect(res.status).toBe(401);
  });

  it("runs retention jobs with valid cron secret", async () => {
    const req = new NextRequest("http://localhost/api/cron/data-retention", {
      headers: { authorization: "Bearer test-cron-secret" },
    });

    const res = await retentionGET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.activityPurged).toBe(2);
    expect(json.auditPurged).toBe(1);
    expect(json.usersPurged).toBe(0);
  });
});
