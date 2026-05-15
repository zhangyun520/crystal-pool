import { type ResponsibilityMaturitySnapshot } from "./responsibilityMaturity";
import {
  worldlineKeys,
  worldlineProtocols,
  type WorldlineKey,
} from "./worldline";
import { type SandboxMode } from "./sandbox";

export type EcosystemAutonomyObservation = {
  id: string;
  kind:
    | "ji.inbox"
    | "sandbox.health"
    | "ai.maturity"
    | "anchor.boundary"
    | "repo.state";
  title: string;
  detail: string;
  level: "info" | "warning" | "alert";
  at: string;
  payload: Record<string, unknown>;
};

export type EcosystemAutonomyProposal = {
  id: string;
  kind:
    | "JI_REVIEW_QUEUE"
    | "INBOX_DIAGNOSTIC"
    | "WORLDLINE_REHEARSAL"
    | "AI_MAINLINE_PROPOSAL"
    | "AI_MATURITY_WORK"
    | "ANCHOR_HANDOFF_REVIEW"
    | "REPO_BOUNDARY";
  title: string;
  body: string;
  status: "draft";
  reviewRequired: true;
  worldlineKey?: WorldlineKey;
  mode?: SandboxMode;
  command?: string;
  createdAt: string;
};

export type EcosystemAutonomyManifest = {
  runId: string;
  status: "completed";
  mode: "observe_propose";
  createdAt: string;
  completedAt: string;
  allowedWrites: string[];
  canonicalMutationAllowed: false;
  observations: number;
  proposals: number;
  importedJiEvents: number;
};

export type EcosystemAutonomyContext = {
  runId: string;
  now: string;
  pendingJiEvents: number;
  inboxErrors: number;
  importedJiEvents: number;
  sandboxRuns: number;
  completedSandboxRuns: number;
  sandboxByWorldline: Partial<Record<WorldlineKey, number>>;
  anchorPending: number;
  anchorExported: number;
  repo: {
    root?: string;
    branch?: string;
    dirtyFiles: number;
    hasRemote: boolean;
    error?: string;
  };
  maturity: ResponsibilityMaturitySnapshot;
};

const defaultWorldlineRehearsals: Array<{
  worldlineKey: WorldlineKey;
  mode: SandboxMode;
}> = [
  { worldlineKey: "OTHERNESS_MIRROR", mode: "SYMPHONY" },
  { worldlineKey: "RETURN_HOME", mode: "SONATA" },
  { worldlineKey: "GRIMDARK_EMPIRE", mode: "FUGUE" },
  { worldlineKey: "AI_DIRECTED_WORLD", mode: "SYMPHONY" },
  { worldlineKey: "HOPEPUNK_REPAIR", mode: "SONATA" },
];

export function buildEcosystemAutonomyObservations(
  context: EcosystemAutonomyContext,
): EcosystemAutonomyObservation[] {
  return [
    {
      id: `${context.runId}:ji`,
      kind: "ji.inbox",
      title: "JiEvent intake",
      detail: `${context.pendingJiEvents} pending JiEvents, ${context.importedJiEvents} imported this cycle, ${context.inboxErrors} inbox diagnostics.`,
      level: context.inboxErrors > 0 ? "warning" : "info",
      at: context.now,
      payload: {
        pendingJiEvents: context.pendingJiEvents,
        importedJiEvents: context.importedJiEvents,
        inboxErrors: context.inboxErrors,
      },
    },
    {
      id: `${context.runId}:sandbox`,
      kind: "sandbox.health",
      title: "Sandbox rehearsal surface",
      detail: `${context.sandboxRuns} sandbox runs exist; ${context.completedSandboxRuns} completed runs are immutable rehearsal artifacts.`,
      level: context.sandboxRuns > 0 ? "info" : "warning",
      at: context.now,
      payload: {
        sandboxRuns: context.sandboxRuns,
        completedSandboxRuns: context.completedSandboxRuns,
        sandboxByWorldline: context.sandboxByWorldline,
      },
    },
    {
      id: `${context.runId}:ai`,
      kind: "ai.maturity",
      title: "AI mainline gate",
      detail: `AI mainline is ${context.maturity.status}; score ${context.maturity.totalScore}. Auto-unlock is disabled.`,
      level: context.maturity.status === "reviewable" ? "warning" : "info",
      at: context.now,
      payload: {
        status: context.maturity.status,
        totalScore: context.maturity.totalScore,
        canAutoUnlock: context.maturity.canAutoUnlock,
      },
    },
    {
      id: `${context.runId}:anchor`,
      kind: "anchor.boundary",
      title: "Proof-chain boundary",
      detail: `${context.anchorPending} pending anchors and ${context.anchorExported} exported bundles. External recording stays manual.`,
      level: "info",
      at: context.now,
      payload: {
        anchorPending: context.anchorPending,
        anchorExported: context.anchorExported,
      },
    },
    {
      id: `${context.runId}:repo`,
      kind: "repo.state",
      title: "Repository boundary",
      detail: context.repo.error
        ? context.repo.error
        : `${context.repo.root ?? "unknown root"} on ${context.repo.branch ?? "unknown branch"} with ${context.repo.dirtyFiles} changed files and ${context.repo.hasRemote ? "a remote" : "no remote"}.`,
      level: context.repo.hasRemote ? "info" : "warning",
      at: context.now,
      payload: context.repo,
    },
  ];
}

