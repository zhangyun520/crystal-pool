import { execFile } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  buildEcosystemAutonomyObservations,
  buildEcosystemAutonomyProposals,
  createEcosystemAutonomyManifest,
  generateEcosystemAutonomyReport,
  type EcosystemAutonomyManifest,
  type EcosystemAutonomyObservation,
  type EcosystemAutonomyProposal,
} from "@/lib/ecosystemAutonomy";
import {
  calculateResponsibilityMaturity,
  type ResponsibilityMaturitySnapshot,
} from "@/lib/responsibilityMaturity";
import { cleanOptionalWorldlineKey, worldlineKeys, type WorldlineKey } from "@/lib/worldline";
import { defaultPoolIds } from "@/lib/pools";
import { prisma } from "./db";
import { getEcosystemDashboard, importJiInbox } from "./ji";

const execFileAsync = promisify(execFile);
const ecosystemRunsDir = path.join(process.cwd(), "data", "ecosystem", "runs");

export type EcosystemDaemonRunResult = {
  runId: string;
  runDir: string;
  manifest: EcosystemAutonomyManifest;
  observations: EcosystemAutonomyObservation[];
  proposals: EcosystemAutonomyProposal[];
  reportMarkdown: string;
};

export type EcosystemDaemonLatestSummary = {
  runId: string;
  runDir: string;
  manifest?: EcosystemAutonomyManifest;
  observations: EcosystemAutonomyObservation[];
  proposals: EcosystemAutonomyProposal[];
  reportMarkdown?: string;
};

function runIdFromDate(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function jsonl<T>(items: T[]) {
  return items.map((item) => JSON.stringify(item)).join("\n") + (items.length ? "\n" : "");
}

function parseJsonl<T>(text: string): T[] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as T);
}

async function safeReadText(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

async function git(args: string[]) {
  const { stdout } = await execFileAsync("git", args, {
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

async function getRepoState() {
  try {
    const [root, branch, status, remote] = await Promise.all([
      git(["rev-parse", "--show-toplevel"]),
      git(["branch", "--show-current"]),
      git(["status", "--short"]),
      git(["remote", "-v"]).catch(() => ""),
    ]);
    return {
      root,
      branch,
      dirtyFiles: status ? status.split(/\r?\n/).filter(Boolean).length : 0,
      hasRemote: Boolean(remote.trim()),
    };
  } catch (error) {
    return {
      dirtyFiles: 0,
      hasRemote: false,
      error: error instanceof Error ? error.message : "Unable to read git state.",
    };
  }
}

function parseWorldlineFromConfig(configJson: string): WorldlineKey | undefined {
  try {
    const parsed = JSON.parse(configJson) as { worldlineKey?: unknown };
    return cleanOptionalWorldlineKey(parsed.worldlineKey);
  } catch {
    return undefined;
  }
}

async function getSandboxWorldlineCoverage() {
  const runs = await prisma.fugueRun.findMany({
    where: { poolId: defaultPoolIds.fugue },
    select: { status: true, configJson: true },
  });
  const byWorldline: Partial<Record<WorldlineKey, number>> = Object.fromEntries(
    worldlineKeys.map((key) => [key, 0]),
  );
  for (const run of runs) {
    const key = parseWorldlineFromConfig(run.configJson);
    if (!key) continue;
    byWorldline[key] = (byWorldline[key] ?? 0) + 1;
  }
  return {
    runs: runs.length,
    completedRuns: runs.filter((run) => run.status === "completed").length,
    byWorldline,
  };
}

export async function getResponsibilityMaturitySnapshot(): Promise<ResponsibilityMaturitySnapshot> {
  const [
    totalDecisions,
    traceableDecisions,
    reversibleDecisions,
    invalidOrFailedDecisions,
    suggestionGroups,
    completedSandboxRuns,
    sandboxedAiRuns,
    recentPhaseEvents,
  ] = await Promise.all([
    prisma.aIDecision.count({ where: { poolId: defaultPoolIds.ai } }),
    prisma.aIDecision.count({
      where: { poolId: defaultPoolIds.ai, payloadJson: { not: "" } },
    }),
    prisma.aIDecision.count({
      where: {
        poolId: defaultPoolIds.ai,
        status: { in: ["proposed", "invalid", "failed"] },
      },
    }),
    prisma.aIDecision.count({
      where: {
        poolId: defaultPoolIds.ai,
        status: { in: ["invalid", "failed"] },
      },
    }),
    prisma.humanSuggestion.groupBy({
      by: ["status"],
      where: { poolId: defaultPoolIds.ai },
      _count: { status: true },
    }),
    prisma.fugueRun.count({
      where: { poolId: defaultPoolIds.fugue, status: "completed" },
    }),
    prisma.fugueRun.count({
      where: {
        poolId: defaultPoolIds.fugue,
        configJson: { contains: "AI_DIRECTED_WORLD" },
      },
    }),
    prisma.phaseEvent.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        },
      },
    }),
  ]);
  const suggestionCount = (status: string) =>
    suggestionGroups.find((group) => group.status === status)?._count.status ?? 0;

  return calculateResponsibilityMaturity({
    totalDecisions,
    traceableDecisions,
    reversibleDecisions,
    invalidOrFailedDecisions,
    reviewedSuggestions:
      suggestionCount("reviewed") +
      suggestionCount("accepted") +
      suggestionCount("rejected"),
    openSuggestions: suggestionCount("open"),
    completedSandboxRuns,
    sandboxedAiRuns,
    repairSignals: Math.min(recentPhaseEvents, 6),
    nonSovereignBoundaries: 3,
  });
}

