import { authConfig } from "@/auth.config";
import { describe, expect, it } from "vitest";

describe("authConfig JWT callback", () => {
  it("does not accept client-provided admin privilege during session updates", async () => {
    const token = { id: "user-1", isAdmin: false };

    const updated = await authConfig.callbacks!.jwt!({
      token,
      trigger: "update",
      session: {
        username: "new-name",
        profileImage: "https://example.com/avatar.png",
        isAdmin: true,
      },
    } as any);

    expect(updated.username).toBe("new-name");
    expect(updated.profileImage).toBe("https://example.com/avatar.png");
    expect(updated.isAdmin).toBe(false);
  });

  it("still records the database-backed admin flag at sign-in", async () => {
    const updated = await authConfig.callbacks!.jwt!({
      token: {},
      user: {
        id: "admin-1",
        username: "admin",
        isAdmin: true,
        profileImage: "https://example.com/admin.png",
      },
    } as any);

    expect(updated.id).toBe("admin-1");
    expect(updated.username).toBe("admin");
    expect(updated.isAdmin).toBe(true);
    expect(updated.profileImage).toBe("https://example.com/admin.png");
  });
});
