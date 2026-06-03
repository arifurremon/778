import type { Role } from "@prisma/client";

/** Roles that may access the admin panel and admin API routes. */
export const ADMIN_ROLES: Role[] = ["ADMIN", "SUPERADMIN", "MODERATOR"];

/** Roles with full platform administration (not content-only moderator). */
export const ELEVATED_ADMIN_ROLES: Role[] = ["ADMIN", "SUPERADMIN"];

export const ROLE_VALUES = [
  "USER",
  "SELLER",
  "EXPERT",
  "MODERATOR",
  "ADMIN",
  "SUPERADMIN",
] as const satisfies readonly Role[];

export function isAdminRole(role: Role | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

export function isElevatedAdminRole(role: Role | null | undefined): boolean {
  return !!role && ELEVATED_ADMIN_ROLES.includes(role);
}

/** Standard community member without elevated privileges. */
export function isStandardUserRole(role: Role | null | undefined): boolean {
  return !role || role === "USER";
}