export async function runEcosystemAutonomyCycle({
  runId = runIdFromDate(),
  maxProposals = 8,
}: {
  runId?: string;
  maxProposals?: number;
} = {}): Promise<EcosystemDaemonRunResult> {
  await mkdir(ecosystemRunsDir, { recursive: true });
  const runDir = path.join(ecosystemRunsDir, runId);
  await mkdir(runDir, { recursive: true });

  const importResult = await importJiInbox();
  const [
    dashboard,
    sandbox,
    maturity,
    repo,
    anchorPending,
    anchorExported,
  ] = await Promise.all([
    getEcosystemDashboard(),
    getSandboxWorldlineCoverage(),
    getResponsibilityMaturitySnapshot(),
    getRepoState(),
    prisma.chainAnchor.count({ where: { status: "pending" } }),
    prisma.chainAnchor.count({ where: { status: "exported" } }),
  ]);
  const now = new Date().toISOString();
  const context = {
    runId,
    now,
    pendingJiEvents: dashboard.totals.pending,
    inboxErrors: dashboard.inbox.errors,
    importedJiEvents: importResult.importedEvents,
    sandboxRuns: sandbox.runs,
    completedSandboxRuns: sandbox.completedRuns,
    sandboxByWorldline: sandbox.byWorldline,
    anchorPending,
    anchorExported,
    repo,
    maturity,
  };
  const observations = buildEcosystemAutonomyObservations(context);
  const proposals = buildEcosystemAutonomyProposals(context, { maxProposals });
  const manifest = createEcosystemAutonomyManifest({
    context,
    observations,
    proposals,
  });
  const reportMarkdown = generateEcosystemAutonomyReport({
    context,
    observations,
    proposals,
  });

  await Promise.all([
    writeFile(path.join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(runDir, "observations.jsonl"), jsonl(observations)),
    writeFile(path.join(runDir, "proposals.jsonl"), jsonl(proposals)),
    writeFile(path.join(runDir, "report.md"), reportMarkdown),
  ]);

  return { runId, runDir, manifest, observations, proposals, reportMarkdown };
}

export async function getLatestEcosystemRunSummary(): Promise<
  EcosystemDaemonLatestSummary | undefined
> {
  try {
    const entries = await readdir(ecosystemRunsDir, { withFileTypes: true });
    const runId = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
      .reverse()[0];
    if (!runId) return undefined;
    const runDir = path.join(ecosystemRunsDir, runId);
    const [manifestText, observationsText, proposalsText, reportMarkdown] =
      await Promise.all([
        safeReadText(path.join(runDir, "manifest.json")),
        safeReadText(path.join(runDir, "observations.jsonl")),
        safeReadText(path.join(runDir, "proposals.jsonl")),
        safeReadText(path.join(runDir, "report.md")),
      ]);

    return {
      runId,
      runDir,
      manifest: manifestText
        ? (JSON.parse(manifestText) as EcosystemAutonomyManifest)
        : undefined,
      observations: observationsText
        ? parseJsonl<EcosystemAutonomyObservation>(observationsText)
        : [],
      proposals: proposalsText
        ? parseJsonl<EcosystemAutonomyProposal>(proposalsText)
        : [],
      reportMarkdown,
    };
  } catch {
    return undefined;
  }
}
