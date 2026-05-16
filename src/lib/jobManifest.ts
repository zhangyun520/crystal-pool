import {
  createCorpusSnapshot,
  createMeaningMarks,
  type CorpusDocumentInput,
  type CorpusSnapshot,
  type CorpusSourceKind,
  type MeaningMark,
} from "./corpusTrail";
import { type ReferenceNode } from "./resonance";

export const crystalJobManifestSchemaVersion = "crystal-pool.job-manifest.v1";
export const crystalWorkerResultSchemaVersion = "crystal-pool.worker-result.v1";

export type WorkerTarget =
  | "local"
  | "github_actions"
  | "oracle_always_free"
  | "cloudflare_workers"
  | "colab_or_kaggle";

export type CrystalJobShard = {
  id: string;
  sourceKind: CorpusSourceKind;
  sourceRef: string;
  itemCount: number;
  byteEstimate: number;
  notes?: string;
};

export type CrystalJobManifest = {
  schemaVersion: typeof crystalJobManifestSchemaVersion;
  goal: string;
  workerTarget: WorkerTarget;
  createdAt: string;
  constraints: string[];
  shards: CrystalJobShard[];
};

export type CrystalWorkerInput = CorpusDocumentInput;

export type CrystalWorkerResult = {
  schemaVersion: typeof crystalWorkerResultSchemaVersion;
  inputHash: string;
  snapshot: CorpusSnapshot;
  marks: MeaningMark[];
  warnings: string[];
};

export function createJobManifest({
  goal,
  workerTarget = "local",
  shards,
  createdAt = new Date().toISOString(),
}: {
  goal: string;
  workerTarget?: WorkerTarget;
  shards: CrystalJobShard[];
  createdAt?: string;
}): CrystalJobManifest {
  return {
    schemaVersion: crystalJobManifestSchemaVersion,
    goal,
    workerTarget,
    createdAt,
    constraints: [
      "Only process user-provided or openly licensed corpus inputs.",
      "Do not bypass service limits, paywalls, robots policies, or account limits.",
      "Emit deterministic JSONL marks; never auto-create Crystal Pool nodes or edges.",
      "Keep raw text local unless the user explicitly exports a shard.",
    ],
    shards: [...shards].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export function serializeJsonl(records: unknown[]) {
  return records.map((record) => JSON.stringify(record)).join("\n");
}

export function parseJsonl<T = unknown>(input: string): T[] {
  return input
    .split(/\r?\n/g)
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.length > 0)
    .map(({ line, index }) => {
      try {
        return JSON.parse(line) as T;
      } catch {
        throw new Error(`Invalid JSONL at line ${index + 1}.`);
      }
    });
}

export function createWorkerResult(
  input: CrystalWorkerInput,
  referenceNodes: ReferenceNode[] = [],
): CrystalWorkerResult {
  const snapshot = createCorpusSnapshot(input);
  const marks = createMeaningMarks(snapshot, referenceNodes);
  const warnings = [
    marks.length === 0 ? "No meaning marks were detected." : "",
    !input.license ? "No license metadata was provided for this corpus item." : "",
  ].filter(Boolean);

  return {
    schemaVersion: crystalWorkerResultSchemaVersion,
    inputHash: snapshot.textHash,
    snapshot,
    marks,
    warnings,
  };
}

export function validateWorkerResult(value: unknown) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const result = value as Partial<CrystalWorkerResult> | null;

  if (!result || typeof result !== "object") {
    return { ok: false, errors: ["Worker result must be an object."], warnings };
  }
  if (result.schemaVersion !== crystalWorkerResultSchemaVersion) {
    errors.push("Unsupported worker result schemaVersion.");
  }
  if (!result.snapshot?.id || !result.snapshot?.textHash) {
    errors.push("Worker result must include a snapshot with id and textHash.");
  }
  if (!Array.isArray(result.marks)) {
    errors.push("Worker result marks must be an array.");
  } else if (result.marks.length === 0) {
    warnings.push("Worker result contains no meaning marks.");
  }
  if (!Array.isArray(result.warnings)) {
    warnings.push("Worker result warnings should be an array.");
  }

  return { ok: errors.length === 0, errors, warnings };
}
