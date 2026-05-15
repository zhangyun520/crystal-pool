import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./db";
import { getMarketOverview } from "./market";
import { getJiInboxSnapshot } from "./ji";
import {
  getLatestEcosystemRunSummary,
  getResponsibilityMaturitySnapshot,
} from "./ecosystemDaemon";
import { defaultPoolIds } from "@/lib/pools";
import { sandboxModes } from "@/lib/sandbox";
import { phases, type EdgeRelation, type Phase } from "@/lib/domain";
import {
  createObservationSignals,
  summarizeObservedRuns,
  type ObservedCorpusRun,
  type ObservationPoolHealth,
} from "@/lib/observation";
import { corpusRunArtifactNames } from "@/lib/corpusRun";
import {
  parseJsonl,
  type CrystalJobManifest,
  type CrystalWorkerResult,
} from "@/lib/jobManifest";
import { type CorpusTrailBundle } from "@/lib/corpusTrail";

const corpusDir = path.join(process.cwd(), "data", "corpus");
const inboxDir = path.join(corpusDir, "inbox");
const runsDir = path.join(corpusDir, "runs");
const processedDir = path.join(corpusDir, "processed");

async function safeReaddir(dir: string) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function safeReadText(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

async function countJsonlItems(filePath: string) {
  const text = await safeReadText(filePath);
  if (!text) return { items: 0, error: true };
  try {
    return { items: parseJsonl(text).length, error: false };
  } catch {
    return { items: 0, error: true };
  }
}

async function getInboxSnapshot() {
  const entries = await safeReaddir(inboxDir);
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
    .map((entry) => path.join(inboxDir, entry.name));
  const counts = await Promise.all(files.map(countJsonlItems));
  const sizes = await Promise.all(
    files.map(async (file) => {
      try {
        return (await stat(file)).size;
      } catch {
        return 0;
      }
    }),
  );

  return {
    files: files.length,
    items: counts.reduce((sum, count) => sum + count.items, 0),
    bytes: sizes.reduce((sum, size) => sum + size, 0),
    errors: counts.filter((count) => count.error).length,
  };
}

async function countProcessedFiles() {
  const runDirs = await safeReaddir(processedDir);
  const counts = await Promise.all(
    runDirs
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const files = await safeReaddir(path.join(processedDir, entry.name));
        return files.filter((file) => file.isFile() && file.name.endsWith(".jsonl"))
          .length;
      }),
  );
  return counts.reduce((sum, count) => sum + count, 0);
}

function parseJson<T>(text?: string): T | undefined {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

async function readRun(runId: string): Promise<ObservedCorpusRun | undefined> {
  const runDir = path.join(runsDir, runId);
  const [manifestText, workerText, trailText] = await Promise.all([
    safeReadText(path.join(runDir, corpusRunArtifactNames.manifest)),
    safeReadText(path.join(runDir, corpusRunArtifactNames.workerResults)),
    safeReadText(path.join(runDir, corpusRunArtifactNames.trailBundle)),
  ]);
  const manifest = parseJson<CrystalJobManifest>(manifestText);
  const trail = parseJson<CorpusTrailBundle>(trailText);
  let results: CrystalWorkerResult[] = [];
  try {
    results = workerText ? parseJsonl<CrystalWorkerResult>(workerText) : [];
  } catch {
    results = [];
  }
  const marks = results.flatMap((result) => result.marks);
  const warnings = results.reduce(
    (sum, result) => sum + result.warnings.length,
    0,
  );

  if (!manifest && !trail && results.length === 0) return undefined;

  return {
    runId,
    createdAt: manifest?.createdAt ?? trail?.createdAt ?? runId,
    workerTarget: manifest?.workerTarget ?? "unknown",
    inputItems: results.length,
    marks: marks.length,
    trajectoryEvents: trail?.trajectoryEvents.length ?? 0,
    warnings,
    highHa: marks.filter((mark) => mark.emotionHa >= 6).length,
    duplicates: marks.filter((mark) =>
      mark.matches.some((match) => match.kind === "duplicate"),
    ).length,
    notableMarks: marks.slice(0, 5).map((mark) => ({
      title: mark.title,
      phase: mark.phase as Phase,
      relation: mark.suggestedRelation as EdgeRelation,
      emotionHa: mark.emotionHa,
    })),
  };
}

async function getRecentRuns(limit = 8) {
  const entries = await safeReaddir(runsDir);
  const runIds = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse()
    .slice(0, limit);
  const runs = await Promise.all(runIds.map(readRun));
  return runs.filter((run): run is ObservedCorpusRun => Boolean(run));
}

async function getPoolHealth(): Promise<ObservationPoolHealth> {
  const [
    activeNodes,
    archivedNodes,
    edges,
    phaseGroups,
    lowHaCrystals,
    recentPhaseEvents,
    nodesForIsolation,
  ] = await Promise.all([
    prisma.crystalNode.count({ where: { archivedAt: null } }),
    prisma.crystalNode.count({ where: { archivedAt: { not: null } } }),
    prisma.crystalEdge.count({
      where: { from: { archivedAt: null }, to: { archivedAt: null } },
    }),
    prisma.crystalNode.groupBy({
      where: { archivedAt: null },
      by: ["phase"],
      _count: { phase: true },
    }),
    prisma.crystalNode.count({
      where: {
        archivedAt: null,
        phase: "crystal",
        emotionHa: { lt: 3 },
      },
    }),
    prisma.phaseEvent.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        },
      },
    }),
    prisma.crystalNode.findMany({
      where: { archivedAt: null },
      select: {
        id: true,
        incomingEdges: { select: { id: true } },
        outgoingEdges: { select: { id: true } },
      },
    }),
  ]);
  const phaseCounts = Object.fromEntries(
    phases.map((phase) => [
      phase,
      phaseGroups.find((group) => group.phase === phase)?._count.phase ?? 0,
    ]),
  ) as Record<Phase, number>;

  return {
    activeNodes,
    archivedNodes,
    edges,
    phaseCounts,
    lowHaCrystals,
    isolatedNodes: nodesForIsolation.filter(
      (node) => node.incomingEdges.length + node.outgoingEdges.length === 0,
    ).length,
    recentPhaseEvents,
  };
}

