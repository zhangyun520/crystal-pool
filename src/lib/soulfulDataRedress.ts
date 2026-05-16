import { createHash } from "node:crypto";
import { assessJiEventSoulfulData } from "./ethicalKernel";
import {
  jiBodyField,
  type JiEvent,
} from "./ji";
import { type SandboxRunInput } from "./sandbox";
import { type SoulfulDataDimension } from "./ethicalKernel";

export type SoulfulDataRedressStatus =
  | "not_required"
  | "draft"
  | "ready_for_review";

export type SoulfulDataRedressAction =
  | "restore_provenance"
  | "restore_context"
  | "clarify_consent"
  | "name_repair_owner"
  | "state_non_extractive_use"
  | "name_human_responsibility"
  | "dismiss_until_repaired";

export type SoulfulDataRedressPacket = {
  id: string;
  sourceJiEventId: string;
  sourceTitle: string;
  sourceProject: JiEvent["sourceProject"];
  generatedAt: string;
  status: SoulfulDataRedressStatus;
  score: number;
  weakSignals: Array<Pick<SoulfulDataDimension, "key" | "label" | "status" | "evidence">>;
  requestedActions: SoulfulDataRedressAction[];
  provenanceRequest?: string;
  contextRequest?: string;
  consentBoundaryRequest?: string;
  repairOwnerQuestion?: string;
  nonExtractiveUseStatement?: string;
  humanResponsibilityQuestion?: string;
  reviewQuestions: string[];
  acceptanceCheck: string;
  recommendedReviewPath: string;
  canonicalMutationAllowed: false;
};

export type SoulfulDataRedressManifest = {
  runId: string;
  mode: "soulful_data_redress_packets";
  generatedAt: string;
  packets: number;
  draft: number;
  readyForReview: number;
  notRequired: number;
  jiEventsWritten: number;
  sandboxRunsCreated: number;
  canonicalMutationAllowed: false;
};

export type SoulfulDataRedressRunSummary = {
  manifest: SoulfulDataRedressManifest;
  packets: SoulfulDataRedressPacket[];
  reportMarkdown: string;
  runDir?: string;
};

function stableHash(input: unknown) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function dimensionAction(key: SoulfulDataDimension["key"]): SoulfulDataRedressAction {
  const actions: Record<SoulfulDataDimension["key"], SoulfulDataRedressAction> = {
    provenance: "restore_provenance",
    livedContext: "restore_context",
    consentBoundary: "clarify_consent",
    traceability: "restore_provenance",
    repairability: "name_repair_owner",
    nonExtractiveUse: "state_non_extractive_use",
    humanResponsibility: "name_human_responsibility",
  };
  return actions[key];
}

function unique<T>(values: readonly T[]) {
  return Array.from(new Set(values));
}

function redressStatus(weakSignals: SoulfulDataDimension[]): SoulfulDataRedressStatus {
  if (weakSignals.length === 0) return "not_required";
  return weakSignals.some((signal) => signal.status === "fail")
    ? "draft"
    : "ready_for_review";
}

