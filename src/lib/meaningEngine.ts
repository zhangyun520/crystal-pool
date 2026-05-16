import {
  calculateCrystallizationBreakdown,
  relationContribution,
  suggestPhase,
  type ScoreBreakdown,
} from "./crystallization";
import {
  type CrystalEdgeCore,
  type CrystalNodeCore,
  type Phase,
  type PhaseEventCore,
} from "./domain";

export type ScoreExplanation = {
  label: string;
  value: number;
  tone: "positive" | "negative" | "neutral";
  reason: string;
};

export type PhaseSuggestion = {
  targetPhase: Phase;
  severity: "soft" | "watch" | "urgent";
  title: string;
  reason: string;
};

export type TimelineEvent = {
  id: string;
  at: Date | string;
  kind: "created" | "phase" | "edge" | "ha" | "risk";
  title: string;
  detail: string;
};

export type ScoreDriver = {
  id: string;
  kind:
    | "phase"
    | "relation"
    | "emotion"
    | "promotion"
    | "ha"
    | "decay"
    | "phase_penalty";
  label: string;
  value: number;
  tone: ScoreExplanation["tone"];
  detail: string;
};

export type ScoreNowExplanation = {
  headline: string;
  phaseFit: string;
  lastChange?: {
    at: Date | string;
    label: string;
    detail: string;
  };
  drivers: ScoreDriver[];
};

type ExplainedEdge = CrystalEdgeCore & {
  relatedTitle?: string;
  direction?: "in" | "out";
};

function signedTone(value: number): ScoreExplanation["tone"] {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

export function explainScoreBreakdown(
  breakdown: ScoreBreakdown,
  node: CrystalNodeCore,
  edges: CrystalEdgeCore[],
  events: PhaseEventCore[],
): ScoreExplanation[] {
  const connectedEdges = edges.filter(
    (edge) => edge.fromId === node.id || edge.toId === node.id,
  );
  const promotions = events.filter(
    (event) =>
      event.nodeId === node.id &&
      ["liquid", "seed", "crystal"].includes(event.toPhase),
  );

  return [
    {
      label: "Phase base",
      value: breakdown.base,
      tone: "neutral",
      reason: `${node.phase} contributes the starting state.`,
    },
    {
      label: "Relations",
      value: breakdown.relationScore,
      tone: signedTone(breakdown.relationScore),
      reason:
        connectedEdges.length === 0
          ? "No active relations are pulling on this node yet."
          : `${connectedEdges.length} active relation${
              connectedEdges.length === 1 ? "" : "s"
            } shape its crystallization pressure.`,
    },
    {
      label: "Emotion",
      value: breakdown.emotionScore,
      tone: signedTone(breakdown.emotionScore),
      reason: "Curiosity, joy, fear, publicness, and private intensity add lift; boredom subtracts.",
    },
    {
      label: "Promotions",
      value: breakdown.promotionScore,
      tone: signedTone(breakdown.promotionScore),
      reason:
        promotions.length === 0
          ? "No recent phase promotions are reinforcing this node."
          : `${promotions.length} promotion event${
              promotions.length === 1 ? "" : "s"
            } recently reinforced the path.`,
    },
    {
      label: "Ha resilience",
      value: breakdown.resilienceScore,
      tone: signedTone(breakdown.resilienceScore),
      reason:
        node.emotionHa > 0
          ? "Ha keeps hard concepts revisable instead of simply inflating the score."
          : "No ha buffer is softening this node yet.",
    },
    {
      label: "Decay",
      value: -breakdown.decayPenalty,
      tone: breakdown.decayPenalty > 0 ? "negative" : "neutral",
      reason: "Isolation age and boredom can erode weak crystallization.",
    },
    {
      label: "Phase penalty",
      value: -breakdown.phasePenalty,
      tone: breakdown.phasePenalty > 0 ? "negative" : "neutral",
      reason: "Dissolved and over-hardened fossil states resist simple score growth.",
    },
  ];
}

export function summarizeScoreDrivers(explanations: ScoreExplanation[]) {
  return explanations
    .filter((item) => item.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 3)
    .map((item) => `${item.label}: ${item.reason}`);
}

function daysSince(value: Date | string, now: Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Math.max(0, (now.getTime() - date.getTime()) / 86_400_000);
}

function phaseBand(score: number, node: CrystalNodeCore) {
  return suggestPhase(Math.round(score), node);
}

function edgeDirection(edge: ExplainedEdge, node: CrystalNodeCore) {
  if (edge.direction) return edge.direction;
  return edge.fromId === node.id ? "out" : "in";
}

function relationDetail(edge: ExplainedEdge, node: CrystalNodeCore) {
  const direction = edgeDirection(edge, node);
  const related = edge.relatedTitle ? ` ${edge.relatedTitle}` : " another node";
  return direction === "out"
    ? `${edge.relation} points toward${related} with weight ${edge.weight}.`
    : `${edge.relation} arrives from${related} with weight ${edge.weight}.`;
}

function latestChange(
  node: CrystalNodeCore,
  edges: ExplainedEdge[],
  events: PhaseEventCore[],
): ScoreNowExplanation["lastChange"] {
  const candidates: NonNullable<ScoreNowExplanation["lastChange"]>[] = [];
  const nodeEvents = events.filter((event) => event.nodeId === node.id);
  for (const event of nodeEvents) {
    candidates.push({
      at: event.createdAt,
      label: `${event.fromPhase ?? "origin"} -> ${event.toPhase}`,
      detail: event.reason,
    });
  }
  for (const edge of edges.filter(
    (item) => item.fromId === node.id || item.toId === node.id,
  )) {
    candidates.push({
      at: edge.createdAt ?? node.updatedAt,
      label: edge.relation,
      detail: relationDetail(edge, node),
    });
  }
  return candidates.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )[0];
}

