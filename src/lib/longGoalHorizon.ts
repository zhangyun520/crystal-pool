import { createHash } from "node:crypto";
import {
  type JiEvent,
  type JiProposalLaneKind,
} from "./ji";
import {
  type SandboxMode,
  type SandboxRunInput,
} from "./sandbox";
import { type WorldlineKey } from "./worldline";
import {
  longGoalObjective,
  type LongGoalEvidenceStatus,
} from "./longGoalEvidence";

export type LongGoalHorizonCategory =
  | "mechanism"
  | "interface"
  | "protocol"
  | "article"
  | "test"
  | "governance_boundary";

export type LongGoalHorizonPillar =
  | "HOPEPUNK_REPAIR"
  | "HUMANISM"
  | "AI_NON_SOVEREIGNTY"
  | "SOULFUL_DATA"
  | "RELIABILITY_ETHICS"
  | "OPEN_CLOSED_DUAL_CORE"
  | "WORLDLINE_SANDBOX"
  | "ARTISTIC_OPERATION_SURFACE";

export type LongGoalHorizonPriority = "near" | "next" | "watch";

export type LongGoalHorizonContext = {
  generatedAt: string;
  evidenceStatus: LongGoalEvidenceStatus | "missing";
  goalCoverageScore: number;
  openGoalItems: number;
  pendingJiEvents: number;
  worldlineCoveragePercent: number;
  forkCompatibilityStatus: "pass" | "warn" | "fail" | "missing";
  aestheticSmokeStatus: "pass" | "fail" | "missing";
};

export type LongGoalHorizonProposal = {
  id: string;
  pillar: LongGoalHorizonPillar;
  category: LongGoalHorizonCategory;
  title: string;
  proposalKind: JiProposalLaneKind;
  priority: LongGoalHorizonPriority;
  rationale: string;
  nextQuestion: string;
  suggestedArtifacts: string[];
  acceptanceCheck: string;
  reviewPath: string;
  sandboxMode: SandboxMode;
  worldlineKey: WorldlineKey;
};

export type LongGoalHorizonManifest = {
  runId: string;
  mode: "long_goal_horizon";
  generatedAt: string;
  status: "pass" | "watch";
  proposals: number;
  near: number;
  next: number;
  watch: number;
  jiEventsWritten: number;
  sandboxRunsCreated: number;
  canonicalMutationAllowed: false;
};

export type LongGoalHorizonRunSummary = {
  manifest: LongGoalHorizonManifest;
  context: LongGoalHorizonContext;
  proposals: LongGoalHorizonProposal[];
  reportMarkdown: string;
  runDir?: string;
};

