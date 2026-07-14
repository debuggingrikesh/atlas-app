-- CreateEnum
CREATE TYPE "UpgradeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "UpgradeRequest" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "requestedPlanId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" "UpgradeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpgradeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UpgradeRequest_businessId_idx" ON "UpgradeRequest"("businessId");

-- CreateIndex
CREATE INDEX "UpgradeRequest_requestedPlanId_idx" ON "UpgradeRequest"("requestedPlanId");

-- CreateIndex
CREATE INDEX "UpgradeRequest_requestedBy_idx" ON "UpgradeRequest"("requestedBy");

-- AddForeignKey
ALTER TABLE "UpgradeRequest" ADD CONSTRAINT "UpgradeRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeRequest" ADD CONSTRAINT "UpgradeRequest_requestedPlanId_fkey" FOREIGN KEY ("requestedPlanId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeRequest" ADD CONSTRAINT "UpgradeRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