export function buildSoulfulDataRedressPacket({
  event,
  generatedAt = new Date().toISOString(),
}: {
  event: JiEvent & { status?: string };
  generatedAt?: string;
}): SoulfulDataRedressPacket {
  const assessment = assessJiEventSoulfulData(event);
  const weakSignals = assessment.weakSignals;
  const requestedActions = unique([
    ...weakSignals.map((signal) => dimensionAction(signal.key)),
    ...(weakSignals.length ? [] : ["dismiss_until_repaired" as const]),
  ]);
  const domain = jiBodyField(event.body, "Domain");
  const candidateKind = jiBodyField(event.body, "Candidate kind");
  const hash = stableHash({
    sourceJiEventId: event.id,
    weakSignals: weakSignals.map((signal) => signal.key),
  });

  return {
    id: `soulful-redress-${event.id}-${hash.slice(0, 10)}`,
    sourceJiEventId: event.id,
    sourceTitle: event.title,
    sourceProject: event.sourceProject,
    generatedAt,
    status: redressStatus(weakSignals),
    score: assessment.totalScore,
    weakSignals: weakSignals.map((signal) => ({
      key: signal.key,
      label: signal.label,
      status: signal.status,
      evidence: signal.evidence,
    })),
    requestedActions,
    provenanceRequest: weakSignals.some((signal) =>
      signal.key === "provenance" || signal.key === "traceability"
    )
      ? "Name the original source, occurrence time, stable ref, and why this event can be replayed later."
      : undefined,
    contextRequest: weakSignals.some((signal) => signal.key === "livedContext")
      ? "Restore enough lived or operational context for a reviewer to understand what would be lost by import, dismissal, or deferral."
      : undefined,
    consentBoundaryRequest: weakSignals.some((signal) => signal.key === "consentBoundary")
      ? "State whether the signal came from authenticated, private, desktop, or user-controlled context, and what may not be reused."
      : undefined,
    repairOwnerQuestion: weakSignals.some((signal) => signal.key === "repairability")
      ? "Who can correct, challenge, dismiss, or re-contextualize this event before canonical import?"
      : undefined,
    nonExtractiveUseStatement: weakSignals.some((signal) => signal.key === "nonExtractiveUse")
      ? "Explain how review uses this signal without turning another person's context into extractive training nutrition or authority."
      : undefined,
    humanResponsibilityQuestion: weakSignals.some((signal) => signal.key === "humanResponsibility")
      ? "Which human role is accountable for the next review action, and what action remains reversible?"
      : undefined,
    reviewQuestions: [
      `Should ${event.id} remain pending until its weak soulful-data signals are repaired?`,
      domain ? `Does ${domain} need a different review path for this source?` : undefined,
      candidateKind ? `Does ${candidateKind} justify sandbox/RFC review before import?` : undefined,
    ].filter((item): item is string => Boolean(item)),
    acceptanceCheck:
      "Before any canonical import, the packet names provenance, context, consent boundary, repair owner, non-extractive use, and human responsibility, or the event is dismissed/deferred.",
    recommendedReviewPath:
      weakSignals.length > 0
        ? "Review this packet in /ecosystem; prefer redress, sandbox, RFC, or dismissal before canonical import."
        : "No redress is required, but this event still cannot auto-promote into canonical state.",
    canonicalMutationAllowed: false,
  };
}

export function selectSoulfulDataRedressPackets({
  events,
  generatedAt = new Date().toISOString(),
  maxPackets = 8,
}: {
  events: Array<JiEvent & { status?: string; createdAt?: string }>;
  generatedAt?: string;
  maxPackets?: number;
}) {
  return events
    .map((event) => buildSoulfulDataRedressPacket({ event, generatedAt }))
    .filter((packet) => packet.status !== "not_required")
    .sort((left, right) => {
      const weakDelta = right.weakSignals.length - left.weakSignals.length;
      if (weakDelta !== 0) return weakDelta;
      return left.score - right.score;
    })
    .slice(0, maxPackets);
}

export function createSoulfulDataRedressManifest({
  runId,
  generatedAt,
  packets,
  jiEventsWritten = 0,
  sandboxRunsCreated = 0,
}: {
  runId: string;
  generatedAt: string;
  packets: SoulfulDataRedressPacket[];
  jiEventsWritten?: number;
  sandboxRunsCreated?: number;
}): SoulfulDataRedressManifest {
  return {
    runId,
    mode: "soulful_data_redress_packets",
    generatedAt,
    packets: packets.length,
    draft: packets.filter((packet) => packet.status === "draft").length,
    readyForReview: packets.filter((packet) => packet.status === "ready_for_review").length,
    notRequired: packets.filter((packet) => packet.status === "not_required").length,
    jiEventsWritten,
    sandboxRunsCreated,
    canonicalMutationAllowed: false,
  };
}

export function redressPacketToJiEvent({
  packet,
  runId,
}: {
  packet: SoulfulDataRedressPacket;
  runId: string;
}): JiEvent {
  return {
    id: `${packet.id}-${stableHash({ runId, packetId: packet.id }).slice(0, 8)}`,
    sourceProject: "crystal-pool",
    kind: "manual.note",
    title: `Soulful data redress: ${packet.sourceTitle}`,
    body: [
      "Domain: PHILOSOPHY_AESTHETICS",
      "Candidate kind: soulful_data_redress_packet",
      "Proposal kind: ETHICAL_INVARIANT_PROPOSAL",
      `Redress run: ${runId}`,
      `Redress packet: ${packet.id}`,
      `Source JiEvent: ${packet.sourceJiEventId}`,
      `Status: ${packet.status}`,
      `Score: ${packet.score}`,
      `Requested actions: ${packet.requestedActions.join(", ")}`,
      "",
      "Weak signals:",
      ...packet.weakSignals.map(
        (signal) => `- ${signal.label} (${signal.status}): ${signal.evidence}`,
      ),
      "",
      "Review questions:",
      ...packet.reviewQuestions.map((question) => `- ${question}`),
      "",
      `Acceptance check: ${packet.acceptanceCheck}`,
      "",
      "Boundary: this redress packet is review guidance only; it cannot promote canonical pool state, unlock AI mainline, upload anchors, or mutate external projects.",
    ].join("\n"),
    occurredAt: packet.generatedAt,
    refs: [
      { label: "source-ji-event", hash: packet.sourceJiEventId },
      { label: "redress-packet", hash: packet.id },
    ],
    suggestedPhase: "seed",
    ha: packet.weakSignals.length >= 3 ? 6 : 4,
  };
}

