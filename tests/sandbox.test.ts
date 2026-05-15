import { describe, expect, it } from "vitest";
import {
  assertSandboxRunMutable,
  buildSandboxOutputs,
  generateSandboxReports,
  parseSandboxMode,
  sandboxModeProtocols,
  sandboxModes,
  validateSandboxRunInput,
} from "@/lib/sandbox";
import {
  sandboxRunStorageLeakCheck,
  toSandboxRunRecord,
  type StoredSandboxRunRecord,
} from "@/lib/sandboxRun";

describe("sandbox modes", () => {
  it("accepts Fugue, Sonata, and Symphony as first-class modes", () => {
    expect(sandboxModes).toEqual(["FUGUE", "SONATA", "SYMPHONY"]);
    expect(parseSandboxMode("FUGUE")).toBe("FUGUE");
    expect(parseSandboxMode("SONATA")).toBe("SONATA");
    expect(parseSandboxMode("SYMPHONY")).toBe("SYMPHONY");
  });

  it("requires a Sonata theme", () => {
    expect(() =>
      validateSandboxRunInput({
        mode: "SONATA",
        title: "No theme",
      }),
    ).toThrow("SONATA sandbox runs require a theme.");
  });

  it("requires Symphony to involve multiple mechanisms or actor groups", () => {
    expect(() =>
      validateSandboxRunInput({
        mode: "SYMPHONY",
        title: "Single mechanism rehearsal",
        inputMechanisms: ["Witness"],
      }),
    ).toThrow(
      "SYMPHONY sandbox runs require at least two affected mechanisms or actor groups.",
    );
  });

  it("keeps Fugue target validation focused on mechanisms or nodes", () => {
    expect(() =>
      validateSandboxRunInput({
        mode: "FUGUE",
        title: "Untargeted",
      }),
    ).toThrow("FUGUE sandbox runs require at least one target mechanism or node.");

    expect(
      validateSandboxRunInput({
        mode: "FUGUE",
        title: "Witness failure path",
        inputMechanisms: ["Witness"],
      }),
    ).toMatchObject({
      mode: "FUGUE",
      inputMechanisms: ["Witness"],
    });
  });

  it("generates Markdown reports for all sandbox philosophies", () => {
    const fugue = buildSandboxOutputs({
      mode: "FUGUE",
      title: "Witness pressure",
      inputMechanisms: ["Witness"],
    });
    const sonata = buildSandboxOutputs({
      mode: "SONATA",
      title: "AI responsibility",
      theme: "AI should participate in meaning crystallization.",
      counterTheme: "AI should not own responsibility currencies.",
    });
    const symphony = buildSandboxOutputs({
      mode: "SYMPHONY",
      title: "Reviewer cascade",
      inputMechanisms: ["AI Review", "Witness"],
    });

    expect(generateSandboxReports({ title: "Witness pressure", outputs: fugue })).toContain(
      "# Fugue Report: Witness pressure",
    );
    expect(generateSandboxReports({ title: "AI responsibility", outputs: sonata })).toContain(
      "## Recapitulation",
    );
    expect(generateSandboxReports({ title: "Reviewer cascade", outputs: symphony })).toContain(
      "## Constitutional Patch",
    );
  });

  it("produces a clear invalid mode error", () => {
    expect(() => parseSandboxMode("MINUET")).toThrow(
      'Invalid sandbox mode "MINUET". Expected FUGUE, SONATA, or SYMPHONY.',
    );
  });

  it("blocks mutation of completed runs except archival metadata", () => {
    expect(() => assertSandboxRunMutable("completed")).toThrow(
      "Completed sandbox runs are immutable except for archival metadata.",
    );
    expect(() => assertSandboxRunMutable("completed", "archive")).not.toThrow();
  });

  it("defines protocol objects beyond decorative labels", () => {
    expect(sandboxModeProtocols.FUGUE.outputKind).toBe("failure_path");
    expect(sandboxModeProtocols.SONATA.replayShape).toEqual([
      "Exposition",
      "Development",
      "Recapitulation",
      "Coda",
    ]);
    expect(sandboxModeProtocols.SYMPHONY.learningImportPolicy).toBe(
      "review_queue_required",
    );
  });

  it("adapts stored runs without leaking historical storage names", () => {
    const stored = {
      id: "run-a",
      mode: "SONATA",
      scenarioKey: "sonata-custom",
      title: "AI responsibility",
      description: "Theme maturation",
      status: "completed",
      seed: 42,
      timeScale: 60,
      currentTick: 4,
      inputNodesJson: "[]",
      inputActorsJson: '["human reviewers"]',
      inputMechanismsJson: '["AI Review"]',
      configJson: JSON.stringify({
        worldlineKey: "AI_DIRECTED_WORLD",
        worldlineHypothesis: "AI can propose without sovereignty.",
        responsibilityQuestion: "Can review remain human-gated?",
        sourceJiEventIds: ["ji-a"],
      }),
      outputsJson: JSON.stringify(
        buildSandboxOutputs({
          mode: "SONATA",
          theme: "AI should participate in meaning crystallization.",
        }),
      ),
      diagnosticsJson: "[]",
      reportMarkdown: "# Sonata Report",
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:01:00.000Z",
      events: [
        {
          id: "event-a",
          kind: "scenario_started",
          tick: 1,
          actorLabel: null,
          title: "Exposition",
          detail: "AI participates.",
          payloadJson: '{"section":"EXPOSITION"}',
          createdAt: "2026-05-15T00:00:00.000Z",
        },
      ],
      learnings: [],
    } satisfies StoredSandboxRunRecord;

    const run = toSandboxRunRecord(stored);

    expect(run.mode).toBe("SONATA");
    expect(run.status).toBe("completed");
    expect(run.worldlineKey).toBe("AI_DIRECTED_WORLD");
    expect(run.sourceJiEventIds).toEqual(["ji-a"]);
    expect(run.immutable).toBe(true);
    expect(run.events[0].payload).toEqual({ section: "EXPOSITION" });
    expect(sandboxRunStorageLeakCheck(run)).toBe(false);
  });
});
