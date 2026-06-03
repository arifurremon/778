/**
 * Integration Tests — GET /api/services/me
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({ logErrorToSentry: vi.fn() }));

const mockRequireActiveSession = vi.fn();
vi.mock("@/lib/session-guards", () => ({
  requireActiveSession: () => mockRequireActiveSession(),
}));

import { GET } from "@/app/api/services/me/route";

describe("GET /api/services/me — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockRequireActiveSession.mockResolvedValue({
      error: null,
      session: { user: { id: testUsers.regular.id } },
    });
  });

  it("returns 404 when user has no expert service", async () => {
    prismaMock.expertService.findUnique.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns expert service profile", async () => {
    prismaMock.expertService.findUnique.mockResolvedValue({
      id: "service-1",
      profession: "Electrician",
      category: "Home Services",
      location: "Panchlaish",
      fee: "500",
      bio: "Licensed electrician.",
      rating: 4.8,
      isVerified: true,
      experienceYears: 5,
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.profession).toBe("Electrician");
  });

  it("returns 401 when session guard fails", async () => {
    mockRequireActiveSession.mockResolvedValue({
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await GET();
    expect(res.status).toBe(401);
  });
});
