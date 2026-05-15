-- CreateTable
CREATE TABLE "CrystalNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CrystalEdge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrystalEdge_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "CrystalNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CrystalEdge_toId_fkey" FOREIGN KEY ("toId") REFERENCES "CrystalNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NodeTag" (
    "nodeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("nodeId", "tagId"),
    CONSTRAINT "NodeTag_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "CrystalNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NodeTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhaseEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "fromPhase" TEXT,
    "toPhase" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhaseEvent_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "CrystalNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CrystalNode_phase_idx" ON "CrystalNode"("phase");

-- CreateIndex
CREATE INDEX "CrystalNode_crystallizationScore_idx" ON "CrystalNode"("crystallizationScore");

-- CreateIndex
CREATE INDEX "CrystalNode_createdAt_idx" ON "CrystalNode"("createdAt");

-- CreateIndex
CREATE INDEX "CrystalEdge_fromId_idx" ON "CrystalEdge"("fromId");

-- CreateIndex
CREATE INDEX "CrystalEdge_toId_idx" ON "CrystalEdge"("toId");

-- CreateIndex
CREATE INDEX "CrystalEdge_relation_idx" ON "CrystalEdge"("relation");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "PhaseEvent_nodeId_idx" ON "PhaseEvent"("nodeId");

-- CreateIndex
CREATE INDEX "PhaseEvent_toPhase_idx" ON "PhaseEvent"("toPhase");

-- CreateIndex
CREATE INDEX "PhaseEvent_createdAt_idx" ON "PhaseEvent"("createdAt");
