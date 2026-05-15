import {
  clamp,
  type CrystalEdgeCore,
  type CrystalNodeCore,
  type EdgeRelation,
  type Phase,
  type PhaseEventCore,
} from "./domain";

export const phaseBase: Record<Phase, number> = {
  gas: 4,
  liquid: 14,
  seed: 30,
  crystal: 54,
  fossil: 42,
  dissolved: 2,
};

export const relationContribution: Record<EdgeRelation, number> = {
  resonates_with: 6,
  contradicts: 0.5,
  triggers: 5,
  derives_from: 7,
  hardens_into: 4,
  dissolves_into: -4,
  ha_softens: 2,
};

const promotionPhases = new Set<Phase>(["liquid", "seed", "crystal"]);

function daysSince(value: Date | string, now: Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Math.max(0, (now.getTime() - date.getTime()) / 86_400_000);
}

function isRecent(value: Date | string, now: Date, days = 21) {
  return daysSince(value, now) <= days;
}

export type ScoreBreakdown = {
  base: number;
  relationScore: number;
  emotionScore: number;
  promotionScore: number;
  resilienceScore: number;
  decayPenalty: number;
  phasePenalty: number;
  total: number;
};

export function calculateCrystallizationBreakdown(
  node: CrystalNodeCore,
  edges: CrystalEdgeCore[],
  events: PhaseEventCore[] = [],
  now = new Date(),
): ScoreBreakdown {
  const connectedEdges = edges.filter(
    (edge) => edge.fromId === node.id || edge.toId === node.id,
  );

  const relationScore = clamp(
    connectedEdges.reduce((sum, edge) => {
      const weight = clamp(edge.weight, 0, 10);
      return sum + relationContribution[edge.relation] * weight;
    }, 0),
    -20,
    34,
  );

  const emotionIntensity =
    node.emotionCuriosity * 1.8 +
    node.emotionJoy * 1.4 +
    node.emotionFear * 0.9 +
    node.privateIntensity * 0.8 +
    node.publicness * 0.8;

  const boredomPenalty = node.emotionBoredom * 2.6;
  const emotionScore = clamp(emotionIntensity - boredomPenalty, -22, 26);

  const promotionScore = clamp(
    events
      .filter((event) => event.nodeId === node.id)
      .filter((event) => promotionPhases.has(event.toPhase))
      .reduce((sum, event) => sum + (isRecent(event.createdAt, now) ? 6 : 2), 0),
    0,
    18,
  );

  const ha = clamp(node.emotionHa, 0, 10);
  const overHardening = node.phase === "fossil" || node.emotionFear >= 8;
  const resilienceScore = ha * (overHardening ? 1.7 : 0.7);

  const age = daysSince(node.createdAt, now);
  const isolated = connectedEdges.length === 0;
  const decayPenalty =
    (isolated && age > 30 ? Math.min(18, (age - 30) / 3) : 0) +
    (node.emotionBoredom >= 7 ? 8 : 0);

  const phasePenalty =
    node.phase === "dissolved"
      ? 24
      : node.phase === "fossil"
        ? Math.max(2, 16 - ha * 1.5)
        : 0;

  const total = clamp(
    phaseBase[node.phase] +
      relationScore +
      emotionScore +
      promotionScore +
      resilienceScore -
      decayPenalty -
      phasePenalty,
  );

  return {
    base: phaseBase[node.phase],
    relationScore,
    emotionScore,
    promotionScore,
    resilienceScore,
    decayPenalty,
    phasePenalty,
    total,
  };
}

export function calculateCrystallizationScore(
  node: CrystalNodeCore,
  edges: CrystalEdgeCore[],
  events: PhaseEventCore[] = [],
  now = new Date(),
) {
  return Math.round(
    calculateCrystallizationBreakdown(node, edges, events, now).total,
  );
}

export function suggestPhase(score: number, node: CrystalNodeCore): Phase {
  if (node.phase === "dissolved" && score < 18) return "dissolved";
  if (node.phase === "fossil" && node.emotionHa < 4 && score < 55) {
    return "fossil";
  }
  if (score >= 72) return "crystal";
  if (score >= 45) return "seed";
  if (score >= 18) return "liquid";
  return "gas";
}
