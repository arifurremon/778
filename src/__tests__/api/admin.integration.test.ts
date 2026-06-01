/**
 * Integration Tests — GET /api/admin
 *
 * Verifies that the admin dashboard stats endpoint correctly
 * enforces admin-only access and returns aggregate counts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";
import { testUsers } from "../fixtures/seed";

// Mock auth
const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

import { GET } from "@/app/api/admin/route";

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin", { method: "GET" });
}

describe("GET /api/admin — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  it("returns 401 for unauthenticated requests", async () => {
    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toContain("Unauthorized");
  });

  it("returns 403 for non-admin users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: testUsers.regular.id, isAdmin: false },
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: testUsers.regular.id,
      isAdmin: false,
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it("returns admin dashboard counts for admin users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: testUsers.admin.id, isAdmin: true },
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: testUsers.admin.id,
      isAdmin: true,
    });

    prismaMock.user.count
      .mockResolvedValueOnce(50) // totalUsers
      .mockResolvedValueOnce(3) // pendingShops (registrationStatus)
      .mockResolvedValueOnce(1) // pendingServices (serviceRegistrationStatus)
      .mockResolvedValueOnce(5); // pendingVerifications

    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.totalUsers).toBe(50);
    expect(json.pendingShops).toBe(3);
    expect(json.pendingServices).toBe(1);
    expect(json.pendingVerifications).toBe(5);
  });
});
