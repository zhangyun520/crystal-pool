-- AlterTable
ALTER TABLE "CrystalNode" ADD COLUMN "archivedAt" DATETIME;
ALTER TABLE "CrystalNode" ADD COLUMN "archiveReason" TEXT;

-- CreateIndex
CREATE INDEX "CrystalNode_archivedAt_idx" ON "CrystalNode"("archivedAt");
