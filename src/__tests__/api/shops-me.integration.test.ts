/**
 * Integration Tests — GET /api/shops/me
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

const mockRequireActiveSession = vi.fn();
vi.mock("@/lib/session-guards", () => ({
  requireActiveSession: () => mockRequireActiveSession(),
}));

import { GET } from "@/app/api/shops/me/route";

describe("GET /api/shops/me — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockRequireActiveSession.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 when user has no shop", async () => {
    mockRequireActiveSession.mockResolvedValue({
      session: { user: { id: testUsers.regular.id } },
    });
    prismaMock.shop.findUnique.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns the authenticated user's shop", async () => {
    mockRequireActiveSession.mockResolvedValue({
      session: { user: { id: testUsers.regular.id } },
    });
    prismaMock.shop.findUnique.mockResolvedValue({
      id: "shop-1",
      name: "Chattala Tech Mart",
      description: "Electronics",
      category: "Electronics",
      location: "Panchlaish",
      isVerified: false,
      rating: 5,
      trustScore: 100,
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.id).toBe("shop-1");
    expect(prismaMock.shop.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: testUsers.regular.id },
      })
    );
  });
});
