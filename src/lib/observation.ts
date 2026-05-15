import { type EdgeRelation, type Phase } from "./domain";

export type ObservationLevel = "good" | "watch" | "alert";

export type ObservedCorpusRun = {
  runId: string;
  createdAt: string;
  workerTarget: string;
  inputItems: number;
  marks: number;
  trajectoryEvents: number;
  warnings: number;
  highHa: number;
  duplicates: number;
  notableMarks: Array<{
    title: string;
    phase: Phase;
    relation: EdgeRelation;
    emotionHa: number;
  }>;
};

export type ObservationPoolHealth = {
  activeNodes: number;
  archivedNodes: number;
  edges: number;
  phaseCounts: Partial<Record<Phase, number>>;
  lowHaCrystals: number;
  isolatedNodes: number;
  recentPhaseEvents: number;
};

export type ObservationPoolInput = {
  inboxFiles: number;
  inboxItems: number;
  processedFiles: number;
  runs: ObservedCorpusRun[];
  pool: ObservationPoolHealth;
};

export type ObservationSignal = {
  level: ObservationLevel;
  title: string;
  detail: string;
};

export function summarizeObservedRuns(runs: ObservedCorpusRun[]) {
  return runs.reduce(
    (summary, run) => {
      summary.totalRuns += 1;
      summary.inputItems += run.inputItems;
      summary.marks += run.marks;
      summary.trajectoryEvents += run.trajectoryEvents;
      summary.warnings += run.warnings;
      summary.highHa += run.highHa;
      summary.duplicates += run.duplicates;
      return summary;
    },
    {
      totalRuns: 0,
      inputItems: 0,
      marks: 0,
      trajectoryEvents: 0,
      warnings: 0,
      highHa: 0,
      duplicates: 0,
    },
  );
}

export function createObservationSignals(
  input: ObservationPoolInput,
): ObservationSignal[] {
  const latestRun = input.runs[0];
  const signals: ObservationSignal[] = [];

  if (input.inboxItems > 0) {
    signals.push({
      level: "watch",
      title: "Queue waiting",
      detail: `${input.inboxItems} corpus item${input.inboxItems === 1 ? "" : "s"} across ${input.inboxFiles} inbox file${input.inboxFiles === 1 ? "" : "s"}.`,
    });
  } else {
    signals.push({
      level: "good",
      title: "Inbox clear",
      detail: "No queued corpus shards are waiting in the local inbox.",
    });
  }

  if (!latestRun) {
    signals.push({
      level: "watch",
      title: "No corpus runs yet",
      detail: "The observer has not found a completed long-run artifact.",
    });
  } else if (latestRun.warnings > 0) {
    signals.push({
      level: "alert",
      title: "Latest run has warnings",
      detail: `${latestRun.runId} emitted ${latestRun.warnings} warning${latestRun.warnings === 1 ? "" : "s"}.`,
    });
  } else {
    signals.push({
      level: "good",
      title: "Latest run clean",
      detail: `${latestRun.runId} produced ${latestRun.marks} meaning mark${latestRun.marks === 1 ? "" : "s"} without warnings.`,
    });
  }

  if (input.pool.lowHaCrystals > 0) {
    signals.push({
      level: "watch",
      title: "Low-ha crystals",
      detail: `${input.pool.lowHaCrystals} crystal${input.pool.lowHaCrystals === 1 ? "" : "s"} may be getting too rigid.`,
    });
  }

  if (input.pool.isolatedNodes > 0) {
    signals.push({
      level: "watch",
      title: "Isolated nodes",
      detail: `${input.pool.isolatedNodes} active node${input.pool.isolatedNodes === 1 ? "" : "s"} currently have no active relations.`,
    });
  }

  if (input.runs.length >= 3 && summarizeObservedRuns(input.runs).warnings === 0) {
    signals.push({
      level: "good",
      title: "Run history stable",
      detail: `${input.runs.length} observed run${input.runs.length === 1 ? "" : "s"} are readable by the monitor.`,
    });
  }

  return signals;
}
