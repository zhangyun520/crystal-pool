import { createHash } from "node:crypto";
import { type JiEvent, type JiProposalLaneKind } from "./ji";
import { type SandboxMode, type SandboxRunInput } from "./sandbox";
import { type WorldlineKey } from "./worldline";

export const repairQueueSourceKinds = [
  "constitution_failure",
  "constitution_warning",
  "aesthetic_smoke_failure",
  "ai_cycle_failure",
  "ai_decision_failure",
  "ji_inbox_error",
  "corpus_warning",
  "sandbox_learning_followup",
] as const;

export type RepairQueueSourceKind = (typeof repairQueueSourceKinds)[number];
export type RepairQueueSeverity = "critical" | "important" | "watch";
export type RepairQueueStatus = "pass" | "watch" | "fail";

export type RepairQueueContext = {
  generatedAt: string;
  constitutionStatus: "pass" | "warn" | "fail";
  constitutionWarn: number;
  constitutionFail: number;
  aestheticSmokeStatus: "pass" | "fail" | "missing";
  aestheticSmokeFailed: number;
  aiFailedOrSkippedCycles: number;
  aiInvalidDecisions: number;
  jiInboxErrors: number;
  corpusWarnings: number;
  sandboxProposedLearnings: number;
};

export type RepairQueueItem = {
  id: string;
  sourceKind: RepairQueueSourceKind;
  title: string;
  detail: string;
  severity: RepairQueueSeverity;
  sourceCount: number;
  proposalKind: JiProposalLaneKind;
  sandboxMode: SandboxMode;
  worldlineKey: WorldlineKey;
  reviewPath: string;
  acceptanceCheck: string;
  suggestedArtifacts: string[];
  evidence: string[];
};

export type RepairQueueManifest = {
  runId: string;
  mode: "hopepunk_repair_queue";
  generatedAt: string;
  status: RepairQueueStatus;
  items: number;
  critical: number;
  important: number;
  watch: number;
  jiEventsWritten: number;
  sandboxRunsCreated: number;
  canonicalMutationAllowed: false;
};

export type RepairQueueRunSummary = {
  manifest: RepairQueueManifest;
  context: RepairQueueContext;
  items: RepairQueueItem[];
  reportMarkdown: string;
  runDir?: string;
};

function stableHash(input: unknown) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function itemId(input: Omit<RepairQueueItem, "id">) {
  const hash = stableHash({
    sourceKind: input.sourceKind,
    severity: input.severity,
    sourceCount: input.sourceCount,
    title: input.title,
  });
  return `repair-${input.sourceKind}-${hash.slice(0, 12)}`;
}

function repairItem(input: Omit<RepairQueueItem, "id">): RepairQueueItem {
  return {
    ...input,
    id: itemId(input),
  };
}

