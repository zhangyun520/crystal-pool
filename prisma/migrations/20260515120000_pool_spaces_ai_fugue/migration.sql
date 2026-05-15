-- CreateTable
CREATE TABLE "PoolSpace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default pool spaces before existing nodes receive their poolId foreign key.
INSERT INTO "PoolSpace" ("id", "slug", "name", "description", "kind", "status", "createdAt", "updatedAt") VALUES
('pool_canonical', 'canonical', 'Canonical Pool', 'Human-operated meaning crystallization pool.', 'canonical', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pool_ai_directed', 'ai', 'AI-Directed Pool', 'OpenAI director owns mutations; humans observe and suggest.', 'ai_directed', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pool_fugue', 'fugue', 'Crystal Fugue', 'Counterpoint sandbox for educational pressure tests.', 'fugue', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Rebuild CrystalNode to add the non-null pool foreign key in SQLite.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_CrystalNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL DEFAULT 'pool_canonical',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'gas',
    "crystallizationScore" REAL NOT NULL DEFAULT 0,
    "entropyResistance" REAL NOT NULL DEFAULT 0,
    "publicness" REAL NOT NULL DEFAULT 0,
    "privateIntensity" REAL NOT NULL DEFAULT 0,
    "emotionFear" REAL NOT NULL DEFAULT 0,
    "emotionCuriosity" REAL NOT NULL DEFAULT 0,
    "emotionJoy" REAL NOT NULL DEFAULT 0,
    "emotionBoredom" REAL NOT NULL DEFAULT 0,
    "emotionHa" REAL NOT NULL DEFAULT 0,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "sourceRef" TEXT,
    "archivedAt" DATETIME,
    "archiveReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrystalNode_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PoolSpace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_CrystalNode" (
    "id",
    "poolId",
    "title",
    "body",
    "phase",
    "crystallizationScore",
    "entropyResistance",
    "publicness",
    "privateIntensity",
    "emotionFear",
    "emotionCuriosity",
    "emotionJoy",
    "emotionBoredom",
    "emotionHa",
    "sourceType",
    "sourceRef",
    "archivedAt",
    "archiveReason",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    'pool_canonical',
    "title",
    "body",
    "phase",
    "crystallizationScore",
    "entropyResistance",
    "publicness",
    "privateIntensity",
    "emotionFear",
    "emotionCuriosity",
    "emotionJoy",
    "emotionBoredom",
    "emotionHa",
    "sourceType",
    "sourceRef",
    "archivedAt",
    "archiveReason",
    "createdAt",
    "updatedAt"
FROM "CrystalNode";

DROP TABLE "CrystalNode";
ALTER TABLE "new_CrystalNode" RENAME TO "CrystalNode";

CREATE INDEX "CrystalNode_phase_idx" ON "CrystalNode"("phase");
CREATE INDEX "CrystalNode_crystallizationScore_idx" ON "CrystalNode"("crystallizationScore");
CREATE INDEX "CrystalNode_createdAt_idx" ON "CrystalNode"("createdAt");
CREATE INDEX "CrystalNode_archivedAt_idx" ON "CrystalNode"("archivedAt");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- AlterTable
ALTER TABLE "Actor" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'human';
ALTER TABLE "Actor" ADD COLUMN "modelName" TEXT;

-- CreateTable
CREATE TABLE "AIDirectorCycle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "inputDigest" TEXT NOT NULL,
    "openaiResponseId" TEXT,
    "outputJson" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "AIDirectorCycle_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PoolSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "targetNodeId" TEXT,
    "title" TEXT,
    "body" TEXT,
    "phase" TEXT,
    "relation" TEXT,
    "weight" REAL,
    "rationale" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" DATETIME,
    CONSTRAINT "AIDecision_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AIDirectorCycle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIDecision_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PoolSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIDecision_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "CrystalNode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HumanSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    CONSTRAINT "HumanSuggestion_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PoolSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HumanSuggestion_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FugueRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "scenarioKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "timeScale" INTEGER NOT NULL DEFAULT 60,
    "currentTick" INTEGER NOT NULL DEFAULT 0,
    "configJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FugueRun_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PoolSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FugueEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "tick" INTEGER NOT NULL,
    "actorLabel" TEXT,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FugueEvent_runId_fkey" FOREIGN KEY ("runId") REFERENCES "FugueRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FugueLearningProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "importedNodeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    CONSTRAINT "FugueLearningProposal_runId_fkey" FOREIGN KEY ("runId") REFERENCES "FugueRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FugueLearningProposal_importedNodeId_fkey" FOREIGN KEY ("importedNodeId") REFERENCES "CrystalNode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PoolSpace_slug_key" ON "PoolSpace"("slug");
CREATE INDEX "PoolSpace_kind_idx" ON "PoolSpace"("kind");
CREATE INDEX "PoolSpace_status_idx" ON "PoolSpace"("status");
CREATE INDEX "CrystalNode_poolId_idx" ON "CrystalNode"("poolId");
CREATE INDEX "Actor_kind_idx" ON "Actor"("kind");
CREATE INDEX "AIDirectorCycle_poolId_idx" ON "AIDirectorCycle"("poolId");
CREATE INDEX "AIDirectorCycle_status_idx" ON "AIDirectorCycle"("status");
CREATE INDEX "AIDirectorCycle_createdAt_idx" ON "AIDirectorCycle"("createdAt");
CREATE INDEX "AIDecision_cycleId_idx" ON "AIDecision"("cycleId");
CREATE INDEX "AIDecision_poolId_idx" ON "AIDecision"("poolId");
CREATE INDEX "AIDecision_kind_idx" ON "AIDecision"("kind");
CREATE INDEX "AIDecision_status_idx" ON "AIDecision"("status");
CREATE INDEX "AIDecision_createdAt_idx" ON "AIDecision"("createdAt");
CREATE INDEX "HumanSuggestion_poolId_idx" ON "HumanSuggestion"("poolId");
CREATE INDEX "HumanSuggestion_actorId_idx" ON "HumanSuggestion"("actorId");
CREATE INDEX "HumanSuggestion_status_idx" ON "HumanSuggestion"("status");
CREATE INDEX "HumanSuggestion_createdAt_idx" ON "HumanSuggestion"("createdAt");
CREATE INDEX "FugueRun_poolId_idx" ON "FugueRun"("poolId");
CREATE INDEX "FugueRun_scenarioKey_idx" ON "FugueRun"("scenarioKey");
CREATE INDEX "FugueRun_status_idx" ON "FugueRun"("status");
CREATE INDEX "FugueRun_createdAt_idx" ON "FugueRun"("createdAt");
CREATE INDEX "FugueEvent_runId_idx" ON "FugueEvent"("runId");
CREATE INDEX "FugueEvent_kind_idx" ON "FugueEvent"("kind");
CREATE INDEX "FugueEvent_tick_idx" ON "FugueEvent"("tick");
CREATE INDEX "FugueEvent_createdAt_idx" ON "FugueEvent"("createdAt");
CREATE INDEX "FugueLearningProposal_runId_idx" ON "FugueLearningProposal"("runId");
CREATE INDEX "FugueLearningProposal_status_idx" ON "FugueLearningProposal"("status");
CREATE INDEX "FugueLearningProposal_createdAt_idx" ON "FugueLearningProposal"("createdAt");
