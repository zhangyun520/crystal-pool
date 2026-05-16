import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import packageJson from "../../package.json";
import {
  ethicalInvariants,
  type ConstitutionPackageJson,
} from "@/lib/ethicalKernel";
import { jiProposalLaneKinds } from "@/lib/ji";
import {
  evaluatePhilosophyAestheticsGoal,
  generatePhilosophyAestheticsGoalReport,
  philosophyGapToJiEvent,
  philosophyGapToRfcDraft,
  philosophyGapToSandboxInput,
  type PhilosophyAestheticsGoalAudit,
  type PhilosophyAestheticsGoalEvidence,
} from "@/lib/philosophyAestheticsGoal";
import { sandboxModes } from "@/lib/sandbox";
import { worldlineKeys } from "@/lib/worldline";
import { getConstitutionSnapshot } from "./constitution";
import { prisma } from "./db";
import { getLatestAestheticSmokeSummary } from "./aestheticSmoke";
import { getLatestRepairQueueSummary } from "./repairQueue";
import {
  getCurrentWorldlineCoverageMatrix,
  getLatestWorldlineCoverageSummary,
} from "./worldlineCoverage";
import { writeJiEventToInbox } from "./ji";
import { getLatestNetworkCrystallizationSummary } from "./networkCrystallization";
import { completeSandboxRun, runSandboxProtocol } from "./sandbox";

export const philosophyGoalAuditDir = path.join(
  process.cwd(),
  "data",
  "ecosystem",
  "philosophy-goal-audits",
);

export type PhilosophyGoalAuditRunManifest = {
  runId: string;
  mode: "philosophy_aesthetics_goal_audit";
  generatedAt: string;
  coverageScore: number;
  covered: number;
  partial: number;
  gaps: number;
  criticalOpen: number;
  jiEventsWritten: number;
  sandboxRunsCreated: number;
  canonicalMutationAllowed: false;
};

export type PhilosophyGoalAuditRunResult = {
  runId: string;
  runDir: string;
  manifest: PhilosophyGoalAuditRunManifest;
  audit: PhilosophyAestheticsGoalAudit;
  evidence: PhilosophyAestheticsGoalEvidence;
  reportMarkdown: string;
  jiEventIds: string[];
  sandboxRunIds: string[];
};

async function pathExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(root: string, prefix = root): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const filePath = path.join(root, entry.name);
      if (entry.isDirectory()) return collectFiles(filePath, prefix);
      if (!entry.isFile()) return [];
      return [path.relative(prefix, filePath)];
    }),
  );
  return nested.flat().sort();
}

function appRouteFromFile(filePath: string) {
  const route = filePath
    .replace(/\\/g, "/")
    .replace(/\/page\.tsx$/, "")
    .replace(/\/route\.ts$/, "")
    .replace(/\[[^\]]+\]/g, ":param");
  return route === "page.tsx" || route === "" ? "/" : `/${route}`;
}

async function collectRoutes() {
  const appDir = path.join(process.cwd(), "src", "app");
  const files = await collectFiles(appDir);
  return Array.from(
    new Set(
      files
        .filter((file) => file.endsWith("/page.tsx") || file.endsWith("/route.ts"))
        .map(appRouteFromFile),
    ),
  ).sort();
}

