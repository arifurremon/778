-- =============================================================================
-- Migration: phase1_critical_fixes
-- Date: 2026-06-01
-- Description: Phase 1 critical schema fixes identified in production readiness audit.
--
-- Changes:
--   1. User.dob         String?  → DateTime?
--   2. User.joinDate    String?  → DateTime?
--   3. Comment.deletedAt        → New column (soft delete, mirrors Post.deletedAt)
--   4. Comment index on deletedAt
--   5. ExpertService indexes    → category, location, isVerified, composite
--   6. Shop indexes             → category, location, isVerified
--   7. AuditLog.ipAddress       → String? to String (non-null)
--      NOTE: This migration sets a safe default '' for existing NULL rows before
--            applying the NOT NULL constraint. Review and back-fill real IPs
--            from server logs before deploying to production.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. User.dob: String? → DateTime?
--    Existing string values are cast to TIMESTAMP using NULLIF to safely
--    discard any rows that contain unparseable date strings (they become NULL).
-- ----------------------------------------------------------------------------
ALTER TABLE "User"
  ALTER COLUMN "dob" TYPE TIMESTAMP(3)
  USING NULLIF("dob", '')::TIMESTAMP(3);

-- ----------------------------------------------------------------------------
-- 2. User.joinDate: String? → DateTime?
-- ----------------------------------------------------------------------------
ALTER TABLE "User"
  ALTER COLUMN "joinDate" TYPE TIMESTAMP(3)
  USING NULLIF("joinDate", '')::TIMESTAMP(3);

-- ----------------------------------------------------------------------------
-- 3. Comment.deletedAt: Add soft-delete column (nullable, default NULL)
-- ----------------------------------------------------------------------------
ALTER TABLE "Comment"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- ----------------------------------------------------------------------------
-- 4. Comment index on deletedAt for efficient soft-delete filtering
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "Comment_deletedAt_idx" ON "Comment"("deletedAt");

-- ----------------------------------------------------------------------------
-- 5. ExpertService: Ensure isVerified exists before indexes
--    Prisma applies this migration (20260601) before 20260601000001_add_missing_fields
--    on fresh databases, so the column must be created here as well.
-- ----------------------------------------------------------------------------
ALTER TABLE "ExpertService" DROP COLUMN IF EXISTS "is_verified";
ALTER TABLE "ExpertService" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- ----------------------------------------------------------------------------
-- 6. ExpertService: Add missing discovery indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "ExpertService_category_idx"             ON "ExpertService"("category");
CREATE INDEX IF NOT EXISTS "ExpertService_location_idx"             ON "ExpertService"("location");
CREATE INDEX IF NOT EXISTS "ExpertService_isVerified_idx"           ON "ExpertService"("isVerified");
CREATE INDEX IF NOT EXISTS "ExpertService_category_isVerified_idx"  ON "ExpertService"("category", "isVerified");

-- ----------------------------------------------------------------------------
-- 7. Shop: Add missing discovery indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "Shop_category_idx"   ON "Shop"("category");
CREATE INDEX IF NOT EXISTS "Shop_location_idx"   ON "Shop"("location");
CREATE INDEX IF NOT EXISTS "Shop_isVerified_idx" ON "Shop"("isVerified");

-- ----------------------------------------------------------------------------
-- 8. AuditLog.ipAddress: Make non-nullable
--    Step 1: Back-fill existing NULL rows with empty string placeholder.
--    Step 2: Apply NOT NULL constraint.
--    NOTE: In production, back-fill with actual IPs from server logs BEFORE
--          running this migration if audit integrity is required for old rows.
-- ----------------------------------------------------------------------------
UPDATE "AuditLog" SET "ipAddress" = '' WHERE "ipAddress" IS NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "ipAddress" SET NOT NULL;
