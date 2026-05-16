import { assessJiEventSoulfulData } from "./ethicalKernel";
import {
  jiBodyField,
  jiEventProposalLane,
  type JiEvent,
  type JiProposalLaneKind,
  type JiSourceProject,
} from "./ji";

export type ReviewTriageUrgency = "repair" | "today" | "routine" | "watch";
export type ReviewDecisionCost = "low" | "medium" | "high";
export type ReviewReversibility = "reversible" | "review_required" | "high_impact";
export type ReviewNextAction =
  | "request_redress"
  | "create_sandbox"
  | "draft_rfc"
  | "create_node"
  | "dismiss_or_watch"
  | "review_observation";

export type ReviewTriagePressure = "clear" | "loaded" | "saturated";

export type ReviewableJiEvent = JiEvent & {
  status?: string;
  createdAt?: string;
};

export type HumaneReviewTriageItem = {
  eventId: string;
  title: string;
  sourceProject: JiSourceProject;
  domain?: string;
  candidateKind?: string;
  proposalKind?: JiProposalLaneKind;
  urgency: ReviewTriageUrgency;
  decisionCost: ReviewDecisionCost;
  reversibility: ReviewReversibility;
  nextAction: ReviewNextAction;
  weakSoulfulSignals: number;
  rationale: string;
  reviewQuestion?: string;
  acceptanceCheck?: string;
  createdAt?: string;
  canonicalMutationAllowed: false;
};

export type HumaneReviewTriageSummary = {
  generatedAt: string;
  totalPending: number;
  shown: number;
  pressure: ReviewTriagePressure;
  pressureDetail: string;
  counts: {
    repair: number;
    today: number;
    routine: number;
    watch: number;
    highCost: number;
    redress: number;
    reversible: number;
  };
  topItems: HumaneReviewTriageItem[];
  canonicalMutationAllowed: false;
};

function pressureFor(totalPending: number): ReviewTriagePressure {
  if (totalPending >= 120) return "saturated";
  if (totalPending >= 30) return "loaded";
  return "clear";
}

function pressureDetail(pressure: ReviewTriagePressure, totalPending: number) {
  if (pressure === "saturated") {
    return `${totalPending} pending JiEvents can overwhelm human review; batch by action and keep import decisions reversible.`;
  }
  if (pressure === "loaded") {
    return `${totalPending} pending JiEvents need triage, but the queue can still be reviewed in bounded sessions.`;
  }
  return `${totalPending} pending JiEvents is a light queue; reviewers can inspect items directly.`;
}

function urgencyFor({
  event,
  proposalKind,
  weakSignals,
}: {
  event: ReviewableJiEvent;
  proposalKind: JiProposalLaneKind | null;
  weakSignals: number;
}): ReviewTriageUrgency {
  if (event.kind === "ci.failed" || event.kind === "publish.blocked") {
    return "repair";
  }
  if (isRedressFirst(event, weakSignals)) return "today";
  if (
    proposalKind === "ETHICAL_INVARIANT_PROPOSAL" ||
    proposalKind === "RFC_DRAFT_PROPOSAL" ||
    proposalKind === "ENGINEERING_TASK_PROPOSAL"
  ) {
    return "today";
  }
  if (proposalKind === "ESSAY_NOTE_PROPOSAL") return "watch";
  return "routine";
}

function decisionCostFor({
  event,
  proposalKind,
  weakSignals,
}: {
  event: ReviewableJiEvent;
  proposalKind: JiProposalLaneKind | null;
  weakSignals: number;
}): ReviewDecisionCost {
  if (isRedressFirst(event, weakSignals)) return "high";
  if (
    proposalKind === "ETHICAL_INVARIANT_PROPOSAL" ||
    proposalKind === "RFC_DRAFT_PROPOSAL" ||
    event.kind === "sandbox.lesson"
  ) {
    return "high";
  }
  if (
    proposalKind === "AESTHETIC_SURFACE_PROPOSAL" ||
    proposalKind === "ENGINEERING_TASK_PROPOSAL" ||
    event.kind === "repo.changed" ||
    event.kind === "memory.learned"
  ) {
    return "medium";
  }
  return "low";
}

function nextActionFor({
  event,
  proposalKind,
  weakSignals,
}: {
  event: ReviewableJiEvent;
  proposalKind: JiProposalLaneKind | null;
  weakSignals: number;
}): ReviewNextAction {
  if (isRedressFirst(event, weakSignals)) return "request_redress";
  if (
    proposalKind === "RFC_DRAFT_PROPOSAL" ||
    proposalKind === "ETHICAL_INVARIANT_PROPOSAL"
  ) {
    return "draft_rfc";
  }
  if (
    proposalKind === "AESTHETIC_SURFACE_PROPOSAL" ||
    proposalKind === "ENGINEERING_TASK_PROPOSAL" ||
    event.kind === "ci.failed" ||
    event.kind === "publish.blocked" ||
    event.kind === "sandbox.lesson"
  ) {
    return "create_sandbox";
  }
  if (proposalKind === "ESSAY_NOTE_PROPOSAL") return "dismiss_or_watch";
  if (proposalKind === "OBSERVATION_REVIEW") return "review_observation";
  if (event.kind === "artifact.published") return "create_node";
  return "review_observation";
}