export function explainScoreNow(
  node: CrystalNodeCore,
  breakdown: ScoreBreakdown,
  edges: ExplainedEdge[],
  events: PhaseEventCore[],
  now = new Date(),
): ScoreNowExplanation {
  const drivers: ScoreDriver[] = [
    {
      id: "phase-base",
      kind: "phase",
      label: `${node.phase} phase base`,
      value: breakdown.base,
      tone: "neutral",
      detail: `${node.phase} sets the starting score before relations, emotions, and history act on it.`,
    },
  ];

  for (const edge of edges.filter(
    (item) => item.fromId === node.id || item.toId === node.id,
  )) {
    const rawValue =
      relationContribution[edge.relation] * Math.min(10, Math.max(0, edge.weight));
    drivers.push({
      id: `edge:${edge.id}`,
      kind: "relation",
      label: edge.relation,
      value: rawValue,
      tone: signedTone(rawValue),
      detail: relationDetail(edge, node),
    });
  }

  const emotionDrivers = [
    ["Curiosity", node.emotionCuriosity * 1.8],
    ["Joy", node.emotionJoy * 1.4],
    ["Fear", node.emotionFear * 0.9],
    ["Private intensity", node.privateIntensity * 0.8],
    ["Publicness", node.publicness * 0.8],
    ["Boredom", -node.emotionBoredom * 2.6],
  ] as const;
  for (const [label, value] of emotionDrivers) {
    if (value === 0) continue;
    drivers.push({
      id: `emotion:${label}`,
      kind: "emotion",
      label,
      value,
      tone: signedTone(value),
      detail:
        label === "Boredom"
          ? "Boredom pulls the node toward decay."
          : `${label} adds pressure toward crystallization.`,
    });
  }

  for (const event of events.filter((item) => item.nodeId === node.id)) {
    if (!["liquid", "seed", "crystal"].includes(event.toPhase)) continue;
    const recent = daysSince(event.createdAt, now) <= 21;
    const value = recent ? 6 : 2;
    drivers.push({
      id: `event:${event.id}`,
      kind: "promotion",
      label: `${event.toPhase} promotion`,
      value,
      tone: "positive",
      detail: `${event.reason} ${recent ? "is recent" : "still leaves a weak historical trace"}.`,
    });
  }

  if (node.emotionHa > 0) {
    drivers.push({
      id: "ha-resilience",
      kind: "ha",
      label: "Ha resilience",
      value: breakdown.resilienceScore,
      tone: signedTone(breakdown.resilienceScore),
      detail: "Ha adds revisability, especially when a node risks becoming too hard.",
    });
  }

  if (breakdown.decayPenalty > 0) {
    drivers.push({
      id: "decay",
      kind: "decay",
      label: "Decay pressure",
      value: -breakdown.decayPenalty,
      tone: "negative",
      detail: "Age, isolation, or boredom are eroding the current crystallization.",
    });
  }

  if (breakdown.phasePenalty > 0) {
    drivers.push({
      id: "phase-penalty",
      kind: "phase_penalty",
      label: "Phase penalty",
      value: -breakdown.phasePenalty,
      tone: "negative",
      detail: "Fossil and dissolved states resist simple score growth.",
    });
  }

  const sortedDrivers = drivers
    .filter((driver) => driver.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const top = sortedDrivers[0];
  const suggested = phaseBand(breakdown.total, node);
  const rounded = Math.round(breakdown.total);

  return {
    headline: top
      ? `Current score ${rounded} is mostly shaped by ${top.label}.`
      : `Current score ${rounded} is stable with no strong driver.`,
    phaseFit:
      suggested === node.phase
        ? `${node.phase} matches the deterministic score band.`
        : `Score ${rounded} falls in the ${suggested} band while the node is still ${node.phase}.`,
    lastChange: latestChange(node, edges, events),
    drivers: sortedDrivers.slice(0, 8),
  };
}

export function suggestPhaseInterventions(
  node: CrystalNodeCore,
  edges: CrystalEdgeCore[],
  events: PhaseEventCore[],
  now = new Date(),
): PhaseSuggestion[] {
  const breakdown = calculateCrystallizationBreakdown(node, edges, events, now);
  const scorePhase = suggestPhase(Math.round(breakdown.total), node);
  const connectedEdges = edges.filter(
    (edge) => edge.fromId === node.id || edge.toId === node.id,
  );
  const suggestions: PhaseSuggestion[] = [];

  if (scorePhase !== node.phase && node.phase !== "fossil") {
    suggestions.push({
      targetPhase: scorePhase,
      severity: scorePhase === "crystal" ? "watch" : "soft",
      title: `Consider ${scorePhase}`,
      reason: `Score ${Math.round(
        breakdown.total,
      )} currently points toward ${scorePhase} while this node is ${node.phase}; apply the phase only if the meaning feels ready.`,
    });
  }

  if (
    node.phase === "crystal" &&
    node.emotionHa <= 2 &&
    breakdown.resilienceScore < 3
  ) {
    suggestions.push({
      targetPhase: "liquid",
      severity: "watch",
      title: "Add ha before fossilization",
      reason: `Score ${Math.round(
        breakdown.total,
      )} with ha ${node.emotionHa} can become too rigid; add ha before hardening further.`,
    });
  }

  if (node.phase === "fossil") {
    suggestions.push({
      targetPhase: "liquid",
      severity: "urgent",
      title: "Ha soften fossil",
      reason: `This node is fossil with ha ${node.emotionHa}; soften it through a visible user action instead of auto-changing history.`,
    });
  }

  if (
    node.phase === "seed" &&
    connectedEdges.length === 0 &&
    breakdown.total < 30
  ) {
    suggestions.push({
      targetPhase: "liquid",
      severity: "soft",
      title: "Let this seed flow",
      reason: `This seed has ${connectedEdges.length} relations and score ${Math.round(
        breakdown.total,
      )}; let it flow until more resonance appears.`,
    });
  }

  if (node.emotionBoredom >= 8 && breakdown.total < 20) {
    suggestions.push({
      targetPhase: "dissolved",
      severity: "watch",
      title: "Consider dissolve",
      reason: `Boredom ${node.emotionBoredom} and score ${Math.round(
        breakdown.total,
      )} suggest the fragment may have evaporated.`,
    });
  }

  return suggestions.slice(0, 4);
}

function phaseEventTitle(event: PhaseEventCore) {
  const reason = event.reason.toLowerCase();
  if (reason.includes("ha")) return "Ha softened";
  if (event.toPhase === "seed") return "First seed";
  if (event.toPhase === "crystal") return "First crystallization";
  if (event.toPhase === "liquid") return "Started flowing";
  if (event.toPhase === "fossil") return "Fossilized";
  if (event.toPhase === "dissolved") return "Dissolved";
  return `${event.fromPhase ?? "origin"} -> ${event.toPhase}`;
}

function edgeEventTitle(edge: CrystalEdgeCore) {
  if (edge.relation === "resonates_with") return "First resonance";
  if (edge.relation === "ha_softens") return "Ha relation";
  if (edge.relation === "hardens_into") return "Hardening relation";
  if (edge.relation === "dissolves_into") return "Dissolving relation";
  return edge.relation;
}

export function buildCrystallizationTimeline(
  node: CrystalNodeCore,
  edges: CrystalEdgeCore[],
  events: PhaseEventCore[],
): TimelineEvent[] {
  const timeline: TimelineEvent[] = [
    {
      id: `${node.id}:created`,
      at: node.createdAt,
      kind: "created",
      title: "First appeared",
      detail: `${node.title} entered the pool as ${node.phase}.`,
    },
  ];

  for (const event of events.filter((item) => item.nodeId === node.id)) {
    timeline.push({
      id: event.id,
      at: event.createdAt,
      kind: event.reason.toLowerCase().includes("ha") ? "ha" : "phase",
      title: phaseEventTitle(event),
      detail: `${event.fromPhase ?? "origin"} -> ${event.toPhase}: ${
        event.reason
      }`,
    });
  }

  for (const edge of edges.filter(
    (item) => item.fromId === node.id || item.toId === node.id,
  )) {
    timeline.push({
      id: edge.id,
      at: edge.createdAt ?? node.updatedAt,
      kind: "edge",
      title: edgeEventTitle(edge),
      detail:
        edge.fromId === node.id
          ? `${edge.relation} points outward with weight ${edge.weight}.`
          : `${edge.relation} points inward with weight ${edge.weight}.`,
    });
  }

  if (node.phase === "fossil" || (node.crystallizationScore >= 72 && node.emotionHa <= 2)) {
    timeline.push({
      id: `${node.id}:fossil-risk`,
      at: node.updatedAt,
      kind: "risk",
      title: "Fossilization risk",
      detail: "The node is highly crystallized or fossilized without enough ha softness.",
    });
  }

  return timeline.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
}
