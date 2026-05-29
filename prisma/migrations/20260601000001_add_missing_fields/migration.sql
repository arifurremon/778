-- Migration: Add missing fields to ExpertService and Post tables

-- 1. Add isVerified to ExpertService (mapped as is_verified)
ALTER TABLE "ExpertService" ADD COLUMN IF NOT EXISTS "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- 2. Add flagged to Post
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "flagged" BOOLEAN NOT NULL DEFAULT false;

-- 3. Add moderationStatus to Post (mapped as moderation_status)
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "moderation_status" TEXT NOT NULL DEFAULT 'APPROVED';

-- 4. Create Index on flagged
CREATE INDEX IF NOT EXISTS "Post_flagged_idx" ON "Post"("flagged");
