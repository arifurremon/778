import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAdmin } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

describe("requireAdmin() Library Utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 error if no session exists", async () => {
    (auth as any).mockResolvedValue(null);

    const result = await requireAdmin();

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
    
    const body = await result.error?.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("should return 403 error if user is not an admin", async () => {
    (auth as any).mockResolvedValue({
      user: { id: "user-1", isAdmin: false },
    });

    const result = await requireAdmin();

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(403);
    
    const body = await result.error?.json();
    expect(body.error).toBe("Forbidden: Admin access required");
  });

  it("should return the session if user is an admin", async () => {
    const mockSession = { user: { id: "admin-1", isAdmin: true, email: "admin@test.com" } };
    (auth as any).mockResolvedValue(mockSession);

    const result = await requireAdmin();

    expect(result.error).toBeUndefined();
    expect(result.session).toEqual(mockSession);
  });

  it("should handle unexpected session structure gracefully", async () => {
    (auth as any).mockResolvedValue({ user: {} });

    const result = await requireAdmin();
    expect(result.error?.status).toBe(403);
  });

  it("should block users with isAdmin set to null or undefined", async () => {
    (auth as any).mockResolvedValue({ user: { id: "user-2" } });
    const result = await requireAdmin();
    expect(result.error?.status).toBe(403);
  });

  it("should return Unauthorized if session is empty object", async () => {
    (auth as any).mockResolvedValue({});
    const result = await requireAdmin();
    expect(result.error?.status).toBe(401);
  });
});
