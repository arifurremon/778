import type { Role } from "@prisma/client";

/** Roles that may access the admin panel and admin API routes. */
export const ADMIN_ROLES: Role[] = ["ADMIN", "SUPERADMIN", "MODERATOR"];

/** Roles with full platform administration (not content-only moderator). */
export const ELEVATED_ADMIN_ROLES: Role[] = ["ADMIN", "SUPERADMIN"];

export function isAdminRole(role: Role | null | undefined, isAdminFallback = false): boolean {
  if (role && ADMIN_ROLES.includes(role)) return true;
  return isAdminFallback;
}

export function isElevatedAdminRole(role: Role | null | undefined, isAdminFallback = false): boolean {
  if (role && ELEVATED_ADMIN_ROLES.includes(role)) return true;
  return isAdminFallback;
}

export function roleFromLegacyFlags(isAdmin: boolean): Role {
  return isAdmin ? "ADMIN" : "USER";
}
