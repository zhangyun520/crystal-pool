import { describe, expect, it } from "vitest";
import { sandboxModes } from "@/lib/sandbox";
import {
  buildWorldlineCoverageMatrix,
  createWorldlineCoverageManifest,
  generateWorldlineCoverageReport,
  parseWorldlineFromSandboxConfig,
  type WorldlineCoverageRun,
} from "@/lib/worldlineCoverage";
import { worldlineKeys } from "@/lib/worldline";

function run(
  overrides: Partial<WorldlineCoverageRun> = {},
): WorldlineCoverageRun {
  return {
    id: "run-1",
    mode: "SONATA",
    status: "completed",
    title: "Return Home Sonata",
    configJson: JSON.stringify({ worldlineKey: "RETURN_HOME" }),
    createdAt: "2026-05-16T10:00:00.000Z",
    ...overrides,
  };
}

describe("worldline coverage matrix", () => {
  it("parses worldline keys from sandbox config", () => {
    expect(parseWorldlineFromSandboxConfig(JSON.stringify({
      worldlineKey: "OTHERNESS_MIRROR",
    }))).toBe("OTHERNESS_MIRROR");
    expect(parseWorldlineFromSandboxConfig("{bad json")).toBeUndefined();
    expect(parseWorldlineFromSandboxConfig(JSON.stringify({}))).toBeUndefined();
  });

  it("builds a full worldline x sandbox-mode matrix", () => {
    const matrix = buildWorldlineCoverageMatrix({
      generatedAt: "2026-05-16T10:00:00.000Z",
      runs: [run()],
    });

    expect(matrix.totalCells).toBe(worldlineKeys.length * sandboxModes.length);
    expect(matrix.coveredCells).toBe(1);
    expect(matrix.missingCells).toBe(matrix.totalCells - 1);
    expect(matrix.status).toBe("partial");
    expect(matrix.byWorldline.RETURN_HOME.covered).toBe(1);
    expect(matrix.byMode.SONATA.covered).toBe(1);
  });

  it("requires completed rehearsals before a cell is covered", () => {
    const matrix = buildWorldlineCoverageMatrix({
      runs: [
        run({
          status: "running",
          mode: "FUGUE",
          configJson: JSON.stringify({ worldlineKey: "FORK_DRIFT" }),
        }),
      ],
    });
    const cell = matrix.cells.find(
      (item) => item.worldlineKey === "FORK_DRIFT" && item.mode === "FUGUE",
    );

    expect(cell).toMatchObject({
      runCount: 1,
      completedCount: 0,
      status: "missing",
    });
  });

  it("generates a manifest and report with local-only boundaries", () => {
    const matrix = buildWorldlineCoverageMatrix({
      generatedAt: "2026-05-16T10:00:00.000Z",
      runs: worldlineKeys.flatMap((worldlineKey) =>
        sandboxModes.map((mode, index) =>
          run({
            id: `${worldlineKey}-${mode}`,
            mode,
            status: "completed",
            title: `${worldlineKey} ${mode}`,
            configJson: JSON.stringify({ worldlineKey }),
            createdAt: `2026-05-16T10:00:${String(index).padStart(2, "0")}.000Z`,
          }),
        ),
      ),
    });
    const manifest = createWorldlineCoverageManifest({
      runId: "worldline-coverage-test",
      matrix,
      sandboxRunsCreated: 24,
    });
    const report = generateWorldlineCoverageReport({ manifest, matrix });

    expect(manifest).toMatchObject({
      status: "pass",
      coveragePercent: 100,
      missingCells: 0,
      canonicalMutationAllowed: false,
    });
    expect(report).toContain("# Crystal Pool Worldline Coverage Matrix");
    expect(report).toContain("No missing combinations");
    expect(report).toContain("does not promote learning");
  });
});
