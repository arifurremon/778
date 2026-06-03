-- ActivityLog query index
CREATE INDEX IF NOT EXISTS "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");

-- Post repost support
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "repostOfId" TEXT;
DO $$ BEGIN
  ALTER TABLE "Post" ADD CONSTRAINT "Post_repostOfId_fkey" FOREIGN KEY ("repostOfId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Saved posts
CREATE TABLE IF NOT EXISTS "SavedPost" (
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedPost_pkey" PRIMARY KEY ("userId","postId")
);

CREATE INDEX IF NOT EXISTS "SavedPost_postId_idx" ON "SavedPost"("postId");

DO $$ BEGIN
  ALTER TABLE "SavedPost" ADD CONSTRAINT "SavedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "SavedPost" ADD CONSTRAINT "SavedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Followed posts
CREATE TABLE IF NOT EXISTS "FollowedPost" (
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FollowedPost_pkey" PRIMARY KEY ("userId","postId")
);

CREATE INDEX IF NOT EXISTS "FollowedPost_postId_idx" ON "FollowedPost"("postId");

DO $$ BEGIN
  ALTER TABLE "FollowedPost" ADD CONSTRAINT "FollowedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "FollowedPost" ADD CONSTRAINT "FollowedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Emergency contacts
CREATE TABLE IF NOT EXISTS "EmergencyContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- Directory entries (create legacy-safe, then align columns)
CREATE TABLE IF NOT EXISTS "DirectoryEntry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DirectoryEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DirectoryEntry" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "DirectoryEntry" ADD COLUMN IF NOT EXISTS "metadata" JSONB NOT NULL DEFAULT '{}';
UPDATE "DirectoryEntry" SET "type" = COALESCE("type", 'tourism') WHERE "type" IS NULL;
ALTER TABLE "DirectoryEntry" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "DirectoryEntry" ALTER COLUMN "metadata" SET DEFAULT '{}';

CREATE INDEX IF NOT EXISTS "DirectoryEntry_type_idx" ON "DirectoryEntry"("type");
CREATE INDEX IF NOT EXISTS "DirectoryEntry_category_idx" ON "DirectoryEntry"("category");
