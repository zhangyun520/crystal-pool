import { describe, expect, it } from "vitest";
import { getHakimiSuggestions } from "@/lib/hakimi";
import { nodeFixture } from "./helpers";

describe("getHakimiSuggestions", () => {
  it("flags high-score low-ha crystals", () => {
    const [suggestion] = getHakimiSuggestions(
      [
        nodeFixture({
          id: "hard",
          title: "绝对不可动摇的总纲",
          phase: "crystal",
          crystallizationScore: 82,
          emotionHa: 1,
        }),
      ],
      [],
    );
    expect(suggestion.action).toBe("ha_soften");
  });

  it("flags hardening-heavy relation neighborhoods", () => {
    const [suggestion] = getHakimiSuggestions(
      [nodeFixture({ id: "a", phase: "seed", crystallizationScore: 40 })],
      [
        {
          id: "e1",
          fromId: "a",
          toId: "b",
          relation: "hardens_into",
          weight: 1,
        },
        {
          id: "e2",
          fromId: "c",
          toId: "a",
          relation: "hardens_into",
          weight: 1,
        },
      ],
    );
    expect(suggestion.reason).toContain("硬化关系多");
  });
});
