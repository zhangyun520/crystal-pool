import { type Prisma, type PrismaClient } from "@prisma/client";
import { defaultPoolIds } from "@/lib/pools";
import {
  assertSandboxRunMutable,
  buildSandboxDiagnostics,
  buildSandboxOutputs,
  buildSandboxTimeline,
  generateSandboxReports,
  parseSandboxDiagnostics,
  parseSandboxOutputs,
  type SandboxDiagnostic,
  type SandboxOutput,
  type SandboxRunInput,
  validateSandboxRunInput,
} from "@/lib/sandbox";
import {
  toSandboxRunRecord,
  type SandboxRunRecord,
} from "@/lib/sandboxRun";
import { prisma } from "./db";
import { ensureDefaultPoolSpaces } from "./pools";

type DbClient = PrismaClient | Prisma.TransactionClient;

const sandboxRunInclude = {
  events: { orderBy: [{ tick: "asc" as const }, { createdAt: "asc" as const }] },
  learnings: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.FugueRunInclude;

export type AppendSandboxEventInput = {
  kind:
    | "scenario_started"
    | "tick"
    | "pressure_spike"
    | "actor_action"
    | "system_observation"
    | "learning_proposed"
    | "reset";
  tick: number;
  title: string;
  detail: string;
  actorLabel?: string;
  payload?: Record<string, unknown>;
};

function jsonArray(values: readonly string[]) {
  return JSON.stringify(values);
}

function sandboxScenarioKey(input: ReturnType<typeof validateSandboxRunInput>) {
  return input.scenarioKey ?? `${input.mode.toLowerCase()}-custom`;
}

export async function createSandboxRun(
  input: SandboxRunInput,
  client: DbClient = prisma,
): Promise<SandboxRunRecord> {
  await ensureDefaultPoolSpaces();
  const run = validateSandboxRunInput(input);
  const record = await client.fugueRun.create({
    data: {
      poolId: defaultPoolIds.fugue,
      mode: run.mode,
      scenarioKey: sandboxScenarioKey(run),
      title: run.title,
      description: run.description,
      seed: 42,
      status: "draft",
      configJson: JSON.stringify(run),
      inputNodesJson: jsonArray(run.inputNodes),
      inputActorsJson: jsonArray(run.inputActors),
      inputMechanismsJson: jsonArray(run.inputMechanisms),
    },
    include: sandboxRunInclude,
  });
  return toSandboxRunRecord(record);
}

export async function startSandboxRun(
  runId: string,
  client: DbClient = prisma,
): Promise<SandboxRunRecord> {
  const run = await client.fugueRun.findUniqueOrThrow({ where: { id: runId } });
  assertSandboxRunMutable(run.status);
  const record = await client.fugueRun.update({
    where: { id: runId },
    data: { status: "running" },
    include: sandboxRunInclude,
  });
  return toSandboxRunRecord(record);
}

export async function appendSandboxEvent(
  runId: string,
  input: AppendSandboxEventInput,
  client: DbClient = prisma,
) {
  const run = await client.fugueRun.findUniqueOrThrow({ where: { id: runId } });
  assertSandboxRunMutable(run.status);
  const event = await client.fugueEvent.create({
    data: {
      runId,
      kind: input.kind,
      tick: input.tick,
      actorLabel: input.actorLabel,
      title: input.title,
      detail: input.detail,
      payloadJson: JSON.stringify(input.payload ?? {}),
    },
  });
  await client.fugueRun.update({
    where: { id: runId },
    data: { currentTick: Math.max(run.currentTick, input.tick) },
  });
  return event;
}

export async function completeSandboxRun(
  runId: string,
  input: {
    outputs?: SandboxOutput[];
    diagnostics?: SandboxDiagnostic[];
  } = {},
  client: DbClient = prisma,
): Promise<SandboxRunRecord> {
  const run = await client.fugueRun.findUniqueOrThrow({ where: { id: runId } });
  assertSandboxRunMutable(run.status);
  const storedInput = {
    ...JSON.parse(run.configJson),
    mode: run.mode,
    title: run.title,
    inputNodes: JSON.parse(run.inputNodesJson),
    inputActors: JSON.parse(run.inputActorsJson),
    inputMechanisms: JSON.parse(run.inputMechanismsJson),
  } satisfies SandboxRunInput;
  const validated = validateSandboxRunInput(storedInput);
  const outputs = input.outputs ?? buildSandboxOutputs(validated);
  const diagnostics = input.diagnostics ?? buildSandboxDiagnostics(validated);
  const reportMarkdown = generateSandboxReports({ title: run.title, outputs });

  const record = await client.fugueRun.update({
    where: { id: runId },
    data: {
      status: "completed",
      outputsJson: JSON.stringify(outputs),
      diagnosticsJson: JSON.stringify(diagnostics),
      reportMarkdown,
    },
    include: sandboxRunInclude,
  });
  return toSandboxRunRecord(record);
}

export async function archiveSandboxRun(
  runId: string,
  reason?: string,
  client: DbClient = prisma,
): Promise<SandboxRunRecord> {
  const run = await client.fugueRun.findUniqueOrThrow({ where: { id: runId } });
  assertSandboxRunMutable(run.status, "archive");
  const record = await client.fugueRun.update({
    where: { id: runId },
    data: {
      status: "archived",
      archivedAt: new Date(),
      archiveReason: reason?.trim() || null,
    },
    include: sandboxRunInclude,
  });
  return toSandboxRunRecord(record);
}

export async function runSandboxProtocol(
  input: SandboxRunInput,
  client: DbClient = prisma,
): Promise<SandboxRunRecord> {
  await ensureDefaultPoolSpaces();
  const run = validateSandboxRunInput(input);
  const outputs = buildSandboxOutputs(run);
  const diagnostics = buildSandboxDiagnostics(run);
  const reportMarkdown = generateSandboxReports({ title: run.title, outputs });
  const timeline = buildSandboxTimeline({
    mode: run.mode,
    title: run.title,
    outputs,
  });

  const record = await client.fugueRun.create({
    data: {
      poolId: defaultPoolIds.fugue,
      mode: run.mode,
      scenarioKey: sandboxScenarioKey(run),
      title: run.title,
      description: run.description,
      seed: 42,
      status: run.mode === "FUGUE" ? "running" : "completed",
      currentTick: timeline.length,
      configJson: JSON.stringify(run),
      inputNodesJson: jsonArray(run.inputNodes),
      inputActorsJson: jsonArray(run.inputActors),
      inputMechanismsJson: jsonArray(run.inputMechanisms),
      outputsJson: JSON.stringify(outputs),
      diagnosticsJson: JSON.stringify(diagnostics),
      reportMarkdown,
      events: {
        create: timeline.map((event) => ({
          kind: event.kind,
          tick: event.tick,
          title: event.title,
          detail: event.detail,
          payloadJson: JSON.stringify(event.payload),
        })),
      },
    },
    include: sandboxRunInclude,
  });
  return toSandboxRunRecord(record);
}

export async function getSandboxRun(
  runId: string,
  client: DbClient = prisma,
): Promise<SandboxRunRecord> {
  const record = await client.fugueRun.findUniqueOrThrow({
    where: { id: runId },
    include: sandboxRunInclude,
  });
  return toSandboxRunRecord(record);
}

export async function listSandboxRuns({
  take = 12,
  client = prisma,
}: {
  take?: number;
  client?: DbClient;
} = {}): Promise<SandboxRunRecord[]> {
  await ensureDefaultPoolSpaces();
  const records = await client.fugueRun.findMany({
    where: { poolId: defaultPoolIds.fugue },
    include: sandboxRunInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
  return records.map(toSandboxRunRecord);
}

export function readSandboxOutputs(run: { outputsJson?: string | null }) {
  return parseSandboxOutputs(run.outputsJson);
}

export function readSandboxDiagnostics(run: { diagnosticsJson?: string | null }) {
  return parseSandboxDiagnostics(run.diagnosticsJson);
}