function isRedressFirst(event: ReviewableJiEvent, weakSignals: number) {
  if (weakSignals >= 3) return true;
  return (
    weakSignals >= 2 &&
    (event.sourceProject === "chrome" || event.sourceProject === "computer")
  );
}

function reversibilityFor(nextAction: ReviewNextAction): ReviewReversibility {
  if (nextAction === "create_node") return "high_impact";
  if (nextAction === "request_redress") return "review_required";
  return "reversible";
}

function actionRationale({
  nextAction,
  urgency,
  decisionCost,
  weakSignals,
}: {
  nextAction: ReviewNextAction;
  urgency: ReviewTriageUrgency;
  decisionCost: ReviewDecisionCost;
  weakSignals: number;
}) {
  if (nextAction === "request_redress") {
    return `${weakSignals} soulful-data weak signals make this a redress-first review before any artifact path.`;
  }
  if (nextAction === "draft_rfc") {
    return `High responsibility proposal with ${decisionCost} decision cost; draft RFC before implementation or import.`;
  }
  if (nextAction === "create_sandbox") {
    return `Use sandbox rehearsal to lower decision cost before touching canonical pool state.`;
  }
  if (nextAction === "create_node") {
    return `Potential canonical import; verify provenance and phase responsibility first.`;
  }
  if (nextAction === "dismiss_or_watch") {
    return `Keep as discussion material unless a concrete mechanism boundary appears.`;
  }
  return `Review as observation; urgency is ${urgency} and no automatic promotion is allowed.`;
}

export function buildHumaneReviewTriageItem(
  event: ReviewableJiEvent,
): HumaneReviewTriageItem {
  const soulful = assessJiEventSoulfulData(event);
  const proposalKind = jiEventProposalLane(event);
  const weakSoulfulSignals = soulful.weakSignals.length;
  const urgency = urgencyFor({ event, proposalKind, weakSignals: weakSoulfulSignals });
  const decisionCost = decisionCostFor({
    event,
    proposalKind,
    weakSignals: weakSoulfulSignals,
  });
  const nextAction = nextActionFor({
    event,
    proposalKind,
    weakSignals: weakSoulfulSignals,
  });
  const reversibility = reversibilityFor(nextAction);

  return {
    eventId: event.id,
    title: event.title,
    sourceProject: event.sourceProject,
    domain: jiBodyField(event.body, "Domain"),
    candidateKind: jiBodyField(event.body, "Candidate kind"),
    proposalKind: proposalKind ?? undefined,
    urgency,
    decisionCost,
    reversibility,
    nextAction,
    weakSoulfulSignals,
    rationale: actionRationale({
      nextAction,
      urgency,
      decisionCost,
      weakSignals: weakSoulfulSignals,
    }),
    reviewQuestion:
      jiBodyField(event.body, "Review question") ??
      jiBodyField(event.body, "Next question"),
    acceptanceCheck: jiBodyField(event.body, "Acceptance check"),
    createdAt: event.createdAt,
    canonicalMutationAllowed: false,
  };
}

function urgencyRank(urgency: ReviewTriageUrgency) {
  return { repair: 0, today: 1, routine: 2, watch: 3 }[urgency];
}

function costRank(cost: ReviewDecisionCost) {
  return { high: 0, medium: 1, low: 2 }[cost];
}

export function buildHumaneReviewTriage({
  events,
  totalPending = events.length,
  generatedAt = new Date().toISOString(),
}: {
  events: ReviewableJiEvent[];
  totalPending?: number;
  generatedAt?: string;
}): HumaneReviewTriageSummary {
  const items = events.map(buildHumaneReviewTriageItem).sort((left, right) => {
    const urgencyDelta = urgencyRank(left.urgency) - urgencyRank(right.urgency);
    if (urgencyDelta !== 0) return urgencyDelta;
    const costDelta = costRank(left.decisionCost) - costRank(right.decisionCost);
    if (costDelta !== 0) return costDelta;
    return (right.createdAt ?? "").localeCompare(left.createdAt ?? "");
  });
  const pressure = pressureFor(totalPending);

  return {
    generatedAt,
    totalPending,
    shown: items.length,
    pressure,
    pressureDetail: pressureDetail(pressure, totalPending),
    counts: {
      repair: items.filter((item) => item.urgency === "repair").length,
      today: items.filter((item) => item.urgency === "today").length,
      routine: items.filter((item) => item.urgency === "routine").length,
      watch: items.filter((item) => item.urgency === "watch").length,
      highCost: items.filter((item) => item.decisionCost === "high").length,
      redress: items.filter((item) => item.nextAction === "request_redress")
        .length,
      reversible: items.filter((item) => item.reversibility === "reversible")
        .length,
    },
    topItems: items.slice(0, 8),
    canonicalMutationAllowed: false,
  };
}
