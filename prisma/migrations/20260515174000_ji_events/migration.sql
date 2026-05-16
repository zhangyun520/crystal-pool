CREATE TABLE "JiEventRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceProject" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "refsJson" TEXT NOT NULL DEFAULT '[]',
    "suggestedPhase" TEXT,
    "ha" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewAction" TEXT,
    "reviewNote" TEXT,
    "importedNodeId" TEXT,
    "sandboxRunId" TEXT,
    "rfcDraft" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME
);

CREATE INDEX "JiEventRecord_sourceProject_idx" ON "JiEventRecord"("sourceProject");
CREATE INDEX "JiEventRecord_kind_idx" ON "JiEventRecord"("kind");
CREATE INDEX "JiEventRecord_status_idx" ON "JiEventRecord"("status");
CREATE INDEX "JiEventRecord_occurredAt_idx" ON "JiEventRecord"("occurredAt");
CREATE INDEX "JiEventRecord_createdAt_idx" ON "JiEventRecord"("createdAt");
CREATE INDEX "JiEventRecord_importedNodeId_idx" ON "JiEventRecord"("importedNodeId");
CREATE INDEX "JiEventRecord_sandboxRunId_idx" ON "JiEventRecord"("sandboxRunId");

-- SQLite stores Prisma enum values as TEXT, so adding SourceType.ecosystem
-- does not require a destructive table rewrite.
