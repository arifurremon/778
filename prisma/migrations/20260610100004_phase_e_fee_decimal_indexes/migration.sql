-- Phase E: ExpertService/ServiceBooking fee → DECIMAL; pagination indexes

-- Convert legacy string fees (e.g. "৳1,500") to numeric DECIMAL(10,2)
ALTER TABLE "ExpertService"
  ALTER COLUMN "fee" TYPE DECIMAL(10,2)
  USING (
    CASE
      WHEN regexp_replace("fee", '[^0-9.]', '', 'g') = '' THEN 0
      ELSE regexp_replace("fee", '[^0-9.]', '', 'g')::DECIMAL(10,2)
    END
  );

ALTER TABLE "ServiceBooking"
  ALTER COLUMN "fee" TYPE DECIMAL(10,2)
  USING (
    CASE
      WHEN regexp_replace("fee", '[^0-9.]', '', 'g') = '' THEN 0
      ELSE regexp_replace("fee", '[^0-9.]', '', 'g')::DECIMAL(10,2)
    END
  );

-- Message pagination: WHERE conversationId = ? ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx"
  ON "Message"("conversationId", "createdAt");

-- Admin/seller order queues: WHERE status = ? ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx"
  ON "Order"("status", "createdAt");
