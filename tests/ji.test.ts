import { describe, expect, it } from "vitest";
import {
  buildJiRfcDraft,
  dedupeJiEventLines,
  jiEventToSandboxInput,
  jiSourceProjects,
  parseJiEventJsonl,
  serializeJiEventJsonl,
  validateJiEvent,
  type JiEvent,
} from "@/lib/ji";
import { validateSandboxRunInput } from "@/lib/sandbox";

const baseEvent: JiEvent = {
  id: "ji-test-1",
  sourceProject: "houzuo-nianwu-mv",
  kind: "artifact.rendered",
  title: "Render finished",
  body: "The MV render completed locally and is ready for review.",
  occurredAt: "2026-05-15T08:00:00.000Z",
  refs: [{ label: "render", path: "renders/demo.mp4" }],
  suggestedPhase: "seed",
  ha: 3,
};

describe("JiEvent protocol", () => {
  it("validates the cross-project source and required fields", () => {
    expect(jiSourceProjects).toContain("open-hermes");
    expect(jiSourceProjects).toContain("github");
    expect(validateJiEvent(baseEvent)).toMatchObject({
      sourceProject: "houzuo-nianwu-mv",
      kind: "artifact.rendered",
    });
    expect(() =>
      validateJiEvent({ ...baseEvent, sourceProject: "random-sidecar" }),
    ).toThrow();
    expect(() => validateJiEvent({ ...baseEvent, title: "" })).toThrow();
  });

  it("parses JSONL events and reports invalid lines", () => {
    const text = `${serializeJiEventJsonl([baseEvent])}{bad-json}\n`;
    const parsed = parseJiEventJsonl(text, "mv.jsonl");

    expect(parsed.events).toHaveLength(1);
    expect(parsed.diagnostics).toEqual([
      expect.objectContaining({
        code: "invalid_json",
        file: "mv.jsonl",
        line: 2,
      }),
    ]);
  });

  it("deduplicates imported event ids before database writes", () => {
    const result = dedupeJiEventLines([
      { event: baseEvent, line: 1, file: "a.jsonl" },
      { event: { ...baseEvent, title: "Duplicate" }, line: 2, file: "a.jsonl" },
      {
        event: { ...baseEvent, id: "already-in-db" },
        line: 3,
        file: "a.jsonl",
      },
    ], new Set(["already-in-db"]));

    expect(result.events.map((event) => event.id)).toEqual(["ji-test-1"]);
    expect(result.duplicateEvents).toBe(2);
    expect(result.diagnostics).toHaveLength(2);
  });

  it("maps JiEvents into first-class sandbox protocols", () => {
    const fugue = validateSandboxRunInput(jiEventToSandboxInput(baseEvent, "FUGUE"));
    const sonata = validateSandboxRunInput(jiEventToSandboxInput(baseEvent, "SONATA"));
    const symphony = validateSandboxRunInput(
      jiEventToSandboxInput(baseEvent, "SYMPHONY"),
    );

    expect(fugue.inputMechanisms).toEqual(["后坐念物 MV Artifact rendered"]);
    expect(sonata.theme).toBe("Render finished");
    expect(symphony.inputMechanisms.length).toBeGreaterThanOrEqual(2);
  });

  it("drafts RFC text without making the event canonical", () => {
    expect(buildJiRfcDraft(baseEvent)).toContain("# RFC Draft: Render finished");
    expect(buildJiRfcDraft(baseEvent)).toContain(
      "This RFC draft is not canonical until reviewed inside Crystal Pool.",
    );
  });
});