export function redressPacketToSandboxInput(
  packet: SoulfulDataRedressPacket,
  sourceJiEventId?: string,
): SandboxRunInput {
  return {
    mode: "FUGUE",
    title: `FUGUE: ${packet.sourceTitle} redress failure path`,
    description: `Soulful data redress rehearsal for ${packet.sourceJiEventId}.`,
    worldlineKey: "OTHERNESS_MIRROR",
    worldlineHypothesis:
      "A weak data signal can become extraction, projection, or false authority if redress happens after import instead of before it.",
    responsibilityQuestion:
      "What must be repaired before this signal can safely influence crystallization?",
    sourceJiEventIds: sourceJiEventId
      ? [packet.sourceJiEventId, sourceJiEventId]
      : [packet.sourceJiEventId],
    targetMechanism: "SoulfulDataAssessment",
    inputMechanisms: [
      "SoulfulDataAssessment",
      "JiEvent review gate",
      "redress packet",
    ],
    inputActors: ["data subject", "reviewer", "future maintainer"],
    exploitVector: packet.weakSignals
      .map((signal) => `${signal.label}: ${signal.evidence}`)
      .join(" | "),
    observedFailure:
      "The Pool imports a signal before provenance, consent, repair, and responsibility are clear.",
    proposedPatch: packet.acceptanceCheck,
  };
}

export function redressPacketToRfcDraft(packet: SoulfulDataRedressPacket) {
  return [
    `# Soulful Data Redress Packet: ${packet.sourceTitle}`,
    "",
    `- packet: ${packet.id}`,
    `- sourceJiEvent: ${packet.sourceJiEventId}`,
    `- sourceProject: ${packet.sourceProject}`,
    `- status: ${packet.status}`,
    `- score: ${packet.score}`,
    `- canonicalMutationAllowed: ${packet.canonicalMutationAllowed}`,
    "",
    "## Requested Actions",
    ...packet.requestedActions.map((action) => `- ${action}`),
    "",
    "## Weak Signals",
    ...packet.weakSignals.map(
      (signal) => `- ${signal.label} (${signal.status}): ${signal.evidence}`,
    ),
    "",
    "## Repair Questions",
    ...[
      packet.provenanceRequest,
      packet.contextRequest,
      packet.consentBoundaryRequest,
      packet.repairOwnerQuestion,
      packet.nonExtractiveUseStatement,
      packet.humanResponsibilityQuestion,
      ...packet.reviewQuestions,
    ]
      .filter(Boolean)
      .map((question) => `- ${question}`),
    "",
    "## Acceptance Check",
    packet.acceptanceCheck,
    "",
    "## Boundary",
    "This packet is local and review-gated. It does not create canonical nodes, unlock AI mainline, upload anchors, certify external data, or mutate external projects.",
  ].join("\n");
}

export function generateSoulfulDataRedressReport({
  manifest,
  packets,
}: {
  manifest: SoulfulDataRedressManifest;
  packets: SoulfulDataRedressPacket[];
}) {
  const lines = packets.map(
    (packet) =>
      `- ${packet.status.toUpperCase()} ${packet.id}: ${packet.sourceTitle} score=${packet.score} weak=${packet.weakSignals.length}`,
  );

  return [
    "# Crystal Pool Soulful Data Redress Packets",
    "",
    `- runId: ${manifest.runId}`,
    `- generatedAt: ${manifest.generatedAt}`,
    `- packets: ${manifest.packets}`,
    `- draft: ${manifest.draft}`,
    `- readyForReview: ${manifest.readyForReview}`,
    `- jiEventsWritten: ${manifest.jiEventsWritten}`,
    `- sandboxRunsCreated: ${manifest.sandboxRunsCreated}`,
    `- canonicalMutationAllowed: ${manifest.canonicalMutationAllowed}`,
    "",
    "## Packets",
    ...(lines.length ? lines : ["- none"]),
    "",
    "## Boundary",
    "Redress packets are review guidance only. They may generate JiEvents, Fugue rehearsals, and RFC drafts, but they must not promote canonical pool state.",
  ].join("\n");
}