function stableHash(input: unknown) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function buildLongGoalHorizonProposals(
  context: LongGoalHorizonContext,
): LongGoalHorizonProposal[] {
  const stabilizeFirst =
    context.evidenceStatus !== "pass" ||
    context.goalCoverageScore < 100 ||
    context.openGoalItems > 0;

  if (stabilizeFirst) {
    return [
      {
        id: "LG-HZ-000",
        pillar: "RELIABILITY_ETHICS",
        category: "test",
        title: "Restore long-goal evidence before opening new horizons",
        proposalKind: "ENGINEERING_TASK_PROPOSAL",
        priority: "near",
        rationale:
          "Exploration should continue from a trustworthy floor. If the evidence bundle is weak, the next horizon is repair, not novelty.",
        nextQuestion:
          "Which evidence item failed, and what local command or review artifact restores it without canonical mutation?",
        suggestedArtifacts: [
          "failed evidence item repair task",
          "updated local report",
          "regression test",
        ],
        acceptanceCheck:
          "long-goal:evidence returns pass before any new horizon proposal is promoted for review.",
        reviewPath: "Review as reliability task and repair queue entry.",
        sandboxMode: "SONATA",
        worldlineKey: "HOPEPUNK_REPAIR",
      },
    ];
  }

  return [
    {
      id: "LG-HZ-001",
      pillar: "HUMANISM",
      category: "interface",
      title: "Reviewer burden and humane triage cockpit",
      proposalKind: "AESTHETIC_SURFACE_PROPOSAL",
      priority: "near",
      rationale:
        "Review gates are ethical only when humans can actually use them without ceremonial fatigue.",
      nextQuestion:
        "How can /ecosystem show reviewer burden, decision cost, reversibility, and next action without turning responsibility into bureaucracy?",
      suggestedArtifacts: [
        "reviewer workload counters",
        "decision cost copy",
        "bulk triage affordance sketch",
      ],
      acceptanceCheck:
        "A reviewer can distinguish urgent repair, ethical invariant, design, RFC, essay, and observation work within one scan.",
      reviewPath: "Review as operation-surface design and e2e smoke task.",
      sandboxMode: "SYMPHONY",
      worldlineKey: "STELLAR_COMMONWEALTH",
    },
    {
      id: "LG-HZ-002",
      pillar: "SOULFUL_DATA",
      category: "protocol",
      title: "Soulful data redress packet",
      proposalKind: "ETHICAL_INVARIANT_PROPOSAL",
      priority: "near",
      rationale:
        "Soulful data should include a practical path for correction, consent boundary updates, context restoration, and removal requests.",
      nextQuestion:
        "What minimum redress packet lets a person challenge or repair a data signal before it feeds crystallization?",
      suggestedArtifacts: [
        "redress packet schema",
        "JiEvent review copy",
        "soulful data fixture with weak provenance",
      ],
      acceptanceCheck:
        "A low-provenance JiEvent can name repair owner, consent boundary, and possible dismissal before any canonical import.",
      reviewPath: "Review as protocol and soulful-data invariant extension.",
      sandboxMode: "FUGUE",
      worldlineKey: "OTHERNESS_MIRROR",
    },
    {
      id: "LG-HZ-003",
      pillar: "AI_NON_SOVEREIGNTY",
      category: "mechanism",
      title: "AI self-limitation and refusal diary",
      proposalKind: "RFC_DRAFT_PROPOSAL",
      priority: "near",
      rationale:
        "AI non-sovereignty is stronger when the AI can record why it refused to mutate, defer, or overclaim.",
      nextQuestion:
        "How should AI director cycles preserve self-limitation evidence without gaining extra authority from that virtue?",
      suggestedArtifacts: [
        "AI self-limitation event shape",
        "dry-run refusal report",
        "permission-wall regression test",
      ],
      acceptanceCheck:
        "AI can produce a refusal/self-limitation record, but the record cannot unlock mainline or promote canonical state.",
      reviewPath: "Review as AI Pool RFC and responsibility maturity signal.",
      sandboxMode: "SONATA",
      worldlineKey: "AI_DIRECTED_WORLD",
    },
    {
      id: "LG-HZ-004",
      pillar: "HOPEPUNK_REPAIR",
      category: "governance_boundary",
      title: "Repair cadence without moral coercion",
      proposalKind: "RFC_DRAFT_PROPOSAL",
      priority: "next",
      rationale:
        "Hopepunk repair needs rhythm, but it must not become endless emotional labor demanded from maintainers.",
      nextQuestion:
        "What cadence turns repair queue items into bounded review sessions with rest, deferral, and shared responsibility?",
      suggestedArtifacts: [
        "repair cadence RFC",
        "deferral status",
        "burnout boundary copy",
      ],
      acceptanceCheck:
        "Repair items can be accepted, deferred, delegated, or dismissed with explicit cost and next review time.",
      reviewPath: "Review as governance workflow and hopepunk repair policy.",
      sandboxMode: "SONATA",
      worldlineKey: "HOPEPUNK_REPAIR",
    },
    {
      id: "LG-HZ-005",
      pillar: "ARTISTIC_OPERATION_SURFACE",
      category: "interface",
      title: "Aesthetic grammar tokens for operational beauty",
      proposalKind: "AESTHETIC_SURFACE_PROPOSAL",
      priority: "next",
      rationale:
        "The UI should stay artful without becoming arbitrary. A small grammar can keep future surfaces coherent.",
      nextQuestion:
        "Which visual tokens express pool, proof, repair, worldline, and flow while preserving dense operational legibility?",
      suggestedArtifacts: [
        "visual token note",
        "route-specific design checklist",
        "screenshot smoke assertions",
      ],
      acceptanceCheck:
        "Core routes can explain their dominant visual grammar through reusable tokens and screenshot evidence.",
      reviewPath: "Review as design-system proposal and browser smoke extension.",
      sandboxMode: "SONATA",
      worldlineKey: "RETURN_HOME",
    },
    {
      id: "LG-HZ-006",
      pillar: "OPEN_CLOSED_DUAL_CORE",
      category: "governance_boundary",
      title: "Fork dialogue packet",
      proposalKind: "ETHICAL_INVARIANT_PROPOSAL",
      priority: "next",
      rationale:
        "Compatibility checks classify evidence, but living forks need dialogue paths before conflicts harden into fork war.",
      nextQuestion:
        "What packet lets a fork declare divergence, request compatibility review, or reject continuity without moral theater?",
      suggestedArtifacts: [
        "fork dialogue template",
        "constitution diff checklist",
        "interoperability review note",
      ],
      acceptanceCheck:
        "A fork can submit a review packet that preserves exit, critique, and proof without automatic certification.",
      reviewPath: "Review as governance boundary and FORK_DRIFT rehearsal.",
      sandboxMode: "SYMPHONY",
      worldlineKey: "FORK_DRIFT",
    },
    {
      id: "LG-HZ-007",
      pillar: "WORLDLINE_SANDBOX",
      category: "article",
      title: "Worldline libretto for public discussion",
      proposalKind: "ESSAY_NOTE_PROPOSAL",
      priority: "watch",
      rationale:
        "The worldline system needs language that invites contributors without freezing into doctrine.",
      nextQuestion:
        "How can the booklet explain Otherness Mirror, Return Home, Dao Governance, Hopepunk Repair, Fork Drift, and AI Directed World as engineering rehearsals?",
      suggestedArtifacts: [
        "booklet section draft",
        "AI discussion brief update",
        "worldline glossary",
      ],
      acceptanceCheck:
        "A reader can understand each worldline as a testable rehearsal protocol, not fandom lore or religion.",
      reviewPath: "Review as essay note and public-facing philosophy packet.",
      sandboxMode: "SYMPHONY",
      worldlineKey: "OTHERNESS_MIRROR",
    },
  ];
}

