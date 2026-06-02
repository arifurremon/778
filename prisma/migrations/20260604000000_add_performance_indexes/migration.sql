-- CreateIndex
CREATE INDEX "NeighbourConnection_senderId_status_idx" ON "NeighbourConnection"("senderId", "status");

-- CreateIndex
CREATE INDEX "NeighbourConnection_receiverId_status_idx" ON "NeighbourConnection"("receiverId", "status");

-- CreateIndex
CREATE INDEX "Conversation_participantA_idx" ON "Conversation"("participantA");

-- CreateIndex
CREATE INDEX "Conversation_participantB_idx" ON "Conversation"("participantB");

-- CreateIndex
CREATE INDEX "Conversation_participantA_updatedAt_idx" ON "Conversation"("participantA", "updatedAt");
