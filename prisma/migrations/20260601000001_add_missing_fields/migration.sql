-- Migration: Add missing fields to ExpertService and Post tables
--
-- CORRECTION NOTE: An earlier version of this file incorrectly used
-- snake_case column names ("is_verified", "moderation_status"). This
-- project uses camelCase columns throughout (no @map annotations on
-- these fields), so the correct names are "isVerified" and
-- "moderationStatus". The DROP COLUMN IF EXISTS guards below clean up
-- any wrongly-named columns that may have been created by a previous
-- run of the incorrect migration.

-- 1. ExpertService.isVerified
-- Remove the incorrectly-named column if it was ever created, then
-- add the correct camelCase column.
ALTER TABLE "ExpertService" DROP COLUMN IF EXISTS "is_verified";
ALTER TABLE "ExpertService" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- 2. Post.flagged (name has no casing ambiguity — this line was always correct)
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "flagged" BOOLEAN NOT NULL DEFAULT false;

-- 3. Post.moderationStatus
-- Remove the incorrectly-named column if it was ever created, then
-- add the correct camelCase column.
ALTER TABLE "Post" DROP COLUMN IF EXISTS "moderation_status";
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "moderationStatus" TEXT NOT NULL DEFAULT 'APPROVED';

-- 4. Index on Post.flagged — used by admin moderation queries
CREATE INDEX IF NOT EXISTS "Post_flagged_idx" ON "Post"("flagged");

-- 5. Index on Post.moderationStatus — used by admin moderation queries
CREATE INDEX IF NOT EXISTS "Post_moderationStatus_idx" ON "Post"("moderationStatus");