export function createLongGoalHorizonManifest({
  runId,
  generatedAt,
  proposals,
  jiEventsWritten = 0,
  sandboxRunsCreated = 0,
}: {
  runId: string;
  generatedAt: string;
  proposals: LongGoalHorizonProposal[];
  jiEventsWritten?: number;
  sandboxRunsCreated?: number;
}): LongGoalHorizonManifest {
  return {
    runId,
    mode: "long_goal_horizon",
    generatedAt,
    status: proposals.length > 0 ? "watch" : "pass",
    proposals: proposals.length,
    near: proposals.filter((proposal) => proposal.priority === "near").length,
    next: proposals.filter((proposal) => proposal.priority === "next").length,
    watch: proposals.filter((proposal) => proposal.priority === "watch").length,
    jiEventsWritten,
    sandboxRunsCreated,
    canonicalMutationAllowed: false,
  };
}

export function longGoalHorizonProposalToJiEvent({
  proposal,
  runId,
  occurredAt = new Date().toISOString(),
}: {
  proposal: LongGoalHorizonProposal;
  runId: string;
  occurredAt?: string;
}): JiEvent {
  const hash = stableHash({ runId, proposalId: proposal.id });
  return {
    id: `long-goal-horizon-${proposal.id.toLowerCase()}-${hash.slice(0, 12)}`,
    sourceProject: "crystal-pool",
    kind: "manual.note",
    title: `Long-goal horizon: ${proposal.title}`,
    body: [
      "Domain: PHILOSOPHY_AESTHETICS",
      "Candidate kind: next_horizon_signal",
      `Proposal kind: ${proposal.proposalKind}`,
      `Horizon run: ${runId}`,
      `Horizon item: ${proposal.id}`,
      `Pillar: ${proposal.pillar}`,
      `Category: ${proposal.category}`,
      `Priority: ${proposal.priority}`,
      `Review path: ${proposal.reviewPath}`,
      `Acceptance check: ${proposal.acceptanceCheck}`,
      "",
      "Rationale:",
      proposal.rationale,
      "",
      "Next question:",
      proposal.nextQuestion,
      "",
      "Suggested artifacts:",
      ...proposal.suggestedArtifacts.map((artifact) => `- ${artifact}`),
      "",
      "Boundary: this horizon proposal is observe + propose only; it cannot promote canonical pool state, unlock AI mainline, certify forks, or mutate external projects.",
    ].join("\n"),
    occurredAt,
    refs: [
      { label: "long-goal-objective", hash: stableHash(longGoalObjective) },
      { label: "horizon-item", hash: proposal.id },
      { label: "worldline", hash: proposal.worldlineKey },
    ],
    suggestedPhase: proposal.priority === "near" ? "seed" : "liquid",
    ha: proposal.priority === "near" ? 5 : proposal.priority === "next" ? 4 : 3,
  };
}

