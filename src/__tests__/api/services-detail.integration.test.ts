/**
 * Integration Tests — GET /api/services/[expertId]
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({ logErrorToSentry: vi.fn() }));

import { GET } from "@/app/api/services/[expertId]/route";

const expertId = "service-001";

describe("GET /api/services/[expertId] — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  it("returns 404 when service does not exist", async () => {
    prismaMock.expertService.findUnique.mockResolvedValue(null);

    const res = await GET(new NextRequest(`http://localhost/api/services/${expertId}`), {
      params: Promise.resolve({ expertId }),
    });
    expect(res.status).toBe(404);
  });

  it("returns public expert service profile", async () => {
    prismaMock.expertService.findUnique.mockResolvedValue({
      id: expertId,
      profession: "Plumber",
      category: "Home Services",
      location: "Halishahar",
      fee: { toNumber: () => 800 },
      bio: "Emergency plumbing support.",
      rating: 4.5,
      isVerified: true,
      experienceYears: 8,
      user: {
        id: "user-1",
        name: "Expert User",
        username: "expert_user",
        profileImage: null,
        isVerified: true,
      },
    });

    const res = await GET(new NextRequest(`http://localhost/api/services/${expertId}`), {
      params: Promise.resolve({ expertId }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.profession).toBe("Plumber");
    expect(json.fee).toBe(800);
  });
});
