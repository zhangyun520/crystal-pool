import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildLongGoalHorizonProposals,
  createLongGoalHorizonManifest,
  generateLongGoalHorizonReport,
  longGoalHorizonProposalToJiEvent,
  longGoalHorizonProposalToRfcDraft,
  longGoalHorizonProposalToSandboxInput,
  type LongGoalHorizonContext,
  type LongGoalHorizonManifest,
  type LongGoalHorizonProposal,
  type LongGoalHorizonRunSummary,
} from "@/lib/longGoalHorizon";
import { getLatestAestheticSmokeSummary } from "./aestheticSmoke";
import { prisma } from "./db";
import { getLatestForkCompatibilitySummary } from "./forkCompatibility";
import { writeJiEventToInbox } from "./ji";
import { getLatestLongGoalEvidenceSummary } from "./longGoalEvidence";
import { getPhilosophyAestheticsGoalAudit } from "./philosophyAestheticsGoal";
import { completeSandboxRun, runSandboxProtocol } from "./sandbox";
import { getCurrentWorldlineCoverageMatrix } from "./worldlineCoverage";

export const longGoalHorizonRunsDir = path.join(
  process.cwd(),
  "data",
  "ecosystem",
  "long-goal-horizon",
);

export type LongGoalHorizonRunResult = LongGoalHorizonRunSummary & {
  runId: string;
  runDir: string;
  jiEventIds: string[];
  sandboxRunIds: string[];
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

function jsonl(values: unknown[]) {
  return values.length
    ? `${values.map((value) => JSON.stringify(value)).join("\n")}\n`
    : "";
}

function runIdFromDate(date = new Date()) {
  return `long-goal-horizon-${date.toISOString().replace(/[:.]/g, "-")}`;
}

export async function collectLongGoalHorizonContext(
  generatedAt = new Date().toISOString(),
): Promise<LongGoalHorizonContext> {
  const [
    evidence,
    goal,
    worldlineCoverage,
    forkCompatibility,
    aestheticSmoke,
    pendingJiEvents,
  ] = await Promise.all([
    getLatestLongGoalEvidenceSummary(),
    getPhilosophyAestheticsGoalAudit(),
    getCurrentWorldlineCoverageMatrix(),
    getLatestForkCompatibilitySummary(),
    getLatestAestheticSmokeSummary(),
    prisma.jiEventRecord.count({ where: { status: "pending" } }),
  ]);

  return {
    generatedAt,
    evidenceStatus: evidence?.manifest.status ?? "missing",
    goalCoverageScore: goal.audit.coverageScore,
    openGoalItems: goal.audit.openItems.length,
    pendingJiEvents,
    worldlineCoveragePercent: worldlineCoverage.coveragePercent,
    forkCompatibilityStatus: forkCompatibility?.manifest.status ?? "missing",
    aestheticSmokeStatus: aestheticSmoke
      ? aestheticSmoke.manifest.failed === 0
        ? "pass"
        : "fail"
      : "missing",
  };
}

export async function runLongGoalHorizon({
  runId = runIdFromDate(),
  writeJiEvents = true,
  createSandboxes = false,
  maxSandboxRuns = 4,
}: {
  runId?: string;
  writeJiEvents?: boolean;
  createSandboxes?: boolean;
  maxSandboxRuns?: number;
} = {}): Promise<LongGoalHorizonRunResult> {
  await mkdir(longGoalHorizonRunsDir, { recursive: true });
  const runDir = path.join(longGoalHorizonRunsDir, runId);
  await mkdir(runDir, { recursive: true });

  const context = await collectLongGoalHorizonContext();
  const proposals = buildLongGoalHorizonProposals(context);
  const jiEvents = proposals.map((proposal) =>
    longGoalHorizonProposalToJiEvent({
      proposal,
      runId,
      occurredAt: context.generatedAt,
    }),
  );
  const sandboxInputs = proposals.map((proposal, index) =>
    longGoalHorizonProposalToSandboxInput(proposal, jiEvents[index]?.id),
  );
  const rfcDrafts = proposals.map(longGoalHorizonProposalToRfcDraft);

  if (writeJiEvents) {
    for (const event of jiEvents) {
      await writeJiEventToInbox(event, { fileName: "long-goal-horizon" });
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

  const manifest = createLongGoalHorizonManifest({
    runId,
    generatedAt: context.generatedAt,
    proposals,
    jiEventsWritten: writeJiEvents ? jiEvents.length : 0,
    sandboxRunsCreated: sandboxRunIds.length,
  });
  const reportMarkdown = generateLongGoalHorizonReport({
    manifest,
    context,
    proposals,
  });

  await Promise.all([
    writeFile(path.join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(runDir, "context.json"), `${JSON.stringify(context, null, 2)}\n`),
    writeFile(path.join(runDir, "proposals.json"), `${JSON.stringify(proposals, null, 2)}\n`),
    writeFile(path.join(runDir, "ji-events.jsonl"), jsonl(jiEvents)),
    writeFile(path.join(runDir, "sandbox-inputs.jsonl"), jsonl(sandboxInputs)),
    writeFile(path.join(runDir, "sandbox-runs.jsonl"), jsonl(sandboxRunIds.map((id) => ({ id })))),
    writeFile(path.join(runDir, "rfc-drafts.md"), rfcDrafts.join("\n\n---\n\n")),
    writeFile(path.join(runDir, "report.md"), `${reportMarkdown}\n`),
  ]);

  return {
    runId,
    runDir,
    manifest,
    context,
    proposals,
    reportMarkdown,
    jiEventIds: jiEvents.map((event) => event.id),
    sandboxRunIds,
  };
}

export async function getLatestLongGoalHorizonSummary(): Promise<
  LongGoalHorizonRunSummary | undefined
> {
  let entries;
  try {
    entries = await readdir(longGoalHorizonRunsDir, { withFileTypes: true });
  } catch {
    return undefined;
  }
  const runId = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse()[0];
  if (!runId) return undefined;

  const runDir = path.join(longGoalHorizonRunsDir, runId);
  const [manifestText, contextText, proposalsText, reportMarkdown] =
    await Promise.all([
      safeReadText(path.join(runDir, "manifest.json")),
      safeReadText(path.join(runDir, "context.json")),
      safeReadText(path.join(runDir, "proposals.json")),
      safeReadText(path.join(runDir, "report.md")),
    ]);
  const manifest = parseJson<LongGoalHorizonManifest>(manifestText);
  const context = parseJson<LongGoalHorizonContext>(contextText);
  const proposals = parseJson<LongGoalHorizonProposal[]>(proposalsText);
  if (!manifest || !context || !proposals) return undefined;

  return {
    manifest,
    context,
    proposals,
    reportMarkdown: reportMarkdown ?? "",
    runDir,
  };
}
