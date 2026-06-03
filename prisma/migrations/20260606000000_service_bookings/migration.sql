-- Service booking requests between clients and expert providers.
CREATE TYPE "ServiceBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'REJECTED');
CREATE TYPE "ServiceBookingSubStatus" AS ENUM ('CONFIRMED', 'ON_MY_WAY', 'SERVICE_STARTED');

CREATE TABLE IF NOT EXISTS "ServiceBooking" (
  "id" TEXT NOT NULL,
  "expertServiceId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "scheduledDate" TIMESTAMP(3),
  "address" TEXT,
  "notes" TEXT,
  "fee" TEXT NOT NULL,
  "status" "ServiceBookingStatus" NOT NULL DEFAULT 'PENDING',
  "subStatus" "ServiceBookingSubStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ServiceBooking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ServiceBooking_expertServiceId_idx" ON "ServiceBooking"("expertServiceId");
CREATE INDEX IF NOT EXISTS "ServiceBooking_clientId_idx" ON "ServiceBooking"("clientId");
CREATE INDEX IF NOT EXISTS "ServiceBooking_status_idx" ON "ServiceBooking"("status");

ALTER TABLE "ServiceBooking"
  ADD CONSTRAINT "ServiceBooking_expertServiceId_fkey"
  FOREIGN KEY ("expertServiceId") REFERENCES "ExpertService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceBooking"
  ADD CONSTRAINT "ServiceBooking_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
