import { buildCorpusTrailBundle, summarizeMeaningMarks } from "./corpusTrail";
import {
  createJobManifest,
  type CrystalJobManifest,
  type CrystalWorkerResult,
  type WorkerTarget,
} from "./jobManifest";

export type CorpusRunFile = {
  path: string;
  name: string;
  byteEstimate: number;
  itemCount: number;
};

export type CorpusRunPlan = {
  runId: string;
  createdAt: string;
  selectedFiles: CorpusRunFile[];
  skippedFiles: CorpusRunFile[];
};

export type CorpusRunSummary = {
  runId: string;
  createdAt: string;
  inputFiles: number;
  inputItems: number;
  snapshots: number;
  marks: number;
  trajectoryEvents: number;
  warnings: number;
  highHa: number;
  duplicates: number;
};

export type CorpusRunArtifactNames = {
  manifest: string;
  workerResults: string;
  trailBundle: string;
  report: string;
};

export const corpusRunArtifactNames: CorpusRunArtifactNames = {
  manifest: "manifest.json",
  workerResults: "worker-results.jsonl",
  trailBundle: "trail-bundle.json",
  report: "run-report.md",
};

function compactTimestamp(value: Date) {
  return value.toISOString().replace(/[-:.]/g, "").replace("T", "-").slice(0, 15);
}

export function createCorpusRunId(value = new Date()) {
  return `corpus_${compactTimestamp(value)}`;
}

export function planCorpusRun({
  files,
  maxFiles = Number.POSITIVE_INFINITY,
  now = new Date(),
}: {
  files: CorpusRunFile[];
  maxFiles?: number;
  now?: Date;
}): CorpusRunPlan {
  const sorted = [...files]
    .filter((file) => file.name.endsWith(".jsonl"))
    .sort((a, b) => a.name.localeCompare(b.name));
  const selectedFiles = sorted.slice(0, maxFiles);
  const skippedFiles = sorted.slice(maxFiles);

  return {
    runId: createCorpusRunId(now),
    createdAt: now.toISOString(),
    selectedFiles,
    skippedFiles,
  };
}

export function createCorpusRunManifest({
  plan,
  workerTarget = "local",
}: {
  plan: CorpusRunPlan;
  workerTarget?: WorkerTarget;
}): CrystalJobManifest {
  return createJobManifest({
    goal: "Automatically mark Crystal Pool corpus inbox shards",
    workerTarget,
    createdAt: plan.createdAt,
    shards: plan.selectedFiles.map((file) => ({
      id: file.name.replace(/\.jsonl$/i, ""),
      sourceKind: "file",
      sourceRef: file.path,
      itemCount: file.itemCount,
      byteEstimate: file.byteEstimate,
      notes: `Queued by ${plan.runId}`,
    })),
  });
}

export function summarizeCorpusRun({
  plan,
  results,
}: {
  plan: CorpusRunPlan;
  results: CrystalWorkerResult[];
}): CorpusRunSummary {
  const marks = results.flatMap((result) => result.marks);
  const markSummary = summarizeMeaningMarks(marks);
  const bundle = buildCorpusTrailBundle(
    results.map((result) => ({
      snapshot: result.snapshot,
      marks: result.marks,
    })),
  );

  return {
    runId: plan.runId,
    createdAt: plan.createdAt,
    inputFiles: plan.selectedFiles.length,
    inputItems: results.length,
    snapshots: results.length,
    marks: marks.length,
    trajectoryEvents: bundle.trajectoryEvents.length,
    warnings: results.reduce((sum, result) => sum + result.warnings.length, 0),
    highHa: markSummary.highHa,
    duplicates: markSummary.duplicates,
  };
}

export function buildCorpusRunReport({
  summary,
  manifest,
  results,
}: {
  summary: CorpusRunSummary;
  manifest: CrystalJobManifest;
  results: CrystalWorkerResult[];
}) {
  const warningLines = results.flatMap((result) =>
    result.warnings.map(
      (warning) => `- ${result.snapshot.sourceRef}: ${warning}`,
    ),
  );
  const markLines = results.flatMap((result) =>
    result.marks.slice(0, 5).map(
      (mark) =>
        `- ${mark.phase} / ${mark.suggestedRelation} / ha ${mark.emotionHa}: ${mark.title}`,
    ),
  );

  return [
    `# Corpus Long Run ${summary.runId}`,
    "",
    `Created at: ${summary.createdAt}`,
    "",
    "## Summary",
    "",
    `- Input files: ${summary.inputFiles}`,
    `- Input items: ${summary.inputItems}`,
    `- Snapshots: ${summary.snapshots}`,
    `- Meaning marks: ${summary.marks}`,
    `- Trajectory events: ${summary.trajectoryEvents}`,
    `- High-ha marks: ${summary.highHa}`,
    `- Duplicate hints: ${summary.duplicates}`,
    `- Warnings: ${summary.warnings}`,
    "",
    "## Manifest",
    "",
    `- Schema: ${manifest.schemaVersion}`,
    `- Worker target: ${manifest.workerTarget}`,
    `- Shards: ${manifest.shards.length}`,
    "",
    "## Notable Marks",
    "",
    ...(markLines.length ? markLines : ["- No marks produced."]),
    "",
    "## Warnings",
    "",
    ...(warningLines.length ? warningLines : ["- None."]),
    "",
    "## Next Review Step",
    "",
    "Inspect `worker-results.jsonl` and `trail-bundle.json` before importing anything into the pool.",
    "",
  ].join("\n");
}