export function longGoalHorizonProposalToSandboxInput(
  proposal: LongGoalHorizonProposal,
  sourceJiEventId?: string,
): SandboxRunInput {
  const base = {
    mode: proposal.sandboxMode,
    title: `${proposal.sandboxMode}: ${proposal.title}`,
    description: `Long-goal horizon rehearsal for ${proposal.id}.`,
    worldlineKey: proposal.worldlineKey,
    worldlineHypothesis: proposal.rationale,
    responsibilityQuestion: proposal.nextQuestion,
    sourceJiEventIds: sourceJiEventId ? [sourceJiEventId] : [],
    inputMechanisms: [
      proposal.category,
      proposal.proposalKind,
      "Crystal Pool review gate",
    ],
    inputActors: ["reviewer", "maintainer", "future contributor"],
  } satisfies Partial<SandboxRunInput>;

  if (proposal.sandboxMode === "FUGUE") {
    return {
      ...base,
      mode: "FUGUE",
      exploitVector: proposal.rationale,
      observedFailure: `If ${proposal.title} is ignored: ${proposal.nextQuestion}`,
      proposedPatch: proposal.acceptanceCheck,
    };
  }

  if (proposal.sandboxMode === "SONATA") {
    return {
      ...base,
      mode: "SONATA",
      theme: proposal.rationale,
      counterTheme: proposal.nextQuestion,
      proposedRevision: proposal.acceptanceCheck,
      rfcDraft: longGoalHorizonProposalToRfcDraft(proposal),
    };
  }

  return {
    ...base,
    mode: "SYMPHONY",
    openingState:
      "Crystal Pool has a green evidence bundle, but long-term philosophy and aesthetics must keep evolving through reviewable horizons.",
    firstShock: proposal.nextQuestion,
    escalation: proposal.rationale,
    counterpoint:
      "Exploration should generate artifacts without bypassing review or turning green checks into complacency.",
    collapseOrStabilization: proposal.acceptanceCheck,
    lessons: [
      proposal.rationale,
      "A green evidence bundle is a platform for the next question, not a final doctrine.",
    ],
    constitutionalPatch: proposal.acceptanceCheck,
  };
}

export function longGoalHorizonProposalToRfcDraft(
  proposal: LongGoalHorizonProposal,
) {
  return [
    `# Horizon RFC Draft: ${proposal.title}`,
    "",
    `- horizonItem: ${proposal.id}`,
    `- pillar: ${proposal.pillar}`,
    `- category: ${proposal.category}`,
    `- priority: ${proposal.priority}`,
    `- proposalKind: ${proposal.proposalKind}`,
    `- sandbox: ${proposal.sandboxMode} + ${proposal.worldlineKey}`,
    "",
    "## Rationale",
    proposal.rationale,
    "",
    "## Next Question",
    proposal.nextQuestion,
    "",
    "## Suggested Artifacts",
    ...proposal.suggestedArtifacts.map((artifact) => `- ${artifact}`),
    "",
    "## Acceptance Check",
    proposal.acceptanceCheck,
    "",
    "## Boundary",
    "This horizon draft is local and review-gated. It does not create canonical nodes, unlock AI mainline, certify forks, upload anchors, or change governance by itself.",
  ].join("\n");
}

export function generateLongGoalHorizonReport({
  manifest,
  context,
  proposals,
}: {
  manifest: LongGoalHorizonManifest;
  context: LongGoalHorizonContext;
  proposals: LongGoalHorizonProposal[];
}) {
  const proposalLines = proposals.map(
    (proposal) =>
      `- ${proposal.priority.toUpperCase()} ${proposal.id} [${proposal.category}/${proposal.proposalKind}] ${proposal.title}`,
  );

  return [
    "# Crystal Pool Long Goal Horizon",
    "",
    `- runId: ${manifest.runId}`,
    `- generatedAt: ${manifest.generatedAt}`,
    `- status: ${manifest.status}`,
    `- proposals: ${manifest.proposals}`,
    `- near: ${manifest.near}`,
    `- next: ${manifest.next}`,
    `- watch: ${manifest.watch}`,
    `- jiEventsWritten: ${manifest.jiEventsWritten}`,
    `- sandboxRunsCreated: ${manifest.sandboxRunsCreated}`,
    `- canonicalMutationAllowed: ${manifest.canonicalMutationAllowed}`,
    "",
    "## Context",
    `- evidenceStatus: ${context.evidenceStatus}`,
    `- goalCoverageScore: ${context.goalCoverageScore}`,
    `- openGoalItems: ${context.openGoalItems}`,
    `- pendingJiEvents: ${context.pendingJiEvents}`,
    `- worldlineCoveragePercent: ${context.worldlineCoveragePercent}`,
    `- forkCompatibilityStatus: ${context.forkCompatibilityStatus}`,
    `- aestheticSmokeStatus: ${context.aestheticSmokeStatus}`,
    "",
    "## Horizon Proposals",
    ...proposalLines,
    "",
    "## Boundary",
    "This horizon keeps exploration alive after green evidence. It may write JiEvents, sandbox rehearsals, and RFC drafts, but it must not promote canonical pool state.",
  ].join("\n");
}
