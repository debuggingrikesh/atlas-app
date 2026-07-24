-- AlterTable
ALTER TABLE "ReviewCampaign" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "ReviewCampaign" ADD COLUMN "archivedById" TEXT;

-- AddForeignKey
ALTER TABLE "ReviewCampaign" ADD CONSTRAINT "ReviewCampaign_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
