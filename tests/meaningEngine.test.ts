import { describe, expect, it } from "vitest";
import { calculateCrystallizationBreakdown } from "@/lib/crystallization";
import {
  buildCrystallizationTimeline,
  explainScoreNow,
  explainScoreBreakdown,
  suggestPhaseInterventions,
  summarizeScoreDrivers,
} from "@/lib/meaningEngine";
import { type CrystalEdgeCore, type PhaseEventCore } from "@/lib/domain";
import { nodeFixture } from "./helpers";

describe("meaning engine", () => {
  it("explains the strongest score drivers", () => {
    const node = nodeFixture({
      id: "meaning",
      phase: "seed",
      emotionCuriosity: 8,
      emotionJoy: 5,
      emotionHa: 3,
    });
    const edges: CrystalEdgeCore[] = [
      {
        id: "edge",
        fromId: "meaning",
        toId: "other",
        relation: "resonates_with",
        weight: 2,
      },
    ];
    const events: PhaseEventCore[] = [
      {
        id: "event",
        nodeId: "meaning",
        fromPhase: "liquid",
        toPhase: "seed",
        reason: "promotion",
        createdAt: "2026-05-10T00:00:00Z",
      },
    ];

    const breakdown = calculateCrystallizationBreakdown(
      node,
      edges,
      events,
      new Date("2026-05-12T00:00:00Z"),
    );
    const explanations = explainScoreBreakdown(breakdown, node, edges, events);

    expect(explanations.map((item) => item.label)).toContain("Relations");
    expect(summarizeScoreDrivers(explanations)[0]).toContain("Phase base");
  });

  it("explains why this score is happening now", () => {
    const node = nodeFixture({
      id: "meaning",
      phase: "seed",
      emotionCuriosity: 7,
      emotionHa: 2,
      updatedAt: "2026-05-12T00:00:00Z",
    });
    const edges: CrystalEdgeCore[] = [
      {
        id: "edge",
        fromId: "meaning",
        toId: "time",
        relation: "derives_from",
        weight: 3,
        createdAt: "2026-05-11T00:00:00Z",
      },
    ];
    const events: PhaseEventCore[] = [
      {
        id: "event",
        nodeId: "meaning",
        fromPhase: "liquid",
        toPhase: "seed",
        reason: "Daily review promoted the residue",
        createdAt: "2026-05-10T00:00:00Z",
      },
    ];
    const breakdown = calculateCrystallizationBreakdown(
      node,
      edges,
      events,
      new Date("2026-05-12T00:00:00Z"),
    );

    const explanation = explainScoreNow(
      node,
      breakdown,
      edges,
      events,
      new Date("2026-05-12T00:00:00Z"),
    );

    expect(explanation.headline).toContain("Current score");
    expect(explanation.phaseFit).toContain("band");
    expect(explanation.lastChange?.label).toBe("derives_from");
    expect(explanation.drivers.map((driver) => driver.kind)).toContain(
      "relation",
    );
    expect(explanation.drivers.map((driver) => driver.kind)).toContain(
      "emotion",
    );
  });

  it("suggests phase interventions without changing the node", () => {
    const fossil = nodeFixture({
      phase: "fossil",
      crystallizationScore: 44,
      emotionHa: 0,
    });

    const suggestions = suggestPhaseInterventions(fossil, [], []);

    expect(suggestions).toContainEqual(
      expect.objectContaining({
        targetPhase: "liquid",
        severity: "urgent",
      }),
    );
    expect(fossil.phase).toBe("fossil");
  });

  it("builds a chronological crystallization timeline", () => {
    const node = nodeFixture({
      id: "node",
      createdAt: "2026-05-01T00:00:00Z",
      updatedAt: "2026-05-04T00:00:00Z",
    });
    const timeline = buildCrystallizationTimeline(
      node,
      [
        {
          id: "edge",
          fromId: "node",
          toId: "other",
          relation: "triggers",
          weight: 1,
          createdAt: "2026-05-03T00:00:00Z",
        },
      ],
      [
        {
          id: "phase",
          nodeId: "node",
          fromPhase: "gas",
          toPhase: "liquid",
          reason: "flow",
          createdAt: "2026-05-02T00:00:00Z",
        },
      ],
    );

    expect(timeline.map((event) => event.kind)).toEqual([
      "created",
      "phase",
      "edge",
    ]);
    expect(timeline[1].title).toBe("Started flowing");
    expect(timeline[2].title).toBe("triggers");
  });
});
