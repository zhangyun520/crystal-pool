import { describe, expect, it } from "vitest";
import { ethicalInvariantIds } from "@/lib/ethicalKernel";
import {
  evaluateForkCompatibility,
  forkCompatibilityCriteria,
  generateForkCompatibilityReport,
  type ForkCompatibilityEvidence,
} from "@/lib/forkCompatibility";
import { worldlineKeys } from "@/lib/worldline";

const evidence: ForkCompatibilityEvidence = {
  packageScripts: [
    "constitution:check",
    "repair:queue",
    "worldline:coverage",
  ],
  docs: [
    "docs/philosophy/soulful-data-hopepunk-engineering.md",
    "docs/philosophy/ai-discussion-brief.md",
    "docs/governance/fork-compatibility.md",
  ],
  worldlineKeys,
  ethicalInvariantIds,
  constitutionStatus: "pass",
};

describe("fork compatibility boundary", () => {
  it("defines criteria for open core, closed shell, and incompatibility drift", () => {
    expect(forkCompatibilityCriteria.map((criterion) => criterion.category)).toContain(
      "open_core",
    );
    expect(forkCompatibilityCriteria.map((criterion) => criterion.category)).toContain(
      "closed_shell",
    );
    expect(forkCompatibilityCriteria.map((criterion) => criterion.category)).toContain(
      "incompatibility_boundary",
    );
  });

  it("passes when the ethical core and compatibility document are present", () => {
    const result = evaluateForkCompatibility({
      evidence,
      checkedAt: "2026-05-16T10:00:00.000Z",
    });

    expect(result).toMatchObject({
      status: "pass",
      compatibilityBadge: "compatible",
      canonicalMutationAllowed: false,
    });
    expect(result.summary.fail).toBe(0);
  });

  it("fails when the closed-shell boundary document is missing", () => {
    const result = evaluateForkCompatibility({
      evidence: {
        ...evidence,
        docs: evidence.docs.filter(
          (doc) => doc !== "docs/governance/fork-compatibility.md",
        ),
      },
    });

    expect(result.status).toBe("fail");
    expect(result.compatibilityBadge).toBe("incompatible");
    expect(
      result.criteria.some(
        (criterion) =>
          criterion.id === "CP-FORK-007" && criterion.status === "fail",
      ),
    ).toBe(true);
  });

  it("generates a Markdown report that does not certify forks automatically", () => {
    const result = evaluateForkCompatibility({ evidence });
    const report = generateForkCompatibilityReport(result);

    expect(report).toContain("# Crystal Pool Fork Compatibility Check");
    expect(report).toContain("compatibilityBadge: compatible");
    expect(report).toContain("does not certify external forks automatically");
  });
});
