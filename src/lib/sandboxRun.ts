import {
  parseSandboxDiagnostics,
  parseSandboxMode,
  parseSandboxOutputs,
  type SandboxDiagnostic,
  type SandboxMode,
  type SandboxOutput,
  type SandboxRun,
  type SandboxStatus,
} from "./sandbox";
import { cleanOptionalWorldlineKey, type WorldlineKey } from "./worldline";

export type SandboxRunEvent = {
  id: string;
  kind:
    | "scenario_started"
    | "tick"
    | "pressure_spike"
    | "actor_action"
    | "system_observation"
    | "learning_proposed"
    | "reset";
  tick: number;
  actorLabel?: string;
  title: string;
  detail: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type SandboxLearningProposal = {
  id: string;
  runId: string;
  status: "proposed" | "imported" | "dismissed";
  title: string;
  body: string;
  suggestedAction: string;
  importedNodeId?: string;
  createdAt: string;
  reviewedAt?: string;
};

export type SandboxRunRecord = SandboxRun & {
  scenarioKey: string;
  worldlineKey?: WorldlineKey;
  worldlineHypothesis?: string;
  responsibilityQuestion?: string;
  sourceJiEventIds: string[];
  seed: number;
  timeScale: number;
  currentTick: number;
  reportMarkdown?: string;
  archivedAt?: string;
  archiveReason?: string;
  events: SandboxRunEvent[];
  learnings: SandboxLearningProposal[];
  immutable: boolean;
};

export type StoredSandboxEventRecord = {
  id: string;
  kind: string;
  tick: number;
  actorLabel?: string | null;
  title: string;
  detail: string;
  payloadJson: string;
  createdAt: Date | string;
};

export type StoredSandboxLearningRecord = {
  id: string;
  runId: string;
  status: string;
  title: string;
  body: string;
  suggestedAction: string;
  importedNodeId?: string | null;
  createdAt: Date | string;
  reviewedAt?: Date | string | null;
};

export type StoredSandboxRunRecord = {
  id: string;
  mode: string;
  scenarioKey: string;
  title: string;
  description?: string | null;
  status: string;
  seed: number;
  timeScale: number;
  currentTick: number;
  inputNodesJson?: string | null;
  inputActorsJson?: string | null;
  inputMechanismsJson?: string | null;
  configJson?: string | null;
  outputsJson?: string | null;
  diagnosticsJson?: string | null;
  reportMarkdown?: string | null;
  archivedAt?: Date | string | null;
  archiveReason?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  events?: StoredSandboxEventRecord[];
  learnings?: StoredSandboxLearningRecord[];
};

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function optionalIso(value?: Date | string | null) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function parseStringArray(value?: string | null) {
  if (!value?.trim()) return [];
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error("Stored sandbox input list is not an array.");
  }
  return parsed
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function parsePayload(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value || "{}");
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return parsed as Record<string, unknown>;
}

function parseOptionalConfig(value?: string | null): Record<string, unknown> {
  if (!value?.trim()) return {};
  return parsePayload(value);
}

function configString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function configStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function configWorldlineKey(value: unknown) {
  try {
    return cleanOptionalWorldlineKey(value);
  } catch {
    return undefined;
  }
}

export function normalizeSandboxStatus(status: string): SandboxStatus {
  if (
    status === "draft" ||
    status === "running" ||
    status === "completed" ||
    status === "archived"
  ) {
    return status;
  }
  if (status === "reset") return "archived";
  throw new Error(`Invalid sandbox status "${status}".`);
}

export function toSandboxRunRecord(record: StoredSandboxRunRecord): SandboxRunRecord {
  const mode: SandboxMode = parseSandboxMode(record.mode);
  const status = normalizeSandboxStatus(record.status);
  const outputs: SandboxOutput[] = parseSandboxOutputs(record.outputsJson);
  const diagnostics: SandboxDiagnostic[] = parseSandboxDiagnostics(
    record.diagnosticsJson,
  );
  const config = parseOptionalConfig(record.configJson);
  const worldlineKey = configWorldlineKey(config.worldlineKey);

  return {
    id: record.id,
    mode,
    scenarioKey: record.scenarioKey,
    worldlineKey,
    worldlineHypothesis: configString(config.worldlineHypothesis),
    responsibilityQuestion: configString(config.responsibilityQuestion),
    sourceJiEventIds: configStringArray(config.sourceJiEventIds),
    title: record.title,
    description: record.description ?? undefined,
    status,
    seed: record.seed,
    timeScale: record.timeScale,
    currentTick: record.currentTick,
    createdAt: iso(record.createdAt),
    updatedAt: iso(record.updatedAt),
    inputNodes: parseStringArray(record.inputNodesJson),
    inputActors: parseStringArray(record.inputActorsJson),
    inputMechanisms: parseStringArray(record.inputMechanismsJson),
    outputs,
    diagnostics,
    reportMarkdown: record.reportMarkdown ?? undefined,
    archivedAt: optionalIso(record.archivedAt),
    archiveReason: record.archiveReason ?? undefined,
    events: (record.events ?? []).map((event) => ({
      id: event.id,
      kind: event.kind as SandboxRunEvent["kind"],
      tick: event.tick,
      actorLabel: event.actorLabel ?? undefined,
      title: event.title,
      detail: event.detail,
      payload: parsePayload(event.payloadJson),
      createdAt: iso(event.createdAt),
    })),
    learnings: (record.learnings ?? []).map((learning) => ({
      id: learning.id,
      runId: learning.runId,
      status: learning.status as SandboxLearningProposal["status"],
      title: learning.title,
      body: learning.body,
      suggestedAction: learning.suggestedAction,
      importedNodeId: learning.importedNodeId ?? undefined,
      createdAt: iso(learning.createdAt),
      reviewedAt: optionalIso(learning.reviewedAt),
    })),
    immutable: status === "completed" || status === "archived",
  };
}

export function sandboxRunStorageLeakCheck(value: unknown) {
  return JSON.stringify(value).includes("FugueRun");
}