async function readOptional(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

export async function collectPhilosophyAestheticsGoalEvidence(): Promise<
  PhilosophyAestheticsGoalEvidence
> {
  const [
    constitution,
    philosophySummary,
    docs,
    tests,
    routes,
    typedReviewProposals,
    aestheticSmoke,
    repairQueue,
    worldlineCoverage,
    currentWorldlineCoverage,
    responsibilityText,
    ethicalText,
  ] = await Promise.all([
    getConstitutionSnapshot(),
    getLatestNetworkCrystallizationSummary({ domain: "PHILOSOPHY_AESTHETICS" }),
    collectFiles(path.join(process.cwd(), "docs")),
    collectFiles(path.join(process.cwd(), "tests")),
    collectRoutes(),
    prisma.jiEventRecord.count({
      where: { body: { contains: "Proposal kind:" } },
    }),
    getLatestAestheticSmokeSummary(),
    getLatestRepairQueueSummary(),
    getLatestWorldlineCoverageSummary(),
    getCurrentWorldlineCoverageMatrix(),
    readOptional(path.join(process.cwd(), "src", "lib", "responsibilityMaturity.ts")),
    readOptional(path.join(process.cwd(), "src", "lib", "ethicalKernel.ts")),
  ]);
  const scripts = Object.keys(
    (packageJson as ConstitutionPackageJson & { scripts?: Record<string, string> })
      .scripts ?? {},
  );

  return {
    ethicalInvariants: ethicalInvariants.length,
    constitutionStatus: constitution.status,
    hasConstitutionCheckScript: scripts.includes("constitution:check"),
    hasSoulfulDataAssessment: /SoulfulDataAssessment|assessSoulfulData/.test(
      ethicalText,
    ),
    hasResponsibilityMaturity: Boolean(responsibilityText.trim()),
    aiMainlineAutoUnlockDisabled:
      /canAutoUnlock:\s*false/.test(responsibilityText) ||
      /canAutoUnlock\s*=\s*false/.test(responsibilityText),
    sandboxModes,
    worldlineKeys,
    proposalLaneKinds: jiProposalLaneKinds,
    routes,
    docs: docs.map((file) => `docs/${file}`),
    tests: tests.map((file) => `tests/${file}`),
    packageScripts: scripts,
    pendingJiEvents: await prisma.jiEventRecord.count({
      where: { status: "pending" },
    }),
    typedReviewProposals,
    philosophyCandidates: philosophySummary?.manifest?.candidates ?? 0,
    philosophyReviewProposals: philosophySummary?.manifest?.reviewProposals ?? 0,
    philosophySandboxRuns: philosophySummary?.manifest?.sandboxRunsCreated ?? 0,
    hasPhilosophyGapAudit: await pathExists(
      path.join(process.cwd(), "src", "lib", "philosophyAestheticsGoal.ts"),
    ),
    hasAestheticSmokeScript: scripts.includes("ui:aesthetic-smoke"),
    latestAestheticSmokeStatus: aestheticSmoke
      ? aestheticSmoke.manifest.failed === 0
        ? "pass"
        : "fail"
      : "missing",
    latestAestheticSmokeRoutes: Array.from(
      new Set(aestheticSmoke?.checks.map((check) => check.path) ?? []),
    ),
    latestAestheticSmokeScreenshots: aestheticSmoke?.manifest.screenshots ?? 0,
    hasRepairQueueScript: scripts.includes("repair:queue"),
    latestRepairQueueStatus: repairQueue?.manifest.status ?? "missing",
    latestRepairQueueItems: repairQueue?.manifest.items ?? 0,
    latestRepairQueueJiEvents: repairQueue?.manifest.jiEventsWritten ?? 0,
    latestRepairQueueSandboxRuns: repairQueue?.manifest.sandboxRunsCreated ?? 0,
    hasWorldlineCoverageScript: scripts.includes("worldline:coverage"),
    latestWorldlineCoverageStatus:
      worldlineCoverage ? currentWorldlineCoverage.status : "missing",
    latestWorldlineCoveragePercent: currentWorldlineCoverage.coveragePercent,
    latestWorldlineCoverageMissingCells:
      currentWorldlineCoverage.missingCells,
    latestWorldlineCoverageSandboxRuns:
      worldlineCoverage?.manifest.sandboxRunsCreated ?? 0,
  };
}

export async function getPhilosophyAestheticsGoalAudit() {
  const evidence = await collectPhilosophyAestheticsGoalEvidence();
  return {
    evidence,
    audit: evaluatePhilosophyAestheticsGoal({ evidence }),
  };
}

function jsonl(values: unknown[]) {
  return values.map((value) => JSON.stringify(value)).join("\n") + "\n";
}

function runIdFromDate(date = new Date()) {
  return `philosophy-goal-audit-${date.toISOString().replace(/[:.]/g, "-")}`;
}

export async function runPhilosophyAestheticsGoalAudit({
  runId = runIdFromDate(),
  writeJiEvents = true,
  createSandboxes = false,
  maxSandboxRuns = 4,
}: {
  runId?: string;
  writeJiEvents?: boolean;
  createSandboxes?: boolean;
  maxSandboxRuns?: number;
} = {}): Promise<PhilosophyGoalAuditRunResult> {
  const { evidence, audit } = await getPhilosophyAestheticsGoalAudit();
  await mkdir(philosophyGoalAuditDir, { recursive: true });
  const runDir = path.join(philosophyGoalAuditDir, runId);
  await mkdir(runDir, { recursive: true });
  const reportMarkdown = generatePhilosophyAestheticsGoalReport(audit);
  const jiEvents = audit.openItems.map((gap) =>
    philosophyGapToJiEvent({ gap, runId, occurredAt: audit.generatedAt }),
  );
  const sandboxInputs = audit.openItems.map((gap, index) =>
    philosophyGapToSandboxInput(gap, jiEvents[index]?.id),
  );
  const rfcDrafts = audit.openItems.map(philosophyGapToRfcDraft);
  const designProposals = audit.openItems.filter(
    (gap) => gap.proposalKind === "AESTHETIC_SURFACE_PROPOSAL",
  );
  const engineeringTasks = audit.openItems.filter(
    (gap) => gap.proposalKind === "ENGINEERING_TASK_PROPOSAL",
  );

  if (writeJiEvents) {
    for (const event of jiEvents) {
      await writeJiEventToInbox(event, { fileName: "philosophy-goal-audit" });
    }
  }

  const sandboxRunIds: string[] = [];
  if (createSandboxes) {
    for (const input of sandboxInputs.slice(0, maxSandboxRuns)) {
      const run = await runSandboxProtocol(input);
      const completed =
        run.status === "completed" ? run : await completeSandboxRun(run.id, {});
      sandboxRunIds.push(completed.id);
    }
  }

  const manifest: PhilosophyGoalAuditRunManifest = {
    runId,
    mode: "philosophy_aesthetics_goal_audit",
    generatedAt: audit.generatedAt,
    coverageScore: audit.coverageScore,
    covered: audit.covered,
    partial: audit.partial,
    gaps: audit.gaps,
    criticalOpen: audit.criticalOpen,
    jiEventsWritten: writeJiEvents ? jiEvents.length : 0,
    sandboxRunsCreated: sandboxRunIds.length,
    canonicalMutationAllowed: false,
  };

  await Promise.all([
    writeFile(path.join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(runDir, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`),
    writeFile(path.join(runDir, "gap-audit.json"), `${JSON.stringify(audit, null, 2)}\n`),
    writeFile(path.join(runDir, "ji-events.jsonl"), jsonl(jiEvents)),
    writeFile(path.join(runDir, "sandbox-inputs.jsonl"), jsonl(sandboxInputs)),
    writeFile(path.join(runDir, "rfc-drafts.md"), rfcDrafts.join("\n\n---\n\n")),
    writeFile(
      path.join(runDir, "design-proposals.md"),
      designProposals.map(philosophyGapToRfcDraft).join("\n\n---\n\n"),
    ),
    writeFile(
      path.join(runDir, "engineering-tasks.md"),
      engineeringTasks.map(philosophyGapToRfcDraft).join("\n\n---\n\n"),
    ),
    writeFile(path.join(runDir, "sandbox-runs.jsonl"), jsonl(sandboxRunIds.map((id) => ({ id })))),
    writeFile(path.join(runDir, "report.md"), reportMarkdown),
  ]);

  return {
    runId,
    runDir,
    manifest,
    audit,
    evidence,
    reportMarkdown,
    jiEventIds: jiEvents.map((event) => event.id),
    sandboxRunIds,
  };
}
