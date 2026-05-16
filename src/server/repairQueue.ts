import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { corpusRunArtifactNames } from "@/lib/corpusRun";
import { parseJsonl, type CrystalWorkerResult } from "@/lib/jobManifest";
import {
  buildRepairQueueItems,
  createRepairQueueManifest,
  generateRepairQueueReport,
  repairItemToJiEvent,
  repairItemToRfcDraft,
  repairItemToSandboxInput,
  type RepairQueueContext,
  type RepairQueueItem,
  type RepairQueueManifest,
  type RepairQueueRunSummary,
} from "@/lib/repairQueue";
import { defaultPoolIds } from "@/lib/pools";
import { prisma } from "./db";
import { getConstitutionSnapshot } from "./constitution";
import { getLatestAestheticSmokeSummary } from "./aestheticSmoke";
import { getJiInboxSnapshot, writeJiEventToInbox } from "./ji";
import { completeSandboxRun, runSandboxProtocol } from "./sandbox";

export const repairQueueRunsDir = path.join(
  process.cwd(),
  "data",
  "ecosystem",
  "repair-queue",
);

const corpusRunsDir = path.join(process.cwd(), "data", "corpus", "runs");

export type RepairQueueRunResult = RepairQueueRunSummary & {
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
  return `repair-queue-${date.toISOString().replace(/[:.]/g, "-")}`;
}

async function countRecentCorpusWarnings(limit = 5) {
  let entries;
  try {
    entries = await readdir(corpusRunsDir, { withFileTypes: true });
  } catch {
    return 0;
  }
  const runIds = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse()
    .slice(0, limit);

  const counts = await Promise.all(
    runIds.map(async (runId) => {
      const text = await safeReadText(
        path.join(corpusRunsDir, runId, corpusRunArtifactNames.workerResults),
      );
      if (!text) return 0;
      try {
        return parseJsonl<CrystalWorkerResult>(text).reduce(
          (sum, result) => sum + result.warnings.length,
          0,
        );
      } catch {
        return 1;
      }
    }),
  );

  return counts.reduce((sum, count) => sum + count, 0);
}

export async function collectRepairQueueContext(
  generatedAt = new Date().toISOString(),
): Promise<RepairQueueContext> {
  const [
    constitution,
    aestheticSmoke,
    jiInbox,
    aiFailedOrSkippedCycles,
    aiInvalidDecisions,
    sandboxProposedLearnings,
    corpusWarnings,
  ] = await Promise.all([
    getConstitutionSnapshot(),
    getLatestAestheticSmokeSummary(),
    getJiInboxSnapshot(),
    prisma.aIDirectorCycle.count({
      where: {
        poolId: defaultPoolIds.ai,
        status: { in: ["failed", "skipped"] },
      },
    }),
    prisma.aIDecision.count({
      where: {
        poolId: defaultPoolIds.ai,
        status: { in: ["invalid", "failed"] },
      },
    }),
    prisma.fugueLearningProposal.count({
      where: { status: "proposed" },
    }),
    countRecentCorpusWarnings(),
  ]);

  return {
    generatedAt,
    constitutionStatus: constitution.status,
    constitutionWarn: constitution.summary.warn,
    constitutionFail: constitution.summary.fail,
    aestheticSmokeStatus: aestheticSmoke
      ? aestheticSmoke.manifest.failed === 0
        ? "pass"
        : "fail"
      : "missing",
    aestheticSmokeFailed: aestheticSmoke?.manifest.failed ?? 0,
    aiFailedOrSkippedCycles,
    aiInvalidDecisions,
    jiInboxErrors: jiInbox.errors,
    corpusWarnings,
    sandboxProposedLearnings,
  };
}

export async function runRepairQueue({
  runId = runIdFromDate(),
  writeJiEvents = true,
  createSandboxes = false,
  maxSandboxRuns = 4,
}: {
  runId?: string;
  writeJiEvents?: boolean;
  createSandboxes?: boolean;
  maxSandboxRuns?: number;
} = {}): Promise<RepairQueueRunResult> {
  await mkdir(repairQueueRunsDir, { recursive: true });
  const runDir = path.join(repairQueueRunsDir, runId);
  await mkdir(runDir, { recursive: true });

  const context = await collectRepairQueueContext();
  const items = buildRepairQueueItems(context);
  const jiEvents = items.map((item) =>
    repairItemToJiEvent({ item, runId, occurredAt: context.generatedAt }),
  );
  const sandboxInputs = items.map((item, index) =>
    repairItemToSandboxInput(item, jiEvents[index]?.id),
  );
  const rfcDrafts = items.map(repairItemToRfcDraft);

  if (writeJiEvents) {
    for (const event of jiEvents) {
      await writeJiEventToInbox(event, { fileName: "repair-queue" });
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

  const manifest = createRepairQueueManifest({
    runId,
    generatedAt: context.generatedAt,
    items,
    jiEventsWritten: writeJiEvents ? jiEvents.length : 0,
    sandboxRunsCreated: sandboxRunIds.length,
  });
  const reportMarkdown = generateRepairQueueReport({ manifest, context, items });

  await Promise.all([
    writeFile(path.join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(runDir, "context.json"), `${JSON.stringify(context, null, 2)}\n`),
    writeFile(path.join(runDir, "repair-items.json"), `${JSON.stringify(items, null, 2)}\n`),
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
    items,
    reportMarkdown,
    jiEventIds: jiEvents.map((event) => event.id),
    sandboxRunIds,
  };
}

export async function getLatestRepairQueueSummary(): Promise<
  RepairQueueRunSummary | undefined
> {
  let entries;
  try {
    entries = await readdir(repairQueueRunsDir, { withFileTypes: true });
  } catch {
    return undefined;
  }
  const runId = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse()[0];
  if (!runId) return undefined;

  const runDir = path.join(repairQueueRunsDir, runId);
  const [manifestText, contextText, itemsText, reportMarkdown] =
    await Promise.all([
      safeReadText(path.join(runDir, "manifest.json")),
      safeReadText(path.join(runDir, "context.json")),
      safeReadText(path.join(runDir, "repair-items.json")),
      safeReadText(path.join(runDir, "report.md")),
    ]);
  const manifest = parseJson<RepairQueueManifest>(manifestText);
  const context = parseJson<RepairQueueContext>(contextText);
  const items = parseJson<RepairQueueItem[]>(itemsText);
  if (!manifest || !context || !items) return undefined;

  return {
    manifest,
    context,
    items,
    reportMarkdown: reportMarkdown ?? "",
    runDir,
  };
}
