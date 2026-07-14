-- CreateTable
CREATE TABLE "BusinessAISettings" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'Professional',
    "brandDescription" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'English',
    "customInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessAISettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIResponse" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "generatedText" TEXT NOT NULL,
    "toneUsed" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessAISettings_businessId_key" ON "BusinessAISettings"("businessId");

-- CreateIndex
CREATE INDEX "BusinessAISettings_businessId_idx" ON "BusinessAISettings"("businessId");

-- CreateIndex
CREATE INDEX "AIResponse_businessId_idx" ON "AIResponse"("businessId");

-- CreateIndex
CREATE INDEX "AIResponse_feedbackId_idx" ON "AIResponse"("feedbackId");

-- AddForeignKey
ALTER TABLE "BusinessAISettings" ADD CONSTRAINT "BusinessAISettings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIResponse" ADD CONSTRAINT "AIResponse_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIResponse" ADD CONSTRAINT "AIResponse_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "CustomerFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