export async function getObservationPoolSnapshot() {
  const [
    inbox,
    processedFiles,
    runs,
    pool,
    market,
    aiCycles,
    aiFailedCycles,
    aiNodes,
    aiCycleGroups,
    aiSuggestionGroups,
    aiInvalidDecisions,
    fugueRuns,
    fugueLearnings,
    sandboxModeGroups,
    sandboxStatusGroups,
    ecosystemInbox,
    jiEvents,
    jiStatusGroups,
    latestEcosystemRun,
    responsibilityMaturity,
  ] = await Promise.all([
    getInboxSnapshot(),
    countProcessedFiles(),
    getRecentRuns(),
    getPoolHealth(),
    getMarketOverview(),
    prisma.aIDirectorCycle.count({ where: { poolId: defaultPoolIds.ai } }),
    prisma.aIDirectorCycle.count({
      where: { poolId: defaultPoolIds.ai, status: { in: ["failed", "skipped"] } },
    }),
    prisma.crystalNode.count({
      where: { poolId: defaultPoolIds.ai, archivedAt: null },
    }),
    prisma.aIDirectorCycle.groupBy({
      by: ["status"],
      where: { poolId: defaultPoolIds.ai },
      _count: { status: true },
    }),
    prisma.humanSuggestion.groupBy({
      by: ["status"],
      where: { poolId: defaultPoolIds.ai },
      _count: { status: true },
    }),
    prisma.aIDecision.count({
      where: {
        poolId: defaultPoolIds.ai,
        status: { in: ["invalid", "failed"] },
      },
    }),
    prisma.fugueRun.count({ where: { poolId: defaultPoolIds.fugue } }),
    prisma.fugueLearningProposal.count({ where: { status: "proposed" } }),
    prisma.fugueRun.groupBy({
      by: ["mode"],
      where: { poolId: defaultPoolIds.fugue },
      _count: { mode: true },
    }),
    prisma.fugueRun.groupBy({
      by: ["status"],
      where: { poolId: defaultPoolIds.fugue },
      _count: { status: true },
    }),
    getJiInboxSnapshot(),
    prisma.jiEventRecord.count(),
    prisma.jiEventRecord.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    getLatestEcosystemRunSummary(),
    getResponsibilityMaturitySnapshot(),
  ]);
  const runSummary = summarizeObservedRuns(runs);
  const signals = createObservationSignals({
    inboxFiles: inbox.files,
    inboxItems: inbox.items,
    processedFiles,
    runs,
    pool,
  });
  const sandbox = {
    runs: fugueRuns,
    proposedLearnings: fugueLearnings,
    byMode: Object.fromEntries(
      sandboxModes.map((mode) => [
        mode,
        sandboxModeGroups.find((group) => group.mode === mode)?._count.mode ?? 0,
      ]),
    ),
    completedRuns: sandboxStatusGroups
      .filter((group) => group.status === "completed")
      .reduce((sum, group) => sum + group._count.status, 0),
    archivedRuns: sandboxStatusGroups
      .filter((group) => group.status === "archived")
      .reduce((sum, group) => sum + group._count.status, 0),
  };
  const ecosystemStatuses = ["pending", "imported", "sandboxed", "rfc_drafted", "dismissed"];
  const ecosystem = {
    inbox: ecosystemInbox,
    events: jiEvents,
    byStatus: Object.fromEntries(
      ecosystemStatuses.map((status) => [
        status,
        jiStatusGroups.find((group) => group.status === status)?._count.status ?? 0,
      ]),
    ),
    pending: jiStatusGroups
      .filter((group) => group.status === "pending")
      .reduce((sum, group) => sum + group._count.status, 0),
  };

  return {
    generatedAt: new Date().toISOString(),
    inbox,
    processedFiles,
    runs,
    runSummary,
    pool,
    market,
    ai: {
      hasApiKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
      cycles: aiCycles,
      failedOrSkippedCycles: aiFailedCycles,
      nodes: aiNodes,
      invalidDecisions: aiInvalidDecisions,
      maturity: responsibilityMaturity,
      cyclesByStatus: Object.fromEntries(
        ["pending", "skipped", "completed", "failed"].map((status) => [
          status,
          aiCycleGroups.find((group) => group.status === status)?._count.status ?? 0,
        ]),
      ),
      suggestionsByStatus: Object.fromEntries(
        ["open", "reviewed", "accepted", "rejected"].map((status) => [
          status,
          aiSuggestionGroups.find((group) => group.status === status)?._count.status ?? 0,
        ]),
      ),
    },
    sandbox,
    fugue: sandbox,
    ecosystem,
    ecosystemDaemon: {
      latestRunId: latestEcosystemRun?.runId,
      observations: latestEcosystemRun?.observations.length ?? 0,
      proposals: latestEcosystemRun?.proposals.length ?? 0,
      hasReport: Boolean(latestEcosystemRun?.reportMarkdown),
    },
    signals,
  };
}
