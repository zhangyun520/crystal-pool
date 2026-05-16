ALTER TABLE "ChainAnchor" ADD COLUMN "externalProvider" TEXT;
ALTER TABLE "ChainAnchor" ADD COLUMN "externalRef" TEXT;
ALTER TABLE "ChainAnchor" ADD COLUMN "externalRecordedAt" DATETIME;
ALTER TABLE "ChainAnchor" ADD COLUMN "externalNote" TEXT;

CREATE INDEX "ChainAnchor_externalProvider_idx" ON "ChainAnchor"("externalProvider");
CREATE INDEX "ChainAnchor_externalRecordedAt_idx" ON "ChainAnchor"("externalRecordedAt");
