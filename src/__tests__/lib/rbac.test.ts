import { describe, expect, it } from "vitest";
import { ADMIN_ROLES, isAdminRole, isElevatedAdminRole } from "@/lib/rbac";

describe("rbac", () => {
  it("treats ADMIN, SUPERADMIN, and MODERATOR as admin roles", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("SUPERADMIN")).toBe(true);
    expect(isAdminRole("MODERATOR")).toBe(true);
  });

  it("does not treat USER or marketplace roles as admin", () => {
    expect(isAdminRole("USER")).toBe(false);
    expect(isAdminRole("SELLER")).toBe(false);
    expect(isAdminRole("EXPERT")).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });

  it("limits elevated admin to ADMIN and SUPERADMIN", () => {
    expect(isElevatedAdminRole("ADMIN")).toBe(true);
    expect(isElevatedAdminRole("SUPERADMIN")).toBe(true);
    expect(isElevatedAdminRole("MODERATOR")).toBe(false);
  });

  it("exports stable admin role list", () => {
    expect(ADMIN_ROLES).toEqual(["ADMIN", "SUPERADMIN", "MODERATOR"]);
  });
});
