import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildWorldlineCoverageMatrix,
  createWorldlineCoverageManifest,
  generateWorldlineCoverageReport,
  type WorldlineCoverageManifest,
  type WorldlineCoverageMatrix,
  type WorldlineCoverageRunSummary,
} from "@/lib/worldlineCoverage";
import { buildWorldlineSandboxInput } from "@/lib/worldline";
import { defaultPoolIds } from "@/lib/pools";
import { prisma } from "./db";
import { completeSandboxRun, runSandboxProtocol } from "./sandbox";

export const worldlineCoverageRunsDir = path.join(
  process.cwd(),
  "data",
  "ecosystem",
  "worldline-coverage",
);

export type WorldlineCoverageRunResult = WorldlineCoverageRunSummary & {
  runId: string;
  runDir: string;
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
  return `worldline-coverage-${date.toISOString().replace(/[:.]/g, "-")}`;
}

async function readSandboxRunsForCoverage() {
  const runs = await prisma.fugueRun.findMany({
    where: { poolId: defaultPoolIds.fugue },
    select: {
      id: true,
      mode: true,
      status: true,
      title: true,
      configJson: true,
      createdAt: true,
    },
  });

  return runs.map((run) => ({
    id: run.id,
    mode: run.mode,
    status: run.status,
    title: run.title,
    configJson: run.configJson,
    createdAt: run.createdAt.toISOString(),
  }));
}

export async function getCurrentWorldlineCoverageMatrix(): Promise<WorldlineCoverageMatrix> {
  return buildWorldlineCoverageMatrix({
    runs: await readSandboxRunsForCoverage(),
  });
}

export async function runWorldlineCoverageMatrix({
  runId = runIdFromDate(),
  createMissing = false,
  maxCreate = Number.POSITIVE_INFINITY,
}: {
  runId?: string;
  createMissing?: boolean;
  maxCreate?: number;
} = {}): Promise<WorldlineCoverageRunResult> {
  await mkdir(worldlineCoverageRunsDir, { recursive: true });
  const runDir = path.join(worldlineCoverageRunsDir, runId);
  await mkdir(runDir, { recursive: true });

  const before = buildWorldlineCoverageMatrix({
    runs: await readSandboxRunsForCoverage(),
  });
  const sandboxRunIds: string[] = [];

  if (createMissing) {
    for (const cell of before.missing.slice(0, maxCreate)) {
      const run = await runSandboxProtocol(
        buildWorldlineSandboxInput({
          worldlineKey: cell.worldlineKey,
          mode: cell.mode,
          title: `${cell.worldlineLabel} ${cell.mode} coverage rehearsal`,
        }),
      );
      const completed =
        run.status === "completed" ? run : await completeSandboxRun(run.id, {});
      sandboxRunIds.push(completed.id);
    }
  }

  const matrix = buildWorldlineCoverageMatrix({
    runs: await readSandboxRunsForCoverage(),
  });
  const manifest = createWorldlineCoverageManifest({
    runId,
    matrix,
    sandboxRunsCreated: sandboxRunIds.length,
  });
  const reportMarkdown = generateWorldlineCoverageReport({ manifest, matrix });

  await Promise.all([
    writeFile(path.join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(runDir, "matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`),
    writeFile(path.join(runDir, "missing-before.json"), `${JSON.stringify(before.missing, null, 2)}\n`),
    writeFile(path.join(runDir, "sandbox-runs.jsonl"), jsonl(sandboxRunIds.map((id) => ({ id })))),
    writeFile(path.join(runDir, "report.md"), `${reportMarkdown}\n`),
  ]);

  return {
    runId,
    runDir,
    manifest,
    matrix,
    reportMarkdown,
    sandboxRunIds,
  };
}

export async function getLatestWorldlineCoverageSummary(): Promise<
  WorldlineCoverageRunSummary | undefined
> {
  let entries;
  try {
    entries = await readdir(worldlineCoverageRunsDir, { withFileTypes: true });
  } catch {
    return undefined;
  }
  const runId = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse()[0];
  if (!runId) return undefined;

  const runDir = path.join(worldlineCoverageRunsDir, runId);
  const [manifestText, matrixText, reportMarkdown] = await Promise.all([
    safeReadText(path.join(runDir, "manifest.json")),
    safeReadText(path.join(runDir, "matrix.json")),
    safeReadText(path.join(runDir, "report.md")),
  ]);
  const manifest = parseJson<WorldlineCoverageManifest>(manifestText);
  const matrix = parseJson<WorldlineCoverageMatrix>(matrixText);
  if (!manifest || !matrix) return undefined;

  return {
    manifest,
    matrix,
    reportMarkdown: reportMarkdown ?? "",
    runDir,
  };
}
