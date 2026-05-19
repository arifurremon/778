-- Clean all old user data for fresh start
-- Delete in correct order respecting foreign key constraints

-- Delete tables that reference User
DELETE FROM "NeighbourConnection";
DELETE FROM "Product";
DELETE FROM "Comment";
DELETE FROM "Post";
DELETE FROM "ExpertService";
DELETE FROM "Shop";
DELETE FROM "AuditLog";
DELETE FROM "ActivityLog";
DELETE FROM "Account";
DELETE FROM "Session";

-- Finally delete User records
DELETE FROM "User";

-- Update User schema: remove preferredName, add profession
ALTER TABLE "User" DROP COLUMN IF EXISTS "preferredName";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profession" TEXT DEFAULT 'Not specified';

-- Reset sequences/auto-increment if needed
ALTER SEQUENCE IF EXISTS "Post_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "Comment_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "User_id_seq" RESTART WITH 1;
