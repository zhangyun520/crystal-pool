import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createLongGoalEvidenceManifest,
  generateLongGoalEvidenceReport,
  longGoalObjective,
  type LongGoalEvidenceBundle,
  type LongGoalEvidenceItem,
  type LongGoalEvidenceManifest,
  type LongGoalEvidenceRunSummary,
} from "@/lib/longGoalEvidence";
import { getConstitutionSnapshot } from "./constitution";
import { getLatestAestheticSmokeSummary } from "./aestheticSmoke";
import { getLatestRepairQueueSummary } from "./repairQueue";
import {
  getCurrentWorldlineCoverageMatrix,
  getLatestWorldlineCoverageSummary,
} from "./worldlineCoverage";
import { getLatestForkCompatibilitySummary } from "./forkCompatibility";
import { getPhilosophyAestheticsGoalAudit } from "./philosophyAestheticsGoal";

export const longGoalEvidenceRunsDir = path.join(
  process.cwd(),
  "data",
  "ecosystem",
  "long-goal-evidence",
);

export type LongGoalEvidenceRunResult = LongGoalEvidenceRunSummary & {
  runId: string;
  runDir: string;
};

async function safeReadText(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

function parseJson<T>(text?: string): T | undefined {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

function runIdFromDate(date = new Date()) {
  return `long-goal-evidence-${date.toISOString().replace(/[:.]/g, "-")}`;
}

function passWarnFail(condition: boolean, warning = false) {
  if (condition) return "pass" as const;
  return warning ? "warn" as const : "fail" as const;
}

export async function collectLongGoalEvidenceBundle(
  generatedAt = new Date().toISOString(),
): Promise<LongGoalEvidenceBundle> {
  const [
    philosophyGoal,
    constitution,
    aestheticSmoke,
    repairQueue,
    currentWorldlineCoverage,
    latestWorldlineCoverage,
    forkCompatibility,
  ] = await Promise.all([
    getPhilosophyAestheticsGoalAudit(),
    getConstitutionSnapshot(),
    getLatestAestheticSmokeSummary(),
    getLatestRepairQueueSummary(),
    getCurrentWorldlineCoverageMatrix(),
    getLatestWorldlineCoverageSummary(),
    getLatestForkCompatibilitySummary(),
  ]);

  const items: LongGoalEvidenceItem[] = [
    {
      id: "LG-EV-001",
      title: "Philosophy / aesthetics goal compass",
      status: passWarnFail(philosophyGoal.audit.coverageScore === 100),
      proof: `${philosophyGoal.audit.covered}/${philosophyGoal.audit.requirements.length} requirements covered; openItems=${philosophyGoal.audit.openItems.length}; criticalOpen=${philosophyGoal.audit.criticalOpen}.`,
      command: "npm run philosophy:gap-audit -- --dry-run",
      artifact: "data/ecosystem/philosophy-goal-audits/<run-id>/report.md",
      boundary: "The audit may create review proposals in non-dry-run mode, but it cannot promote canonical state.",
    },
    {
      id: "LG-EV-002",
      title: "Ethical kernel and constitution",
      status: passWarnFail(constitution.status === "pass"),
      proof: `constitutionStatus=${constitution.status}; pass=${constitution.summary.pass}; warn=${constitution.summary.warn}; fail=${constitution.summary.fail}.`,
      command: "npm run constitution:check",
      artifact: "console markdown report",
      boundary: "The constitution check is local guardrail evidence only.",
    },
    {
      id: "LG-EV-003",
      title: "Worldline sandbox coverage",
      status: passWarnFail(
        currentWorldlineCoverage.status === "pass" &&
          currentWorldlineCoverage.missingCells === 0,
      ),
      proof: `currentCoverage=${currentWorldlineCoverage.coveragePercent}%; missingCells=${currentWorldlineCoverage.missingCells}; latestRun=${latestWorldlineCoverage?.manifest.runId ?? "missing"}.`,
      command: "npm run worldline:coverage",
      artifact: "data/ecosystem/worldline-coverage/<run-id>/matrix.json",
      boundary: "The matrix proves sandbox rehearsal coverage only; sandbox learning remains review-gated.",
    },
    {
      id: "LG-EV-004",
      title: "Hopepunk repair queue",
      status: passWarnFail(Boolean(repairQueue), true),
      proof: repairQueue
        ? `repairStatus=${repairQueue.manifest.status}; items=${repairQueue.manifest.items}; jiEventsWritten=${repairQueue.manifest.jiEventsWritten}; sandboxRunsCreated=${repairQueue.manifest.sandboxRunsCreated}.`
        : "No repair queue run artifact found yet.",
      command: "npm run repair:queue",
      artifact: "data/ecosystem/repair-queue/<run-id>/report.md",
      boundary: "Repair proposals are observe + propose only; they cannot mutate canonical state.",
    },
    {
      id: "LG-EV-005",
      title: "Fork compatibility boundary",
      status: passWarnFail(
        Boolean(forkCompatibility) &&
          forkCompatibility?.manifest.status === "pass" &&
          forkCompatibility.manifest.fail === 0,
      ),
      proof: forkCompatibility
        ? `forkStatus=${forkCompatibility.manifest.status}; badge=${forkCompatibility.manifest.compatibilityBadge}; pass=${forkCompatibility.manifest.pass}; fail=${forkCompatibility.manifest.fail}.`
        : "No fork compatibility run artifact found yet.",
      command: "npm run fork:compatibility",
      artifact: "data/ecosystem/fork-compatibility/<run-id>/report.md",
      boundary: "Compatibility evidence does not certify external forks automatically.",
    },
    {
      id: "LG-EV-006",
      title: "Aesthetic screenshot evidence",
      status: passWarnFail(
        Boolean(aestheticSmoke) && aestheticSmoke?.manifest.failed === 0,
        true,
      ),
      proof: aestheticSmoke
        ? `smokeFailed=${aestheticSmoke.manifest.failed}; checks=${aestheticSmoke.manifest.checks}; screenshots=${aestheticSmoke.manifest.screenshots}.`
        : "No aesthetic smoke artifact found yet.",
      command: "npm run ui:aesthetic-smoke",
      artifact: "data/ecosystem/aesthetic-smoke/<run-id>/report.md",
      boundary: "Screenshots are local evidence and do not decide aesthetic truth automatically.",
    },
  ];

  return {
    objective: longGoalObjective,
    generatedAt,
    items,
  };
}

export async function runLongGoalEvidenceBundle({
  runId = runIdFromDate(),
}: {
  runId?: string;
} = {}): Promise<LongGoalEvidenceRunResult> {
  await mkdir(longGoalEvidenceRunsDir, { recursive: true });
  const runDir = path.join(longGoalEvidenceRunsDir, runId);
  await mkdir(runDir, { recursive: true });

  const bundle = await collectLongGoalEvidenceBundle();
  const manifest = createLongGoalEvidenceManifest({ runId, bundle });
  const reportMarkdown = generateLongGoalEvidenceReport({ manifest, bundle });

  await Promise.all([
    writeFile(path.join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(runDir, "bundle.json"), `${JSON.stringify(bundle, null, 2)}\n`),
    writeFile(path.join(runDir, "report.md"), `${reportMarkdown}\n`),
  ]);

  return {
    runId,
    runDir,
    manifest,
    bundle,
    reportMarkdown,
  };
}

export async function getLatestLongGoalEvidenceSummary(): Promise<
  LongGoalEvidenceRunSummary | undefined
> {
  let entries;
  try {
    entries = await readdir(longGoalEvidenceRunsDir, { withFileTypes: true });
  } catch {
    return undefined;
  }
  const runId = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse()[0];
  if (!runId) return undefined;

  const runDir = path.join(longGoalEvidenceRunsDir, runId);
  const [manifestText, bundleText, reportMarkdown] = await Promise.all([
    safeReadText(path.join(runDir, "manifest.json")),
    safeReadText(path.join(runDir, "bundle.json")),
    safeReadText(path.join(runDir, "report.md")),
  ]);
  const manifest = parseJson<LongGoalEvidenceManifest>(manifestText);
  const bundle = parseJson<LongGoalEvidenceBundle>(bundleText);
  if (!manifest || !bundle) return undefined;

  return {
    manifest,
    bundle,
    reportMarkdown: reportMarkdown ?? "",
    runDir,
  };
}
