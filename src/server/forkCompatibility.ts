import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import packageJson from "../../package.json";
import {
  ethicalInvariantIds,
  type ConstitutionPackageJson,
} from "@/lib/ethicalKernel";
import {
  evaluateForkCompatibility,
  generateForkCompatibilityReport,
  type ForkCompatibilityEvidence,
  type ForkCompatibilityResult,
} from "@/lib/forkCompatibility";
import { worldlineKeys } from "@/lib/worldline";
import { getConstitutionSnapshot } from "./constitution";

export const forkCompatibilityRunsDir = path.join(
  process.cwd(),
  "data",
  "ecosystem",
  "fork-compatibility",
);

export type ForkCompatibilityRunManifest = {
  runId: string;
  mode: "fork_compatibility_check";
  checkedAt: string;
  status: ForkCompatibilityResult["status"];
  compatibilityBadge: ForkCompatibilityResult["compatibilityBadge"];
  pass: number;
  warn: number;
  fail: number;
  canonicalMutationAllowed: false;
};

export type ForkCompatibilityRunSummary = {
  manifest: ForkCompatibilityRunManifest;
  result: ForkCompatibilityResult;
  reportMarkdown: string;
  runDir?: string;
};

export type ForkCompatibilityRunResult = ForkCompatibilityRunSummary & {
  runId: string;
  runDir: string;
  evidence: ForkCompatibilityEvidence;
};

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
  return `fork-compatibility-${date.toISOString().replace(/[:.]/g, "-")}`;
}

function createManifest({
  runId,
  result,
}: {
  runId: string;
  result: ForkCompatibilityResult;
}): ForkCompatibilityRunManifest {
  return {
    runId,
    mode: "fork_compatibility_check",
    checkedAt: result.checkedAt,
    status: result.status,
    compatibilityBadge: result.compatibilityBadge,
    pass: result.summary.pass,
    warn: result.summary.warn,
    fail: result.summary.fail,
    canonicalMutationAllowed: false,
  };
}

export async function collectForkCompatibilityEvidence(): Promise<ForkCompatibilityEvidence> {
  const [constitution, docs] = await Promise.all([
    getConstitutionSnapshot(),
    collectFiles(path.join(process.cwd(), "docs")),
  ]);
  const scripts = Object.keys(
    (packageJson as ConstitutionPackageJson & { scripts?: Record<string, string> })
      .scripts ?? {},
  );

  return {
    packageScripts: scripts,
    docs: docs.map((file) => `docs/${file}`),
    worldlineKeys,
    ethicalInvariantIds,
    constitutionStatus: constitution.status,
  };
}

export async function getForkCompatibilitySnapshot() {
  const evidence = await collectForkCompatibilityEvidence();
  const result = evaluateForkCompatibility({ evidence });
  return {
    evidence,
    result,
    reportMarkdown: generateForkCompatibilityReport(result),
  };
}

export async function runForkCompatibilityCheck({
  runId = runIdFromDate(),
}: {
  runId?: string;
} = {}): Promise<ForkCompatibilityRunResult> {
  await mkdir(forkCompatibilityRunsDir, { recursive: true });
  const runDir = path.join(forkCompatibilityRunsDir, runId);
  await mkdir(runDir, { recursive: true });

  const evidence = await collectForkCompatibilityEvidence();
  const result = evaluateForkCompatibility({ evidence });
  const reportMarkdown = generateForkCompatibilityReport(result);
  const manifest = createManifest({ runId, result });

  await Promise.all([
    writeFile(path.join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(runDir, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`),
    writeFile(path.join(runDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`),
    writeFile(path.join(runDir, "report.md"), `${reportMarkdown}\n`),
  ]);

  return {
    runId,
    runDir,
    manifest,
    evidence,
    result,
    reportMarkdown,
  };
}

export async function getLatestForkCompatibilitySummary(): Promise<
  ForkCompatibilityRunSummary | undefined
> {
  let entries;
  try {
    entries = await readdir(forkCompatibilityRunsDir, { withFileTypes: true });
  } catch {
    return undefined;
  }
  const runId = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse()[0];
  if (!runId) return undefined;

  const runDir = path.join(forkCompatibilityRunsDir, runId);
  const [manifestText, resultText, reportMarkdown] = await Promise.all([
    safeReadText(path.join(runDir, "manifest.json")),
    safeReadText(path.join(runDir, "result.json")),
    safeReadText(path.join(runDir, "report.md")),
  ]);
  const manifest = parseJson<ForkCompatibilityRunManifest>(manifestText);
  const result = parseJson<ForkCompatibilityResult>(resultText);
  if (!manifest || !result) return undefined;

  return {
    manifest,
    result,
    reportMarkdown: reportMarkdown ?? "",
    runDir,
  };
}
