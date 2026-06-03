-- Phase 6: Notification inbox + NotificationType enum
-- Idempotent for environments where Phase 5 created these objects manually.

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'POST_REACTION',
    'NEW_COMMENT',
    'COMMENT_REPLY',
    'POST_FLAGGED',
    'NEIGHBOR_REQUEST',
    'NEIGHBOR_ACCEPTED',
    'NEW_ORDER',
    'ORDER_UPDATED',
    'SHOP_VERIFIED',
    'NEW_PRODUCT_REVIEW',
    'SERVICE_BOOKED',
    'SERVICE_UPDATED',
    'SERVICE_VERIFIED',
    'SYSTEM_ALERT',
    'MODERATION_ACTION'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "actorId" TEXT,
  "type" "NotificationType" NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx"
  ON "Notification"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx"
  ON "Notification"("userId", "isRead");

DO $$ BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
