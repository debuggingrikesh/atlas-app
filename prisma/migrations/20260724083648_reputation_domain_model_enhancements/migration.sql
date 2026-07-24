-- AlterTable
ALTER TABLE "ReviewRequest" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "openedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CustomerFeedback" ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "resolutionActorId" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FeedbackNote" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedbackNote_businessId_idx" ON "FeedbackNote"("businessId");

-- CreateIndex
CREATE INDEX "FeedbackNote_feedbackId_idx" ON "FeedbackNote"("feedbackId");

-- CreateIndex
CREATE INDEX "FeedbackNote_authorId_idx" ON "FeedbackNote"("authorId");

-- CreateIndex
CREATE INDEX "CustomerFeedback_assigneeId_idx" ON "CustomerFeedback"("assigneeId");

-- CreateIndex
CREATE INDEX "CustomerFeedback_resolutionActorId_idx" ON "CustomerFeedback"("resolutionActorId");

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "BusinessMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_resolutionActorId_fkey" FOREIGN KEY ("resolutionActorId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackNote" ADD CONSTRAINT "FeedbackNote_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackNote" ADD CONSTRAINT "FeedbackNote_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "CustomerFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackNote" ADD CONSTRAINT "FeedbackNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "BusinessMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

