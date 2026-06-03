-- NeighbourConnection discovery indexes
CREATE INDEX IF NOT EXISTS "NeighbourConnection_senderId_status_idx"
  ON "NeighbourConnection"("senderId", "status");

CREATE INDEX IF NOT EXISTS "NeighbourConnection_receiverId_status_idx"
  ON "NeighbourConnection"("receiverId", "status");

-- Messaging tables may predate formal migrations on legacy databases.
-- Create them first so fresh CI databases can apply the indexes below.
CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" TEXT NOT NULL,
  "participantA" TEXT NOT NULL,
  "participantB" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_participantA_fkey"
    FOREIGN KEY ("participantA") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_participantB_fkey"
    FOREIGN KEY ("participantB") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Message"
    ADD CONSTRAINT "Message_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Message"
    ADD CONSTRAINT "Message_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_participantA_participantB_key"
    UNIQUE ("participantA", "participantB");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Conversation_participantA_idx"
  ON "Conversation"("participantA");

CREATE INDEX IF NOT EXISTS "Conversation_participantB_idx"
  ON "Conversation"("participantB");

CREATE INDEX IF NOT EXISTS "Conversation_participantA_updatedAt_idx"
  ON "Conversation"("participantA", "updatedAt");

CREATE INDEX IF NOT EXISTS "Message_conversationId_idx"
  ON "Message"("conversationId");
