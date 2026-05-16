import { describe, expect, it } from "vitest";
import {
  aiDirectorJsonSchema,
  aiDirectorOutputSchema,
  canHumanUseAIPool,
  normalizeDirectorModel,
} from "@/lib/aiPool";

describe("AI-directed pool", () => {
  it("allows humans to observe and suggest but blocks direct mutation", () => {
    expect(canHumanUseAIPool("observe")).toBe(true);
    expect(canHumanUseAIPool("suggest")).toBe(true);
    expect(canHumanUseAIPool("create_node")).toBe(false);
    expect(canHumanUseAIPool("create_edge")).toBe(false);
    expect(canHumanUseAIPool("transition_phase")).toBe(false);
  });

  it("normalizes director model configuration", () => {
    expect(normalizeDirectorModel(" gpt-5.5 ")).toBe("gpt-5.5");
    expect(normalizeDirectorModel("")).toBe("gpt-5.5");
    expect(normalizeDirectorModel(null)).toBe("gpt-5.5");
  });

  it("accepts structured output with explicit null optional fields", () => {
    const parsed = aiDirectorOutputSchema.parse({
      summary: "No mutation needed.",
      decisions: [
        {
          kind: "no_op",
          rationale: "The pool is stable.",
          title: null,
          body: null,
          phase: null,
          targetNodeId: null,
          fromNodeId: null,
          toNodeId: null,
          relation: null,
          weight: null,
        },
      ],
    });

    expect(parsed.decisions[0]).toEqual({
      kind: "no_op",
      rationale: "The pool is stable.",
      title: undefined,
      body: undefined,
      phase: undefined,
      targetNodeId: undefined,
      fromNodeId: undefined,
      toNodeId: undefined,
      relation: undefined,
      weight: undefined,
    });
  });

  it("uses a strict nullable JSON schema for OpenAI structured output", () => {
    const item = aiDirectorJsonSchema.properties.decisions.items;
    expect(item.additionalProperties).toBe(false);
    expect(item.required).toContain("targetNodeId");
    expect(item.required).toContain("weight");
    expect(item.properties.phase.enum).toContain(null);
  });
});
