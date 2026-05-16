import { describe, expect, it } from "vitest";
import {
  createObservationSignals,
  summarizeObservedRuns,
  type ObservationPoolInput,
} from "@/lib/observation";

const baseInput: ObservationPoolInput = {
  inboxFiles: 0,
  inboxItems: 0,
  processedFiles: 0,
  runs: [],
  pool: {
    activeNodes: 9,
    archivedNodes: 0,
    edges: 8,
    phaseCounts: { gas: 0, liquid: 3, seed: 4, crystal: 2 },
    lowHaCrystals: 0,
    isolatedNodes: 0,
    recentPhaseEvents: 9,
  },
};

describe("observation pool signals", () => {
  it("reports clear inbox and missing run history", () => {
    const signals = createObservationSignals(baseInput);

    expect(signals.map((signal) => signal.title)).toContain("Inbox clear");
    expect(signals.map((signal) => signal.title)).toContain("No corpus runs yet");
  });

  it("raises watch and alert signals for queued work and warnings", () => {
    const signals = createObservationSignals({
      ...baseInput,
      inboxFiles: 2,
      inboxItems: 4,
      pool: {
        ...baseInput.pool,
        lowHaCrystals: 1,
        isolatedNodes: 2,
      },
      runs: [
        {
          runId: "corpus_20260513-000000",
          createdAt: "2026-05-13T00:00:00.000Z",
          workerTarget: "local",
          inputItems: 1,
          marks: 2,
          trajectoryEvents: 2,
          warnings: 1,
          highHa: 1,
          duplicates: 0,
          notableMarks: [],
        },
      ],
    });

    expect(signals.find((signal) => signal.title === "Queue waiting")?.level).toBe(
      "watch",
    );
    expect(
      signals.find((signal) => signal.title === "Latest run has warnings")?.level,
    ).toBe("alert");
    expect(signals.map((signal) => signal.title)).toContain("Low-ha crystals");
    expect(signals.map((signal) => signal.title)).toContain("Isolated nodes");
  });

  it("summarizes observed runs", () => {
    const summary = summarizeObservedRuns([
      {
        runId: "a",
        createdAt: "2026-05-13T00:00:00.000Z",
        workerTarget: "local",
        inputItems: 2,
        marks: 4,
        trajectoryEvents: 3,
        warnings: 1,
        highHa: 2,
        duplicates: 1,
        notableMarks: [],
      },
      {
        runId: "b",
        createdAt: "2026-05-13T01:00:00.000Z",
        workerTarget: "local",
        inputItems: 1,
        marks: 1,
        trajectoryEvents: 1,
        warnings: 0,
        highHa: 0,
        duplicates: 0,
        notableMarks: [],
      },
    ]);

    expect(summary).toMatchObject({
      totalRuns: 2,
      inputItems: 3,
      marks: 5,
      trajectoryEvents: 4,
      warnings: 1,
      highHa: 2,
      duplicates: 1,
    });
  });
});
