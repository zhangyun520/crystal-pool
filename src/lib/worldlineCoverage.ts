import { type SandboxMode, sandboxModes, type SandboxStatus } from "./sandbox";
import {
  cleanOptionalWorldlineKey,
  worldlineKeys,
  worldlineProtocols,
  type WorldlineKey,
} from "./worldline";

export type WorldlineCoverageRun = {
  id: string;
  mode: SandboxMode | string;
  status: SandboxStatus | string;
  title: string;
  configJson: string;
  createdAt: string;
};

export type WorldlineCoverageCell = {
  worldlineKey: WorldlineKey;
  worldlineLabel: string;
  mode: SandboxMode;
  runCount: number;
  completedCount: number;
  latestRunId?: string;
  latestTitle?: string;
  latestStatus?: string;
  latestCreatedAt?: string;
  status: "covered" | "missing";
};

export type WorldlineCoverageMatrix = {
  generatedAt: string;
  totalCells: number;
  coveredCells: number;
  missingCells: number;
  coveragePercent: number;
  status: "pass" | "partial";
  cells: WorldlineCoverageCell[];
  missing: WorldlineCoverageCell[];
  byWorldline: Record<WorldlineKey, {
    covered: number;
    total: number;
    missingModes: SandboxMode[];
  }>;
  byMode: Record<SandboxMode, {
    covered: number;
    total: number;
    missingWorldlines: WorldlineKey[];
  }>;
};

export type WorldlineCoverageManifest = {
  runId: string;
  mode: "worldline_coverage_matrix";
  generatedAt: string;
  totalCells: number;
  coveredCells: number;
  missingCells: number;
  coveragePercent: number;
  status: "pass" | "partial";
  sandboxRunsCreated: number;
  jiEventsWritten: number;
  canonicalMutationAllowed: false;
};

export type WorldlineCoverageRunSummary = {
  manifest: WorldlineCoverageManifest;
  matrix: WorldlineCoverageMatrix;
  reportMarkdown: string;
  runDir?: string;
};

export function parseWorldlineFromSandboxConfig(
  configJson: string,
): WorldlineKey | undefined {
  try {
    const parsed = JSON.parse(configJson) as { worldlineKey?: unknown };
    return cleanOptionalWorldlineKey(parsed.worldlineKey);
  } catch {
    return undefined;
  }
}

function latestRun(runs: WorldlineCoverageRun[]) {
  return [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function buildWorldlineCoverageMatrix({
  runs,
  generatedAt = new Date().toISOString(),
}: {
  runs: WorldlineCoverageRun[];
  generatedAt?: string;
}): WorldlineCoverageMatrix {
  const cells: WorldlineCoverageCell[] = [];

  for (const worldlineKey of worldlineKeys) {
    for (const mode of sandboxModes) {
      const matching = runs.filter(
        (run) =>
          run.mode === mode &&
          parseWorldlineFromSandboxConfig(run.configJson) === worldlineKey,
      );
      const completed = matching.filter((run) => run.status === "completed");
      const latest = latestRun(matching);
      cells.push({
        worldlineKey,
        worldlineLabel: worldlineProtocols[worldlineKey].label,
        mode,
        runCount: matching.length,
        completedCount: completed.length,
        latestRunId: latest?.id,
        latestTitle: latest?.title,
        latestStatus: latest?.status,
        latestCreatedAt: latest?.createdAt,
        status: completed.length > 0 ? "covered" : "missing",
      });
    }
  }

  const totalCells = cells.length;
  const coveredCells = cells.filter((cell) => cell.status === "covered").length;
  const missing = cells.filter((cell) => cell.status === "missing");
  const missingCells = missing.length;
  const coveragePercent = Math.round((coveredCells / totalCells) * 100);

  const byWorldline = Object.fromEntries(
    worldlineKeys.map((worldlineKey) => {
      const worldlineCells = cells.filter((cell) => cell.worldlineKey === worldlineKey);
      return [
        worldlineKey,
        {
          covered: worldlineCells.filter((cell) => cell.status === "covered").length,
          total: worldlineCells.length,
          missingModes: worldlineCells
            .filter((cell) => cell.status === "missing")
            .map((cell) => cell.mode),
        },
      ];
    }),
  ) as WorldlineCoverageMatrix["byWorldline"];

  const byMode = Object.fromEntries(
    sandboxModes.map((mode) => {
      const modeCells = cells.filter((cell) => cell.mode === mode);
      return [
        mode,
        {
          covered: modeCells.filter((cell) => cell.status === "covered").length,
          total: modeCells.length,
          missingWorldlines: modeCells
            .filter((cell) => cell.status === "missing")
            .map((cell) => cell.worldlineKey),
        },
      ];
    }),
  ) as WorldlineCoverageMatrix["byMode"];

  return {
    generatedAt,
    totalCells,
    coveredCells,
    missingCells,
    coveragePercent,
    status: missingCells === 0 ? "pass" : "partial",
    cells,
    missing,
    byWorldline,
    byMode,
  };
}

export function createWorldlineCoverageManifest({
  runId,
  matrix,
  sandboxRunsCreated = 0,
  jiEventsWritten = 0,
}: {
  runId: string;
  matrix: WorldlineCoverageMatrix;
  sandboxRunsCreated?: number;
  jiEventsWritten?: number;
}): WorldlineCoverageManifest {
  return {
    runId,
    mode: "worldline_coverage_matrix",
    generatedAt: matrix.generatedAt,
    totalCells: matrix.totalCells,
    coveredCells: matrix.coveredCells,
    missingCells: matrix.missingCells,
    coveragePercent: matrix.coveragePercent,
    status: matrix.status,
    sandboxRunsCreated,
    jiEventsWritten,
    canonicalMutationAllowed: false,
  };
}

export function generateWorldlineCoverageReport({
  manifest,
  matrix,
}: {
  manifest: WorldlineCoverageManifest;
  matrix: WorldlineCoverageMatrix;
}) {
  const missingLines = matrix.missing.length
    ? matrix.missing.map(
        (cell) =>
          `- MISSING ${cell.worldlineKey} + ${cell.mode}: create a ${cell.mode} rehearsal for ${cell.worldlineLabel}.`,
      )
    : ["- No missing combinations."];
  const worldlineLines = worldlineKeys.map((key) => {
    const row = matrix.byWorldline[key];
    return `- ${key}: ${row.covered}/${row.total} covered${row.missingModes.length ? `; missing ${row.missingModes.join(", ")}` : ""}`;
  });

  return [
    "# Crystal Pool Worldline Coverage Matrix",
    "",
    `- runId: ${manifest.runId}`,
    `- generatedAt: ${manifest.generatedAt}`,
    `- status: ${manifest.status}`,
    `- coverage: ${manifest.coveragePercent}%`,
    `- coveredCells: ${manifest.coveredCells}`,
    `- missingCells: ${manifest.missingCells}`,
    `- sandboxRunsCreated: ${manifest.sandboxRunsCreated}`,
    `- canonicalMutationAllowed: ${manifest.canonicalMutationAllowed}`,
    "",
    "## By Worldline",
    ...worldlineLines,
    "",
    "## Missing Combinations",
    ...missingLines,
    "",
    "## Boundary",
    "This matrix proves sandbox rehearsal coverage only. It does not promote learning, create canonical nodes, unlock AI mainline, upload anchors, or change governance by itself.",
  ].join("\n");
}
