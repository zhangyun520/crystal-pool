import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  type AestheticSmokeManifest,
  type AestheticSmokeRouteCheck,
  type AestheticSmokeRunSummary,
} from "@/lib/aestheticSmoke";

export const aestheticSmokeRunsDir = path.join(
  process.cwd(),
  "data",
  "ecosystem",
  "aesthetic-smoke",
);

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

export async function getLatestAestheticSmokeSummary(): Promise<
  AestheticSmokeRunSummary | undefined
> {
  let entries;
  try {
    entries = await readdir(aestheticSmokeRunsDir, { withFileTypes: true });
  } catch {
    return undefined;
  }
  const runId = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse()[0];
  if (!runId) return undefined;

  const runDir = path.join(aestheticSmokeRunsDir, runId);
  const [manifestText, checksText, reportMarkdown] = await Promise.all([
    safeReadText(path.join(runDir, "manifest.json")),
    safeReadText(path.join(runDir, "route-checks.json")),
    safeReadText(path.join(runDir, "report.md")),
  ]);
  const manifest = parseJson<AestheticSmokeManifest>(manifestText);
  const checks = parseJson<AestheticSmokeRouteCheck[]>(checksText);
  if (!manifest || !checks) return undefined;

  return {
    manifest,
    checks,
    reportMarkdown: reportMarkdown ?? "",
    runDir,
  };
}
