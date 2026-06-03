-- CreateTable
CREATE TABLE "FeatureSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInquiry" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeatureSuggestion_userId_idx" ON "FeatureSuggestion"("userId");
CREATE INDEX "FeatureSuggestion_createdAt_idx" ON "FeatureSuggestion"("createdAt");
CREATE INDEX "FeatureSuggestion_status_idx" ON "FeatureSuggestion"("status");

-- CreateIndex
CREATE INDEX "ContactInquiry_userId_idx" ON "ContactInquiry"("userId");
CREATE INDEX "ContactInquiry_createdAt_idx" ON "ContactInquiry"("createdAt");
CREATE INDEX "ContactInquiry_status_idx" ON "ContactInquiry"("status");

-- AddForeignKey
ALTER TABLE "FeatureSuggestion" ADD CONSTRAINT "FeatureSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactInquiry" ADD CONSTRAINT "ContactInquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
