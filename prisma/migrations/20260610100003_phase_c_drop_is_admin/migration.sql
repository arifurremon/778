-- Phase C: role enum is the single admin authority; drop legacy isAdmin flag
UPDATE "User" SET "role" = 'ADMIN' WHERE "isAdmin" = true AND "role" = 'USER';
ALTER TABLE "User" DROP COLUMN "isAdmin";
