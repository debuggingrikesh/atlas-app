-- Drop the existing table entirely
DROP TABLE IF EXISTS "AuditLog";

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'USER',
    "actorUserId" TEXT,
    "actorRole" TEXT,
    "businessId" TEXT,
    "tenantId" TEXT,
    "requestId" TEXT,
    "sourceService" TEXT NOT NULL DEFAULT 'atlas-app',
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "previousState" JSONB,
    "newState" JSONB,
    "ipAddressHash" TEXT,
    "userAgentSummary" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_action_resourceType_idx" ON "AuditLog"("action", "resourceType");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_businessId_idx" ON "AuditLog"("businessId");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");