export function buildRepairQueueItems(
  context: RepairQueueContext,
): RepairQueueItem[] {
  const items: RepairQueueItem[] = [];

  if (context.constitutionFail > 0 || context.constitutionStatus === "fail") {
    items.push(
      repairItem({
        sourceKind: "constitution_failure",
        title: "Constitution failure needs repair before more autonomy",
        detail:
          "One or more ethical invariants failed. The repair path should name the violated boundary, affected surface, rollback step, and test that proves restoration.",
        severity: "critical",
        sourceCount: context.constitutionFail || 1,
        proposalKind: "RFC_DRAFT_PROPOSAL",
        sandboxMode: "SONATA",
        worldlineKey: "HOPEPUNK_REPAIR",
        reviewPath: "Review as constitution repair RFC and blocking engineering task.",
        acceptanceCheck:
          "constitution:check returns pass, and the repair note explains why the invariant cannot silently fail again.",
        suggestedArtifacts: [
          "constitution repair RFC",
          "guardrail regression test",
          "rollback note",
        ],
        evidence: [
          `constitutionStatus=${context.constitutionStatus}`,
          `constitutionFail=${context.constitutionFail}`,
        ],
      }),
    );
  }

  if (context.constitutionWarn > 0 || context.constitutionStatus === "warn") {
    items.push(
      repairItem({
        sourceKind: "constitution_warning",
        title: "Constitution warning should become bounded repair work",
        detail:
          "Warnings are not failures yet, but hopepunk repair treats weak boundaries as early obligations rather than background dashboard noise.",
        severity: "important",
        sourceCount: context.constitutionWarn || 1,
        proposalKind: "ETHICAL_INVARIANT_PROPOSAL",
        sandboxMode: "SONATA",
        worldlineKey: "HOPEPUNK_REPAIR",
        reviewPath: "Review as ethical invariant refinement or documented boundary.",
        acceptanceCheck:
          "The warning is either resolved by a check, accepted as a documented boundary, or converted into an explicit follow-up task.",
        suggestedArtifacts: [
          "ethical invariant note",
          "boundary documentation",
          "review decision log",
        ],
        evidence: [
          `constitutionStatus=${context.constitutionStatus}`,
          `constitutionWarn=${context.constitutionWarn}`,
        ],
      }),
    );
  }

  if (
    context.aestheticSmokeStatus === "fail" ||
    context.aestheticSmokeFailed > 0
  ) {
    items.push(
      repairItem({
        sourceKind: "aesthetic_smoke_failure",
        title: "Aesthetic smoke failure needs visible UI repair",
        detail:
          "A core operation surface failed local screenshot smoke. Beauty here means legible operation under desktop and mobile pressure, not decorative polish.",
        severity: "important",
        sourceCount: context.aestheticSmokeFailed || 1,
        proposalKind: "AESTHETIC_SURFACE_PROPOSAL",
        sandboxMode: "SONATA",
        worldlineKey: "HOPEPUNK_REPAIR",
        reviewPath: "Review as route-level UI repair and screenshot evidence task.",
        acceptanceCheck:
          "ui:aesthetic-smoke passes and the repaired surface keeps its domain-specific operational signal visible.",
        suggestedArtifacts: [
          "route screenshot evidence",
          "visual regression note",
          "responsive overflow fix",
        ],
        evidence: [
          `aestheticSmokeStatus=${context.aestheticSmokeStatus}`,
          `aestheticSmokeFailed=${context.aestheticSmokeFailed}`,
        ],
      }),
    );
  }

  if (context.aiFailedOrSkippedCycles > 0) {
    items.push(
      repairItem({
        sourceKind: "ai_cycle_failure",
        title: "AI cycle failures need non-sovereign repair review",
        detail:
          "Failed or skipped AI cycles should not become shame, silence, or hidden authority. They should become traceable repair work while AI mainline remains locked.",
        severity: "important",
        sourceCount: context.aiFailedOrSkippedCycles,
        proposalKind: "RFC_DRAFT_PROPOSAL",
        sandboxMode: "SONATA",
        worldlineKey: "HOPEPUNK_REPAIR",
        reviewPath: "Review as AI Pool repair RFC and responsibility maturity evidence.",
        acceptanceCheck:
          "The failure reason is grouped, reversible next action is named, and no AI permission is expanded automatically.",
        suggestedArtifacts: [
          "failed-cycle triage note",
          "AI director dry-run proposal",
          "maturity evidence update",
        ],
        evidence: [`aiFailedOrSkippedCycles=${context.aiFailedOrSkippedCycles}`],
      }),
    );
  }

  if (context.aiInvalidDecisions > 0) {
    items.push(
      repairItem({
        sourceKind: "ai_decision_failure",
        title: "Invalid AI decisions need repair before trust increases",
        detail:
          "Invalid or failed AI decisions are direct maturity evidence. The repair queue must preserve traceability, reversibility, and non-sovereignty.",
        severity: "critical",
        sourceCount: context.aiInvalidDecisions,
        proposalKind: "ETHICAL_INVARIANT_PROPOSAL",
        sandboxMode: "SONATA",
        worldlineKey: "HOPEPUNK_REPAIR",
        reviewPath: "Review as AI non-sovereignty invariant and permission-wall test.",
        acceptanceCheck:
          "Invalid decisions have clear reasons and cannot raise AI authority without human review.",
        suggestedArtifacts: [
          "invalid decision grouping",
          "permission-wall regression test",
          "repair capacity note",
        ],
        evidence: [`aiInvalidDecisions=${context.aiInvalidDecisions}`],
      }),
    );
  }

  if (context.jiInboxErrors > 0) {
    items.push(
      repairItem({
        sourceKind: "ji_inbox_error",
        title: "JiEvent inbox errors need intake repair",
        detail:
          "Malformed ecosystem trigger points break the mother-pool intake path. The fix should protect reviewability without letting bad data disappear.",
        severity: "important",
        sourceCount: context.jiInboxErrors,
        proposalKind: "ENGINEERING_TASK_PROPOSAL",
        sandboxMode: "SONATA",
        worldlineKey: "HOPEPUNK_REPAIR",
        reviewPath: "Review as JiEvent diagnostics and importer hardening task.",
        acceptanceCheck:
          "Invalid lines produce actionable diagnostics, valid lines still import, and no external project mutates canonical state.",
        suggestedArtifacts: [
          "inbox diagnostic report",
          "invalid fixture",
          "importer regression test",
        ],
        evidence: [`jiInboxErrors=${context.jiInboxErrors}`],
      }),
    );
  }

  if (context.corpusWarnings > 0) {
    items.push(
      repairItem({
        sourceKind: "corpus_warning",
        title: "Corpus warnings need soulful-data repair review",
        detail:
          "Corpus warnings can indicate weak provenance, duplicated residue, or missing repair context. They should become review signals before crystallization.",
        severity: "watch",
        sourceCount: context.corpusWarnings,
        proposalKind: "OBSERVATION_REVIEW",
        sandboxMode: "SONATA",
        worldlineKey: "HOPEPUNK_REPAIR",
        reviewPath: "Review as soulful-data intake and corpus marker improvement.",
        acceptanceCheck:
          "Warnings retain provenance and repair path notes before any canonical import.",
        suggestedArtifacts: [
          "soulful-data intake checklist",
          "corpus warning fixture",
          "reviewer copy update",
        ],
        evidence: [`corpusWarnings=${context.corpusWarnings}`],
      }),
    );
  }

  if (context.sandboxProposedLearnings > 0) {
    items.push(
      repairItem({
        sourceKind: "sandbox_learning_followup",
        title: "Sandbox learning proposals need repair follow-through",
        detail:
          "Proposed sandbox learnings are unfinished repair obligations. They should stay review-gated, but the queue must make the next human decision visible.",
        severity: "watch",
        sourceCount: context.sandboxProposedLearnings,
        proposalKind: "RFC_DRAFT_PROPOSAL",
        sandboxMode: "SONATA",
        worldlineKey: "HOPEPUNK_REPAIR",
        reviewPath: "Review as sandbox lesson follow-up RFC before canonical import.",
        acceptanceCheck:
          "Each proposed learning is imported, dismissed, or converted into an RFC without automatic promotion.",
        suggestedArtifacts: [
          "sandbox lesson review list",
          "RFC follow-up draft",
          "learning promotion decision log",
        ],
        evidence: [
          `sandboxProposedLearnings=${context.sandboxProposedLearnings}`,
        ],
      }),
    );
  }

  return items.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

const severityRank: Record<RepairQueueSeverity, number> = {
  critical: 0,
  important: 1,
  watch: 2,
};

export function createRepairQueueManifest({
  runId,
  generatedAt,
  items,
  jiEventsWritten = 0,
  sandboxRunsCreated = 0,
}: {
  runId: string;
  generatedAt: string;
  items: RepairQueueItem[];
  jiEventsWritten?: number;
  sandboxRunsCreated?: number;
}): RepairQueueManifest {
  const critical = items.filter((item) => item.severity === "critical").length;
  const important = items.filter((item) => item.severity === "important").length;
  const watch = items.filter((item) => item.severity === "watch").length;
  const status: RepairQueueStatus = critical > 0 ? "fail" : items.length > 0 ? "watch" : "pass";

  return {
    runId,
    mode: "hopepunk_repair_queue",
    generatedAt,
    status,
    items: items.length,
    critical,
    important,
    watch,
    jiEventsWritten,
    sandboxRunsCreated,
    canonicalMutationAllowed: false,
  };
}

export function repairItemToJiEvent({
  item,
  runId,
  occurredAt = new Date().toISOString(),
}: {
  item: RepairQueueItem;
  runId: string;
  occurredAt?: string;
}): JiEvent {
  const hash = stableHash({
    sourceKind: item.sourceKind,
    sourceCount: item.sourceCount,
    severity: item.severity,
    title: item.title,
  });
  return {
    id: `repair-queue-${hash.slice(0, 16)}`,
    sourceProject: "crystal-pool",
    kind: "manual.note",
    title: `Repair queue: ${item.title}`,
    body: [
      "Domain: PHILOSOPHY_AESTHETICS",
      "Candidate kind: hopepunk_repair_signal",
      `Proposal kind: ${item.proposalKind}`,
      `Repair run: ${runId}`,
      `Repair item: ${item.id}`,
      `Repair source: ${item.sourceKind}`,
      `Severity: ${item.severity}`,
      `Source count: ${item.sourceCount}`,
      `Review path: ${item.reviewPath}`,
      `Acceptance check: ${item.acceptanceCheck}`,
      "Suggested artifacts:",
      ...item.suggestedArtifacts.map((artifact) => `- ${artifact}`),
      "",
      "Repair detail:",
      item.detail,
      "",
      "Current evidence:",
      ...item.evidence.map((evidence) => `- ${evidence}`),
      "",
      "Boundary: this repair proposal is observe + propose only; it cannot promote canonical pool state, unlock AI mainline, upload anchors, or mutate external projects.",
    ].join("\n"),
    occurredAt,
    refs: [
      { label: "repair-item", hash: item.id },
      { label: "repair-source", hash: item.sourceKind },
      { label: "worldline", hash: item.worldlineKey },
    ],
    suggestedPhase: item.severity === "critical" ? "seed" : "liquid",
    ha: item.severity === "critical" ? 7 : item.severity === "important" ? 5 : 3,
  };
}

export function repairItemToSandboxInput(
  item: RepairQueueItem,
  sourceJiEventId?: string,
): SandboxRunInput {
  return {
    mode: item.sandboxMode,
    title: `${item.sandboxMode}: ${item.title}`,
    description: `Hopepunk repair rehearsal for ${item.id}.`,
    worldlineKey: item.worldlineKey,
    worldlineHypothesis:
      "Hope becomes engineering only when failure produces traceable, bounded, reviewable repair.",
    responsibilityQuestion: item.acceptanceCheck,
    sourceJiEventIds: sourceJiEventId ? [sourceJiEventId] : [],
    inputMechanisms: [
      item.sourceKind,
      item.proposalKind,
      "Crystal Pool review gate",
    ],
    inputActors: ["maintainer", "reviewer", "repair steward"],
    theme: item.title,
    counterTheme: item.detail,
    proposedRevision: item.acceptanceCheck,
    rfcDraft: repairItemToRfcDraft(item),
  };
}

export function repairItemToRfcDraft(item: RepairQueueItem) {
  return [
    `# Repair RFC Draft: ${item.title}`,
    "",
    `- repairItem: ${item.id}`,
    `- sourceKind: ${item.sourceKind}`,
    `- severity: ${item.severity}`,
    `- proposalKind: ${item.proposalKind}`,
    `- sandbox: ${item.sandboxMode} + ${item.worldlineKey}`,
    "",
    "## Detail",
    item.detail,
    "",
    "## Evidence",
    ...item.evidence.map((entry) => `- ${entry}`),
    "",
    "## Suggested Artifacts",
    ...item.suggestedArtifacts.map((artifact) => `- ${artifact}`),
    "",
    "## Acceptance Check",
    item.acceptanceCheck,
    "",
    "## Boundary",
    "This repair draft is local and review-gated. It does not create canonical nodes, unlock AI mainline, upload anchors, publish artifacts, or change governance by itself.",
  ].join("\n");
}

export function generateRepairQueueReport({
  manifest,
  context,
  items,
}: {
  manifest: RepairQueueManifest;
  context: RepairQueueContext;
  items: RepairQueueItem[];
}) {
  const itemLines = items.length
    ? items.map(
        (item) =>
          `- ${item.severity.toUpperCase()} ${item.id} [${item.sourceKind}/${item.proposalKind}] ${item.title}`,
      )
    : ["- No active repair items. The queue is still running as a readiness mechanism."];

  return [
    "# Crystal Pool Hopepunk Repair Queue",
    "",
    `- runId: ${manifest.runId}`,
    `- generatedAt: ${manifest.generatedAt}`,
    `- status: ${manifest.status}`,
    `- items: ${manifest.items}`,
    `- jiEventsWritten: ${manifest.jiEventsWritten}`,
    `- sandboxRunsCreated: ${manifest.sandboxRunsCreated}`,
    `- canonicalMutationAllowed: ${manifest.canonicalMutationAllowed}`,
    "",
    "## Repair Items",
    ...itemLines,
    "",
    "## Source Snapshot",
    `- constitutionStatus: ${context.constitutionStatus}`,
    `- constitutionWarn: ${context.constitutionWarn}`,
    `- constitutionFail: ${context.constitutionFail}`,
    `- aestheticSmokeStatus: ${context.aestheticSmokeStatus}`,
    `- aestheticSmokeFailed: ${context.aestheticSmokeFailed}`,
    `- aiFailedOrSkippedCycles: ${context.aiFailedOrSkippedCycles}`,
    `- aiInvalidDecisions: ${context.aiInvalidDecisions}`,
    `- jiInboxErrors: ${context.jiInboxErrors}`,
    `- corpusWarnings: ${context.corpusWarnings}`,
    `- sandboxProposedLearnings: ${context.sandboxProposedLearnings}`,
    "",
    "## Boundary",
    "This queue turns failures and warnings into reviewable repair work. It does not promote canonical pool state, unlock AI mainline, upload anchors, publish artifacts, or mutate external projects.",
  ].join("\n");
}
