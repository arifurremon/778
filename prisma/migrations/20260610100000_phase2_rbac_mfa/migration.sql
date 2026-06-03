-- Phase 2: RBAC role enum + admin MFA fields
CREATE TYPE "Role" AS ENUM ('USER', 'SELLER', 'EXPERT', 'MODERATOR', 'ADMIN', 'SUPERADMIN');

ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN "mfaSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User" SET "role" = 'ADMIN' WHERE "isAdmin" = true;
UPDATE "User" SET "role" = 'SELLER' WHERE "isSeller" = true AND "role" = 'USER';
UPDATE "User" SET "role" = 'EXPERT' WHERE "isServiceProvider" = true AND "role" = 'USER';
