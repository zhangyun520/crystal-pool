-- CreateTable
CREATE TABLE "Actor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alias" TEXT NOT NULL,
    "publicKey" TEXT,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChainAnchor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fromEventHash" TEXT,
    "toEventHash" TEXT,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "bundleHash" TEXT NOT NULL,
    "bundlePath" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exportedAt" DATETIME,
    "anchoredAt" DATETIME
);

-- CreateTable
CREATE TABLE "ContributionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1,
    "previousHash" TEXT,
    "eventHash" TEXT NOT NULL,
    "anchorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContributionEvent_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "CrystalNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContributionEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContributionEvent_anchorId_fkey" FOREIGN KEY ("anchorId") REFERENCES "ChainAnchor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" REAL NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketOrder_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "CrystalNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MarketOrder_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Actor_alias_key" ON "Actor"("alias");

-- CreateIndex
CREATE INDEX "ContributionEvent_nodeId_idx" ON "ContributionEvent"("nodeId");

-- CreateIndex
CREATE INDEX "ContributionEvent_actorId_idx" ON "ContributionEvent"("actorId");

-- CreateIndex
CREATE INDEX "ContributionEvent_kind_idx" ON "ContributionEvent"("kind");

-- CreateIndex
CREATE INDEX "ContributionEvent_createdAt_idx" ON "ContributionEvent"("createdAt");

-- CreateIndex
CREATE INDEX "ContributionEvent_anchorId_idx" ON "ContributionEvent"("anchorId");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionEvent_eventHash_key" ON "ContributionEvent"("eventHash");

-- CreateIndex
CREATE INDEX "MarketOrder_nodeId_idx" ON "MarketOrder"("nodeId");

-- CreateIndex
CREATE INDEX "MarketOrder_actorId_idx" ON "MarketOrder"("actorId");

-- CreateIndex
CREATE INDEX "MarketOrder_side_idx" ON "MarketOrder"("side");

-- CreateIndex
CREATE INDEX "MarketOrder_status_idx" ON "MarketOrder"("status");

-- CreateIndex
CREATE INDEX "MarketOrder_createdAt_idx" ON "MarketOrder"("createdAt");

-- CreateIndex
CREATE INDEX "ChainAnchor_provider_idx" ON "ChainAnchor"("provider");

-- CreateIndex
CREATE INDEX "ChainAnchor_status_idx" ON "ChainAnchor"("status");

-- CreateIndex
CREATE INDEX "ChainAnchor_createdAt_idx" ON "ChainAnchor"("createdAt");

-- CreateIndex
CREATE INDEX "ChainAnchor_bundleHash_idx" ON "ChainAnchor"("bundleHash");
