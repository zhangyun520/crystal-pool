import { describe, expect, it } from "vitest";
import {
  buildFugueTimeline,
  fugueScenarios,
  getFugueScenario,
} from "@/lib/fugue";

describe("Crystal Fugue sandbox", () => {
  it("exposes the planned pressure-test scenarios", () => {
    expect(fugueScenarios.map((scenario) => scenario.key)).toEqual([
      "inquisition",
      "frenzy",
      "eldar",
      "bubble",
      "governance-lab",
    ]);
    expect(getFugueScenario("bubble")?.title).toBe("Bubble Market");
    expect(getFugueScenario("unknown")).toBeUndefined();
  });

  it("builds deterministic replay timelines from scenario and seed", () => {
    const scenario = getFugueScenario("governance-lab");
    if (!scenario) throw new Error("Missing governance-lab scenario.");

    const first = buildFugueTimeline({ scenario, seed: 42, ticks: 8 });
    const second = buildFugueTimeline({ scenario, seed: 42, ticks: 8 });
    const differentSeed = buildFugueTimeline({ scenario, seed: 43, ticks: 8 });

    expect(first).toEqual(second);
    expect(first).not.toEqual(differentSeed);
    expect(first[0]).toMatchObject({
      kind: "scenario_started",
      tick: 1,
      title: "Governance Lab started",
    });
    expect(first.at(-1)).toMatchObject({
      kind: "learning_proposed",
      tick: 8,
      detail: scenario.learningGoal,
    });
  });
});
