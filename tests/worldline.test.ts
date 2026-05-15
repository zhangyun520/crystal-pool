import { describe, expect, it } from "vitest";
import { buildSandboxOutputs, validateSandboxRunInput } from "@/lib/sandbox";
import {
  buildWorldlineSandboxInput,
  parseWorldlineKey,
  worldlineKeys,
  worldlineProtocols,
} from "@/lib/worldline";

describe("worldline protocols", () => {
  it("parses all built-in worldline keys and rejects invalid keys clearly", () => {
    for (const key of worldlineKeys) {
      expect(parseWorldlineKey(key)).toBe(key);
      expect(worldlineProtocols[key].purpose).toBeTruthy();
    }
    expect(() => parseWorldlineKey("BRANDED_SPACE_OPERA")).toThrow(
      'Invalid worldline "BRANDED_SPACE_OPERA". Expected',
    );
  });

  it("combines OTHERNESS_MIRROR with Symphony as systemic diagnosis", () => {
    const input = buildWorldlineSandboxInput({
      worldlineKey: "OTHERNESS_MIRROR",
      mode: "SYMPHONY",
    });
    const validated = validateSandboxRunInput(input);
    const [output] = buildSandboxOutputs(validated);

    expect(validated.worldlineKey).toBe("OTHERNESS_MIRROR");
    expect(validated.inputMechanisms.length).toBeGreaterThanOrEqual(2);
    expect(output.kind).toBe("systemic_diagnosis");
  });

  it("combines RETURN_HOME with Sonata as a development arc", () => {
    const input = buildWorldlineSandboxInput({
      worldlineKey: "RETURN_HOME",
      mode: "SONATA",
    });
    const [output] = buildSandboxOutputs(input);

    expect(output.kind).toBe("development_arc");
    if (output.kind === "development_arc") {
      expect(output.sections.exposition.theme).toContain("crystal");
    }
  });

  it("combines GRIMDARK_EMPIRE with Fugue as a failure path", () => {
    const input = buildWorldlineSandboxInput({
      worldlineKey: "GRIMDARK_EMPIRE",
      mode: "FUGUE",
    });
    const [output] = buildSandboxOutputs(input);

    expect(output.kind).toBe("failure_path");
    if (output.kind === "failure_path") {
      expect(output.observedFailure).toContain("Review");
    }
  });

  it("models hopepunk as repair infrastructure rather than empty optimism", () => {
    const input = buildWorldlineSandboxInput({
      worldlineKey: "HOPEPUNK_REPAIR",
      mode: "SONATA",
    });
    const [output] = buildSandboxOutputs(input);

    expect(worldlineProtocols.HOPEPUNK_REPAIR.defaultHypothesis).toContain("repair");
    expect(output.kind).toBe("development_arc");
    if (output.kind === "development_arc") {
      expect(output.sections.coda.proposedRevision).toContain("repair");
    }
  });
});
