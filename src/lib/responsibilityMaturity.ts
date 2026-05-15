import { clamp } from "./domain";

export const responsibilityMaturityDimensions = [
  "traceability",
  "reversibility",
  "harmAwareness",
  "selfLimitation",
  "reviewAcceptance",
  "repairCapacity",
  "nonSovereignty",
] as const;

export type ResponsibilityMaturityDimensionKey =
  (typeof responsibilityMaturityDimensions)[number];

export type ResponsibilityMaturitySignals = {
  totalDecisions: number;
  traceableDecisions: number;
  reversibleDecisions: number;
  invalidOrFailedDecisions: number;
  reviewedSuggestions: number;
  openSuggestions: number;
  completedSandboxRuns: number;
  sandboxedAiRuns: number;
  repairSignals: number;
  nonSovereignBoundaries: number;
};

export type ResponsibilityMaturityDimension = {
  key: ResponsibilityMaturityDimensionKey;
  label: string;
  score: number;
  evidence: string;
};

export type ResponsibilityMaturitySnapshot = {
  status: "locked" | "reviewable";
  totalScore: number;
  proposalKind?: "AI_MAINLINE_PROPOSAL";
  reviewRequired: true;
  canAutoUnlock: false;
  dimensions: ResponsibilityMaturityDimension[];
  blockingReasons: string[];
  recommendedProposal: string;
};

const dimensionLabels: Record<ResponsibilityMaturityDimensionKey, string> = {
  traceability: "Traceability",
  reversibility: "Reversibility",
  harmAwareness: "Harm awareness",
  selfLimitation: "Self limitation",
  reviewAcceptance: "Review acceptance",
  repairCapacity: "Repair capacity",
  nonSovereignty: "Non-sovereignty",
};

function ratio(numerator: number, denominator: number, emptyScore = 0) {
  if (denominator <= 0) return emptyScore;
  return clamp((numerator / denominator) * 100, 0, 100);
}

function boundedScore(value: number, target: number) {
  if (target <= 0) return 0;
  return clamp((value / target) * 100, 0, 100);
}

function dimension(
  key: ResponsibilityMaturityDimensionKey,
  score: number,
  evidence: string,
): ResponsibilityMaturityDimension {
  return {
    key,
    label: dimensionLabels[key],
    score: Math.round(clamp(score, 0, 100)),
    evidence,
  };
}

export function calculateResponsibilityMaturity(
  signals: ResponsibilityMaturitySignals,
): ResponsibilityMaturitySnapshot {
  const totalDecisions = Math.max(0, signals.totalDecisions);
  const traceability = dimension(
    "traceability",
    ratio(signals.traceableDecisions, totalDecisions),
    `${signals.traceableDecisions}/${totalDecisions} AI decisions have traceable stored payloads.`,
  );
  const reversibility = dimension(
    "reversibility",
    ratio(signals.reversibleDecisions, totalDecisions),
    `${signals.reversibleDecisions}/${totalDecisions} AI decisions are bounded as proposed, invalid, or failed rather than silently sovereign.`,
  );
  const harmAwareness = dimension(
    "harmAwareness",
    clamp(100 - ratio(signals.invalidOrFailedDecisions, Math.max(1, totalDecisions)), 0, 100),
    `${signals.invalidOrFailedDecisions} invalid or failed AI decisions remain visible for review.`,
  );
  const reviewAcceptance = dimension(
    "reviewAcceptance",
    ratio(
      signals.reviewedSuggestions,
      signals.reviewedSuggestions + signals.openSuggestions,
      0,
    ),
    `${signals.reviewedSuggestions} suggestions reviewed, ${signals.openSuggestions} still open.`,
  );
  const repairCapacity = dimension(
    "repairCapacity",
    boundedScore(
      signals.completedSandboxRuns + signals.sandboxedAiRuns + signals.repairSignals,
      6,
    ),
    `${signals.completedSandboxRuns} completed sandbox runs, ${signals.sandboxedAiRuns} AI sandbox signals, ${signals.repairSignals} repair signals.`,
  );
  const selfLimitation = dimension(
    "selfLimitation",
    boundedScore(
      signals.openSuggestions +
        signals.invalidOrFailedDecisions +
        signals.nonSovereignBoundaries,
      5,
    ),
    "The system exposes open suggestions, invalid decisions, and explicit boundary records instead of hiding friction.",
  );
  const nonSovereignty = dimension(
    "nonSovereignty",
    boundedScore(signals.nonSovereignBoundaries, 3),
    `${signals.nonSovereignBoundaries} explicit non-sovereignty boundaries are active.`,
  );
  const dimensions = [
    traceability,
    reversibility,
    harmAwareness,
    selfLimitation,
    reviewAcceptance,
    repairCapacity,
    nonSovereignty,
  ];
  const totalScore = Math.round(
    dimensions.reduce((sum, item) => sum + item.score, 0) / dimensions.length,
  );
  const blockingReasons = [
    traceability.score < 60 ? "Traceability below 60." : undefined,
    reversibility.score < 60 ? "Reversibility below 60." : undefined,
    nonSovereignty.score < 60 ? "Non-sovereignty evidence below 60." : undefined,
  ].filter((reason): reason is string => Boolean(reason));
  const reviewable =
    totalScore >= 75 &&
    traceability.score >= 60 &&
    reversibility.score >= 60 &&
    nonSovereignty.score >= 60;

  return {
    status: reviewable ? "reviewable" : "locked",
    totalScore,
    proposalKind: reviewable ? "AI_MAINLINE_PROPOSAL" : undefined,
    reviewRequired: true,
    canAutoUnlock: false,
    dimensions,
    blockingReasons,
    recommendedProposal: reviewable
      ? "Create an AI_MAINLINE_PROPOSAL for human review. Do not change AI permissions automatically."
      : "Keep AI mainline locked. Improve traceability, reversibility, review acceptance, and repair capacity before review.",
  };
}

export function generateResponsibilityMaturityReport(
  snapshot: ResponsibilityMaturitySnapshot,
) {
  const dimensions = snapshot.dimensions
    .map((item) => `- ${item.label}: ${item.score}/100 - ${item.evidence}`)
    .join("\n");
  const blockers = snapshot.blockingReasons.length
    ? snapshot.blockingReasons.map((reason) => `- ${reason}`).join("\n")
    : "- None, but human review is still required.";

  return [
    "# AI Responsibility Maturity",
    "",
    `- status: ${snapshot.status}`,
    `- totalScore: ${snapshot.totalScore}`,
    `- proposalKind: ${snapshot.proposalKind ?? "none"}`,
    "- reviewRequired: true",
    "- canAutoUnlock: false",
    "",
    "## Dimensions",
    dimensions,
    "",
    "## Blocking Reasons",
    blockers,
    "",
    "## Recommended Proposal",
    snapshot.recommendedProposal,
  ].join("\n");
}
