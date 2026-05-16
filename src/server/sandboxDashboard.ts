"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  buildFugueTimeline,
  fugueScenarios,
  getFugueScenario,
} from "@/lib/fugue";
import { defaultPoolIds } from "@/lib/pools";
import {
  buildSandboxDiagnostics,
  buildSandboxOutputs,
  generateSandboxReports,
  sandboxModeDetails,
  sandboxModeProtocols,
  sandboxModes,
  validateSandboxRunInput,
} from "@/lib/sandbox";
import {
  toSandboxRunRecord,
  type SandboxLearningProposal,
} from "@/lib/sandboxRun";
import { worldlineKeys, worldlineProtocols } from "@/lib/worldline";
import { prisma } from "./db";
import { ensureDefaultPoolSpaces } from "./pools";
import { archiveSandboxRun, listSandboxRuns, runSandboxProtocol } from "./sandbox";
import {
  getCurrentWorldlineCoverageMatrix,
  getLatestWorldlineCoverageSummary,
} from "./worldlineCoverage";

const startFugueRunSchema = z.object({
  scenarioKey: z.string().trim().min(1),
  seed: z.coerce.number().int().min(1).max(999_999).default(42),
});

const startSandboxRunSchema = z.object({
  mode: z.enum(sandboxModes),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  targetMechanism: z.string().trim().optional(),
  inputMechanisms: z.string().trim().optional(),
  inputActors: z.string().trim().optional(),
  inputNodes: z.string().trim().optional(),
  theme: z.string().trim().optional(),
  counterTheme: z.string().trim().optional(),
  exploitVector: z.string().trim().optional(),
  observedFailure: z.string().trim().optional(),
  proposedPatch: z.string().trim().optional(),
  proposedRevision: z.string().trim().optional(),
  graphEffectProposalId: z.string().trim().optional(),
  rfcDraft: z.string().trim().optional(),
  openingState: z.string().trim().optional(),
  firstShock: z.string().trim().optional(),
  escalation: z.string().trim().optional(),
  counterpoint: z.string().trim().optional(),
  collapseOrStabilization: z.string().trim().optional(),
  lessons: z.string().trim().optional(),
  constitutionalPatch: z.string().trim().optional(),
  proposedRfc: z.string().trim().optional(),
  worldlineKey: z.enum(worldlineKeys).or(z.literal("")).optional(),
  worldlineHypothesis: z.string().trim().optional(),
  responsibilityQuestion: z.string().trim().optional(),
  sourceJiEventIds: z.string().trim().optional(),
});

const promoteLearningSchema = z.object({
  learningId: z.string().trim().min(1),
});

const archiveRunSchema = z.object({
  runId: z.string().trim().min(1),
  reason: z.string().trim().optional(),
});

function formObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function listFromTextarea(value?: string | null) {
  return (value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function revalidateSandboxSurfaces() {
  revalidatePath("/sandbox");
  revalidatePath("/fugue");
  revalidatePath("/observe");
}

export async function getSandboxDashboard({
  selectedRunId,
}: {
  selectedRunId?: string;
} = {}) {
  await ensureDefaultPoolSpaces();
  const [
    runs,
    learnings,
    modeCounts,
    statusCounts,
    worldlineCoverage,
    latestWorldlineCoverage,
  ] = await Promise.all([
    listSandboxRuns({ take: 16 }),
    prisma.fugueLearningProposal.findMany({
      include: { run: true },
      orderBy: { createdAt: "desc" },
      take: 16,
    }),
    prisma.fugueRun.groupBy({
      by: ["mode"],
      where: { poolId: defaultPoolIds.fugue },
      _count: { mode: true },
    }),
    prisma.fugueRun.groupBy({
      by: ["status"],
      where: { poolId: defaultPoolIds.fugue },
      _count: { status: true },
    }),
    getCurrentWorldlineCoverageMatrix(),
    getLatestWorldlineCoverageSummary(),
  ]);

  const selectedRun =
    runs.find((run) => run.id === selectedRunId) ??
    (selectedRunId
      ? toSandboxRunRecord(
          await prisma.fugueRun.findUniqueOrThrow({
            where: { id: selectedRunId },
            include: {
              events: { orderBy: [{ tick: "asc" }, { createdAt: "asc" }] },
              learnings: { orderBy: { createdAt: "desc" } },
            },
          }),
        )
      : runs[0]);

  return {
    modes: sandboxModeDetails,
    protocols: sandboxModeProtocols,
    worldlines: worldlineProtocols,
    scenarios: fugueScenarios,
    worldlineCoverage,
    latestWorldlineCoverage,
    runs,
    selectedRun,
    learnings: learnings.map(
      (learning): SandboxLearningProposal => ({
        id: learning.id,
        runId: learning.runId,
        status: learning.status,
        title: learning.title,
        body: learning.body,
        suggestedAction: learning.suggestedAction,
        importedNodeId: learning.importedNodeId ?? undefined,
        createdAt: learning.createdAt.toISOString(),
        reviewedAt: learning.reviewedAt?.toISOString(),
      }),
    ),
    summary: {
      totalRuns: statusCounts.reduce((sum, item) => sum + item._count.status, 0),
      byMode: Object.fromEntries(
        sandboxModes.map((mode) => [
          mode,
          modeCounts.find((item) => item.mode === mode)?._count.mode ?? 0,
        ]),
      ) as Record<(typeof sandboxModes)[number], number>,
      byStatus: Object.fromEntries(
        ["draft", "running", "completed", "archived"].map((status) => [
          status,
          statusCounts
            .filter((item) => item.status === status)
            .reduce((sum, item) => sum + item._count.status, 0),
        ]),
      ),
      byWorldline: Object.fromEntries(
        worldlineKeys.map((key) => [
          key,
          runs.filter((run) => run.worldlineKey === key).length,
        ]),
      ),
    },
  };
}

export async function getSandboxDashboardFromSearchParams(
  searchParams: Promise<{ run?: string | string[] }>,
) {
  const params = await searchParams;
  return getSandboxDashboard({ selectedRunId: firstParam(params.run) });
}

export async function startFugueScenarioAction(formData: FormData) {
  const parsed = startFugueRunSchema.parse(formObject(formData));
  const scenario = getFugueScenario(parsed.scenarioKey);
  if (!scenario) throw new Error("Unknown Fugue scenario.");
  await ensureDefaultPoolSpaces();
  const timeline = buildFugueTimeline({
    scenario,
    seed: parsed.seed,
    ticks: 8,
  });
  const sandboxInput = validateSandboxRunInput({
    mode: "FUGUE",
    scenarioKey: scenario.key,
    title: scenario.title,
    description: scenario.premise,
    inputMechanisms: [scenario.title],
    exploitVector: scenario.danger,
    observedFailure: scenario.danger,
    proposedPatch: scenario.learningGoal,
  });
  const outputs = buildSandboxOutputs(sandboxInput);
  const diagnostics = buildSandboxDiagnostics(sandboxInput);
  const reportMarkdown = generateSandboxReports({
    title: scenario.title,
    outputs,
  });
  const run = await prisma.fugueRun.create({
    data: {
      poolId: defaultPoolIds.fugue,
      mode: "FUGUE",
      scenarioKey: scenario.key,
      title: scenario.title,
      description: scenario.premise,
      seed: parsed.seed,
      timeScale: scenario.defaultTimeScale,
      currentTick: timeline.length,
      configJson: JSON.stringify(sandboxInput),
      inputMechanismsJson: JSON.stringify(sandboxInput.inputMechanisms),
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
      learnings: {
        create: {
          title: `${scenario.title} learning`,
          body: scenario.learningGoal,
          suggestedAction: "Review this sandbox result as canonical build_intent.",
        },
      },
    },
  });
  revalidateSandboxSurfaces();
  redirect(`/sandbox?run=${run.id}`);
}

export async function startSandboxRunAction(formData: FormData) {
  const parsed = startSandboxRunSchema.parse(formObject(formData));
  const run = await runSandboxProtocol({
    mode: parsed.mode,
    title: parsed.title,
    description: parsed.description,
    targetMechanism: parsed.targetMechanism,
    inputMechanisms: listFromTextarea(parsed.inputMechanisms),
    inputActors: listFromTextarea(parsed.inputActors),
    inputNodes: listFromTextarea(parsed.inputNodes),
    theme: parsed.theme,
    counterTheme: parsed.counterTheme,
    exploitVector: parsed.exploitVector,
    observedFailure: parsed.observedFailure,
    proposedPatch: parsed.proposedPatch,
    proposedRevision: parsed.proposedRevision,
    graphEffectProposalId: parsed.graphEffectProposalId,
    rfcDraft: parsed.rfcDraft,
    openingState: parsed.openingState,
    firstShock: parsed.firstShock,
    escalation: parsed.escalation,
    counterpoint: parsed.counterpoint,
    collapseOrStabilization: parsed.collapseOrStabilization,
    lessons: listFromTextarea(parsed.lessons),
    constitutionalPatch: parsed.constitutionalPatch,
    proposedRfc: parsed.proposedRfc,
    worldlineKey: parsed.worldlineKey || undefined,
    worldlineHypothesis: parsed.worldlineHypothesis,
    responsibilityQuestion: parsed.responsibilityQuestion,
    sourceJiEventIds: listFromTextarea(parsed.sourceJiEventIds),
  });
  revalidateSandboxSurfaces();
  redirect(`/sandbox?run=${run.id}`);
}

export async function promoteSandboxLearningAction(formData: FormData) {
  const parsed = promoteLearningSchema.parse(formObject(formData));
  const learning = await prisma.fugueLearningProposal.findUniqueOrThrow({
    where: { id: parsed.learningId },
    include: { run: true },
  });
  const node = await prisma.crystalNode.create({
    data: {
      poolId: defaultPoolIds.canonical,
      title: learning.title,
      body: `${learning.body}\n\nSuggested action: ${learning.suggestedAction}\n\nSource sandbox run: ${learning.run.title}`,
      phase: "seed",
      sourceType: "fugue",
      sourceRef: `sandbox:${learning.runId}`,
      emotionHa: 4,
      publicness: 6,
      emotionCuriosity: 7,
    },
  });
  await prisma.phaseEvent.create({
    data: {
      nodeId: node.id,
      fromPhase: null,
      toPhase: "seed",
      reason: "Imported Crystal Sandbox learning proposal",
    },
  });
  await prisma.fugueLearningProposal.update({
    where: { id: parsed.learningId },
    data: {
      status: "imported",
      importedNodeId: node.id,
      reviewedAt: new Date(),
    },
  });
  revalidatePath("/");
  revalidateSandboxSurfaces();
  redirect(`/nodes/${node.id}`);
}

export async function archiveSandboxRunAction(formData: FormData) {
  const parsed = archiveRunSchema.parse(formObject(formData));
  const run = await archiveSandboxRun(parsed.runId, parsed.reason);
  revalidateSandboxSurfaces();
  redirect(`/sandbox?run=${run.id}`);
}
