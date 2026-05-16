import { describe, expect, it } from "vitest";
import {
  calculateCrystallizationBreakdown,
  calculateCrystallizationScore,
  suggestPhase,
} from "@/lib/crystallization";
import { type CrystalEdgeCore, type PhaseEventCore } from "@/lib/domain";
import { nodeFixture } from "./helpers";

const now = new Date("2026-05-11T00:00:00Z");

describe("calculateCrystallizationScore", () => {
  it("keeps isolated gas low", () => {
    const score = calculateCrystallizationScore(
      nodeFixture({ createdAt: "2026-05-01T00:00:00Z" }),
      [],
      [],
      now,
    );
    expect(score).toBeLessThan(12);
    expect(suggestPhase(score, nodeFixture())).toBe("gas");
  });

  it("lets a highly connected seed become crystal", () => {
    const node = nodeFixture({
      id: "seed",
      phase: "seed",
      emotionCuriosity: 8,
      emotionJoy: 6,
      publicness: 6,
    });
    const edges: CrystalEdgeCore[] = [
      {
        id: "e1",
        fromId: "seed",
        toId: "b",
        relation: "derives_from",
        weight: 2,
      },
      {
        id: "e2",
        fromId: "c",
        toId: "seed",
        relation: "resonates_with",
        weight: 2,
      },
      {
        id: "e3",
        fromId: "seed",
        toId: "d",
        relation: "triggers",
        weight: 1.6,
      },
    ];
    const events: PhaseEventCore[] = [
      {
        id: "p1",
        nodeId: "seed",
        fromPhase: "liquid",
        toPhase: "seed",
        reason: "manual promotion",
        createdAt: "2026-05-02T00:00:00Z",
      },
    ];
    const score = calculateCrystallizationScore(node, edges, events, now);
    expect(score).toBeGreaterThanOrEqual(72);
    expect(suggestPhase(score, node)).toBe("crystal");
  });

  it("lets boredom cause decay", () => {
    const score = calculateCrystallizationScore(
      nodeFixture({
        phase: "liquid",
        emotionCuriosity: 5,
        emotionBoredom: 9,
        createdAt: "2026-01-01T00:00:00Z",
      }),
      [],
      [],
      now,
    );
    expect(score).toBeLessThan(18);
  });

  it("lets ha soften fossilization without simply inflating everything", () => {
    const fossil = nodeFixture({
      phase: "fossil",
      emotionFear: 8,
      emotionHa: 0,
    });
    const softened = nodeFixture({
      phase: "fossil",
      emotionFear: 8,
      emotionHa: 8,
    });
    const fossilScore = calculateCrystallizationScore(fossil, [], [], now);
    const softenedScore = calculateCrystallizationScore(softened, [], [], now);
    expect(softenedScore).toBeGreaterThan(fossilScore);
    expect(softenedScore).toBeLessThan(70);
  });

  it("does not let contradiction simply increase crystallization", () => {
    const node = nodeFixture({ phase: "seed", emotionCuriosity: 5 });
    const contradictionScore = calculateCrystallizationScore(
      node,
      [
        {
          id: "e1",
          fromId: node.id,
          toId: "other",
          relation: "contradicts",
          weight: 5,
        },
      ],
      [],
      now,
    );
    const resonanceScore = calculateCrystallizationScore(
      node,
      [
        {
          id: "e2",
          fromId: node.id,
          toId: "other",
          relation: "resonates_with",
          weight: 5,
        },
      ],
      [],
      now,
    );
    expect(contradictionScore).toBeLessThan(resonanceScore);
  });

  it("raises score for repeated recent phase promotions", () => {
    const node = nodeFixture({ phase: "seed" });
    const base = calculateCrystallizationScore(node, [], [], now);
    const promoted = calculateCrystallizationScore(
      node,
      [],
      [
        {
          id: "p1",
          nodeId: node.id,
          fromPhase: "gas",
          toPhase: "liquid",
          reason: "flow",
          createdAt: "2026-05-03T00:00:00Z",
        },
        {
          id: "p2",
          nodeId: node.id,
          fromPhase: "liquid",
          toPhase: "seed",
          reason: "nucleus",
          createdAt: "2026-05-04T00:00:00Z",
        },
      ],
      now,
    );
    expect(promoted).toBeGreaterThan(base);
  });

  it("returns an explainable score breakdown", () => {
    const node = nodeFixture({ phase: "seed", emotionCuriosity: 6 });
    const breakdown = calculateCrystallizationBreakdown(node, [], [], now);

    expect(Math.round(breakdown.total)).toBe(
      calculateCrystallizationScore(node, [], [], now),
    );
    expect(breakdown).toHaveProperty("emotionScore");
    expect(breakdown).toHaveProperty("decayPenalty");
  });
});
