import { describe, expect, it } from "vitest";
import { applyHaSoften, transitionNodePhase } from "@/lib/phase";
import { nodeFixture } from "./helpers";

describe("phase transitions", () => {
  it("records a normal phase transition", () => {
    const result = transitionNodePhase(
      nodeFixture({ phase: "gas" }),
      "seed",
      "manual promotion",
    );
    expect(result.node.phase).toBe("seed");
    expect(result.event.fromPhase).toBe("gas");
    expect(result.event.toPhase).toBe("seed");
  });

  it("moves fossil nodes to liquid when ha-softened", () => {
    const result = applyHaSoften(
      nodeFixture({ phase: "fossil", emotionHa: 4 }),
    );
    expect(result.node.phase).toBe("liquid");
    expect(result.node.emotionHa).toBe(6);
    expect(result.event.toPhase).toBe("liquid");
  });

  it("keeps non-fossil phase while raising ha", () => {
    const result = applyHaSoften(nodeFixture({ phase: "crystal", emotionHa: 9 }));
    expect(result.node.phase).toBe("crystal");
    expect(result.node.emotionHa).toBe(10);
  });
});
