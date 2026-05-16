import { describe, expect, it } from "vitest";
import {
  buildFlowLanes,
  buildPhaseDepth,
  calculateFlowPressure,
  rankFlowEvents,
  sideForPhaseTransition,
  sideForRelation,
  type MeaningFlowEvent,
} from "@/lib/meaningFlow";

const events: MeaningFlowEvent[] = [
  {
    id: "phase:1",
    type: "phase",
    side: "crystallize",
    at: "2026-05-13T08:00:02.000Z",
    title: "Meaning seed",
    detail: "gas -> seed",
    intensity: 60,
  },
  {
    id: "edge:1",
    type: "edge",
    side: "soften",
    at: "2026-05-13T08:00:01.000Z",
    title: "Ha edge",
    detail: "ha_softens",
    intensity: 30,
  },
  {
    id: "edge:2",
    type: "edge",
    side: "tension",
    at: "2026-05-13T08:00:00.000Z",
    title: "Contradiction",
    detail: "contradicts",
    intensity: 20,
  },
];

describe("meaning flow", () => {
  it("maps phase transitions and relations to flow sides", () => {
    expect(sideForPhaseTransition({ fromPhase: "gas", toPhase: "seed" })).toBe(
      "crystallize",
    );
    expect(
      sideForPhaseTransition({
        fromPhase: "fossil",
        toPhase: "liquid",
        reason: "Ha Soften",
      }),
    ).toBe("soften");
    expect(sideForPhaseTransition({ fromPhase: "seed", toPhase: "dissolved" })).toBe(
      "dissolve",
    );
    expect(sideForRelation("contradicts")).toBe("tension");
    expect(sideForRelation("ha_softens")).toBe("soften");
  });

  it("ranks events and calculates pressure", () => {
    expect(rankFlowEvents(events).map((event) => event.id)).toEqual([
      "phase:1",
      "edge:1",
      "edge:2",
    ]);

    const pressure = calculateFlowPressure(events);
    expect(pressure.crystallize).toBe(60);
    expect(pressure.soften).toBe(30);
    expect(pressure.tension).toBe(20);
    expect(pressure.netCrystallization).toBe(53);
  });

  it("builds lanes and phase depth", () => {
    const lanes = buildFlowLanes(events);
    expect(lanes.find((lane) => lane.side === "crystallize")?.events).toHaveLength(
      1,
    );

    const depth = buildPhaseDepth({ gas: 1, seed: 2, crystal: 1 });
    expect(depth.find((item) => item.label === "seed")?.share).toBe(50);
  });
});
