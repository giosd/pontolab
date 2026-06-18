-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "TimeEntry" ADD COLUMN "submittedAt" DATETIME;
ALTER TABLE "TimeEntry" ADD COLUMN "submittedById" TEXT;
ALTER TABLE "TimeEntry" ADD COLUMN "approvedAt" DATETIME;
ALTER TABLE "TimeEntry" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "TimeEntry" ADD COLUMN "rejectedAt" DATETIME;
ALTER TABLE "TimeEntry" ADD COLUMN "rejectedById" TEXT;
ALTER TABLE "TimeEntry" ADD COLUMN "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "TimeEntry_status_idx" ON "TimeEntry"("status");

-- CreateIndex
CREATE INDEX "TimeEntry_submittedAt_idx" ON "TimeEntry"("submittedAt");

-- CreateIndex
CREATE INDEX "TimeEntry_approvedAt_idx" ON "TimeEntry"("approvedAt");