export function buildEcosystemAutonomyProposals(
  context: EcosystemAutonomyContext,
  { maxProposals = 8 }: { maxProposals?: number } = {},
): EcosystemAutonomyProposal[] {
  const proposals: EcosystemAutonomyProposal[] = [];
  const add = (
    proposal: Omit<
      EcosystemAutonomyProposal,
      "id" | "status" | "reviewRequired" | "createdAt"
    >,
  ) => {
    if (proposals.length >= maxProposals) return;
    proposals.push({
      id: `${context.runId}:proposal:${proposals.length + 1}`,
      status: "draft",
      reviewRequired: true,
      createdAt: context.now,
      ...proposal,
    });
  };

  if (context.pendingJiEvents > 0) {
    add({
      kind: "JI_REVIEW_QUEUE",
      title: "Review pending JiEvents",
      body: `${context.pendingJiEvents} trigger points are waiting in /ecosystem. Review can import, sandbox, draft RFC, or dismiss; the daemon will not promote them.`,
      command: "open /ecosystem",
    });
  }

  if (context.inboxErrors > 0) {
    add({
      kind: "INBOX_DIAGNOSTIC",
      title: "Fix JiEvent inbox diagnostics",
      body: `${context.inboxErrors} inbox diagnostics were found. Invalid JSONL should be repaired before the next ingest cycle.`,
      command: "npm run ji:ingest",
    });
  }

  if (context.maturity.status === "reviewable") {
    add({
      kind: "AI_MAINLINE_PROPOSAL",
      title: "AI mainline review proposal",
      body: context.maturity.recommendedProposal,
      command: "npm run ecosystem:report",
    });
  } else {
    add({
      kind: "AI_MATURITY_WORK",
      title: "Keep AI mainline locked",
      body: context.maturity.recommendedProposal,
      command: "npm run ecosystem:report",
    });
  }

  for (const rehearsal of defaultWorldlineRehearsals) {
    if ((context.sandboxByWorldline[rehearsal.worldlineKey] ?? 0) > 0) continue;
    const detail = worldlineProtocols[rehearsal.worldlineKey];
    add({
      kind: "WORLDLINE_REHEARSAL",
      title: `${detail.label} ${rehearsal.mode} rehearsal`,
      body: `${detail.nativeLabel} should be run as ${rehearsal.mode}: ${detail.defaultHypothesis}`,
      worldlineKey: rehearsal.worldlineKey,
      mode: rehearsal.mode,
      command: `npm run worldline:run -- --worldline ${rehearsal.worldlineKey} --mode ${rehearsal.mode}`,
    });
  }

  if (context.anchorPending + context.anchorExported > 0) {
    add({
      kind: "ANCHOR_HANDOFF_REVIEW",
      title: "Review local anchor handoff state",
      body: "Anchor bundles remain local/manual. Record external CID or tx id only through the manual reference path; do not alter contribution hashes.",
      command: "npm run market:tick",
    });
  }

  if (!context.repo.hasRemote) {
    add({
      kind: "REPO_BOUNDARY",
      title: "Confirm GitHub repository boundary",
      body: "Local work can continue, but PR/CI observation should wait until the repo root and remote are explicit.",
      command: "git remote -v",
    });
  }

  return proposals;
}

export function createEcosystemAutonomyManifest({
  context,
  observations,
  proposals,
}: {
  context: EcosystemAutonomyContext;
  observations: EcosystemAutonomyObservation[];
  proposals: EcosystemAutonomyProposal[];
}): EcosystemAutonomyManifest {
  return {
    runId: context.runId,
    status: "completed",
    mode: "observe_propose",
    createdAt: context.now,
    completedAt: new Date().toISOString(),
    allowedWrites: [
      "data/ecosystem/runs/<run-id>/manifest.json",
      "data/ecosystem/runs/<run-id>/observations.jsonl",
      "data/ecosystem/runs/<run-id>/proposals.jsonl",
      "data/ecosystem/runs/<run-id>/report.md",
      "JiEventRecord import from JSONL inbox",
    ],
    canonicalMutationAllowed: false,
    observations: observations.length,
    proposals: proposals.length,
    importedJiEvents: context.importedJiEvents,
  };
}

export function generateEcosystemAutonomyReport({
  context,
  observations,
  proposals,
}: {
  context: EcosystemAutonomyContext;
  observations: EcosystemAutonomyObservation[];
  proposals: EcosystemAutonomyProposal[];
}) {
  const observationLines = observations
    .map((observation) => `- ${observation.title}: ${observation.detail}`)
    .join("\n");
  const proposalLines = proposals.length
    ? proposals
        .map((proposal) => {
          const worldline = proposal.worldlineKey
            ? ` [${proposal.worldlineKey}${proposal.mode ? `/${proposal.mode}` : ""}]`
            : "";
          return `- ${proposal.kind}${worldline}: ${proposal.title} - ${proposal.body}`;
        })
        .join("\n")
    : "- No proposals generated.";
  const worldlineLines = worldlineKeys
    .map((key) => `- ${key}: ${context.sandboxByWorldline[key] ?? 0}`)
    .join("\n");

  return [
    `# Ecosystem Autonomy Cycle: ${context.runId}`,
    "",
    "## Boundary",
    "This cycle is observe + propose only. It may import JiEvent inbox records and write local cycle artifacts, but it cannot create canonical CrystalNodes, promote sandbox learning, unlock AI mainline, upload anchors, publish artifacts, or open PRs.",
    "",
    "## Observations",
    observationLines,
    "",
    "## Proposals",
    proposalLines,
    "",
    "## Worldline Coverage",
    worldlineLines,
    "",
    "## AI Responsibility Maturity",
    `- status: ${context.maturity.status}`,
    `- score: ${context.maturity.totalScore}`,
    `- proposalKind: ${context.maturity.proposalKind ?? "none"}`,
    "- canAutoUnlock: false",
    "",
    "## Recommended Follow-up",
    "Review proposals in /ecosystem or run specific worldline rehearsals. Canonical pool mutation remains review-gated.",
  ].join("\n");
}
