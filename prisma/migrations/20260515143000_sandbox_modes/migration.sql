ALTER TABLE "FugueRun" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'FUGUE';
ALTER TABLE "FugueRun" ADD COLUMN "description" TEXT;
ALTER TABLE "FugueRun" ADD COLUMN "inputNodesJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "FugueRun" ADD COLUMN "inputActorsJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "FugueRun" ADD COLUMN "inputMechanismsJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "FugueRun" ADD COLUMN "outputsJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "FugueRun" ADD COLUMN "diagnosticsJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "FugueRun" ADD COLUMN "reportMarkdown" TEXT;
ALTER TABLE "FugueRun" ADD COLUMN "archivedAt" DATETIME;
ALTER TABLE "FugueRun" ADD COLUMN "archiveReason" TEXT;

UPDATE "FugueRun"
SET "mode" = 'FUGUE'
WHERE "mode" IS NULL OR "mode" = '';

CREATE INDEX "FugueRun_mode_idx" ON "FugueRun"("mode");
CREATE INDEX "FugueRun_archivedAt_idx" ON "FugueRun"("archivedAt");
