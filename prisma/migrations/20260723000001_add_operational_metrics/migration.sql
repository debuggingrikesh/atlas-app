-- CreateTable
CREATE TABLE "OperationalMetric" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "dimension" TEXT NOT NULL DEFAULT 'default',
    "bucketStartedAt" TIMESTAMP(3) NOT NULL,
    "bucketDurationMinutes" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "sum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "min" DOUBLE PRECISION,
    "max" DOUBLE PRECISION,
    "p50" DOUBLE PRECISION,
    "p95" DOUBLE PRECISION,
    "p99" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperationalMetric_service_metric_bucketStartedAt_idx" ON "OperationalMetric"("service", "metric", "bucketStartedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalMetric_service_environment_metric_dimension_buck_key" ON "OperationalMetric"("service", "environment", "metric", "dimension", "bucketStartedAt", "bucketDurationMinutes");

