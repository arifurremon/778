import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAdmin } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const adminSelect = {
  id: true,
  role: true,
  mfaEnabled: true,
  deletedAt: true,
  suspendedAt: true,
};

describe("requireAdmin() Library Utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no session exists", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await requireAdmin();

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
    expect(db.user.findUnique).not.toHaveBeenCalled();

    const body = await result.error?.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 if the session user was deleted from the database", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "missing-user" } } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const result = await requireAdmin();

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(403);
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: "missing-user" },
      select: adminSelect,
    });

    const body = await result.error?.json();
    expect(body.error).toBe("Forbidden: Account not found");
  });

  it("returns 403 if the database user is not an admin even when the JWT says admin", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", role: "ADMIN" },
    } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "user-1",
      role: "USER",
      mfaEnabled: false,
      deletedAt: null,
      suspendedAt: null,
    } as any);

    const result = await requireAdmin();

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(403);

    const body = await result.error?.json();
    expect(body.error).toBe("Forbidden: Admin access required");
  });

  it("returns the session and database user if the live database record is admin", async () => {
    const mockSession = { user: { id: "admin-1", role: "USER", email: "admin@test.com" } };
    const mockDbUser = {
      id: "admin-1",
      role: "ADMIN",
      mfaEnabled: true,
      deletedAt: null,
      suspendedAt: null,
    };
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as any);

    const result = await requireAdmin();

    expect(result.error).toBeUndefined();
    expect(result.session).toEqual(mockSession);
    expect(result.dbUser).toEqual(mockDbUser);
  });

  it("returns 401 for malformed sessions without a user id", async () => {
    vi.mocked(auth).mockResolvedValue({ user: {} } as any);

    const result = await requireAdmin();

    expect(result.error?.status).toBe(401);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });
});
