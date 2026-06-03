-- Phase 3: Policy acceptance fields + consent ledger
CREATE TYPE "ConsentType" AS ENUM ('TERMS', 'PRIVACY', 'COOKIES_ANALYTICS', 'MARKETING');

ALTER TABLE "User" ADD COLUMN "policyAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "policyVersion" TEXT;

CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "version" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConsentRecord_userId_type_createdAt_idx" ON "ConsentRecord"("userId", "type", "createdAt");
CREATE INDEX "ConsentRecord_createdAt_idx" ON "ConsentRecord"("createdAt");

ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
