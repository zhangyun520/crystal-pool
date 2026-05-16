import { type CrystalNodeCore } from "@/lib/domain";

export function nodeFixture(
  override: Partial<CrystalNodeCore> = {},
): CrystalNodeCore {
  return {
    id: "node-a",
    title: "fixture",
    body: "fixture body",
    phase: "gas",
    crystallizationScore: 0,
    entropyResistance: 0,
    publicness: 0,
    privateIntensity: 0,
    emotionFear: 0,
    emotionCuriosity: 0,
    emotionJoy: 0,
    emotionBoredom: 0,
    emotionHa: 0,
    sourceType: "manual",
    sourceRef: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...override,
  };
}
