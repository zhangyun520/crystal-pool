export const phases = [
  "gas",
  "liquid",
  "seed",
  "crystal",
  "fossil",
  "dissolved",
] as const;

export type Phase = (typeof phases)[number];

export const edgeRelations = [
  "resonates_with",
  "contradicts",
  "triggers",
  "derives_from",
  "hardens_into",
  "dissolves_into",
  "ha_softens",
] as const;

export type EdgeRelation = (typeof edgeRelations)[number];

export const sourceTypes = [
  "manual",
  "chat",
  "file",
  "web",
  "codex",
  "ai",
  "fugue",
  "ecosystem",
] as const;

export type SourceType = (typeof sourceTypes)[number];

export type EmotionVector = {
  fear: number;
  curiosity: number;
  joy: number;
  boredom: number;
  ha: number;
};

export type CrystalNodeCore = {
  id: string;
  poolId?: string;
  title: string;
  body: string;
  phase: Phase;
  crystallizationScore: number;
  entropyResistance: number;
  publicness: number;
  privateIntensity: number;
  emotionFear: number;
  emotionCuriosity: number;
  emotionJoy: number;
  emotionBoredom: number;
  emotionHa: number;
  sourceType: SourceType;
  sourceRef?: string | null;
  archivedAt?: Date | string | null;
  archiveReason?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type CrystalEdgeCore = {
  id: string;
  fromId: string;
  toId: string;
  relation: EdgeRelation;
  weight: number;
  createdAt?: Date | string;
};

export type PhaseEventCore = {
  id: string;
  nodeId: string;
  fromPhase?: Phase | null;
  toPhase: Phase;
  reason: string;
  createdAt: Date | string;
};

export function clamp(value: number, min = 0, max = 100) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function emotionVectorFromNode(node: Pick<
  CrystalNodeCore,
  | "emotionFear"
  | "emotionCuriosity"
  | "emotionJoy"
  | "emotionBoredom"
  | "emotionHa"
>): EmotionVector {
  return {
    fear: node.emotionFear,
    curiosity: node.emotionCuriosity,
    joy: node.emotionJoy,
    boredom: node.emotionBoredom,
    ha: node.emotionHa,
  };
}
