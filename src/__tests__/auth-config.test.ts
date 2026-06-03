import { authConfig } from "@/auth.config";
import { describe, expect, it } from "vitest";

describe("authConfig JWT callback", () => {
  it("does not accept client-provided role escalation during session updates", async () => {
    const token = { id: "user-1", role: "USER" as const };

    const updated = await authConfig.callbacks!.jwt!({
      token,
      trigger: "update",
      session: {
        username: "new-name",
        profileImage: "https://example.com/avatar.png",
        role: "ADMIN",
      },
    } as any);

    expect(updated!.username).toBe("new-name");
    expect(updated!.profileImage).toBe("https://example.com/avatar.png");
    expect(updated!.role).toBe("USER");
  });

  it("records the database-backed role at sign-in", async () => {
    const updated = await authConfig.callbacks!.jwt!({
      token: {},
      user: {
        id: "admin-1",
        username: "admin",
        role: "ADMIN",
        profileImage: "https://example.com/admin.png",
      },
    } as any);

    expect(updated!.id).toBe("admin-1");
    expect(updated!.username).toBe("admin");
    expect(updated!.role).toBe("ADMIN");
    expect(updated!.profileImage).toBe("https://example.com/admin.png");
  });
});
