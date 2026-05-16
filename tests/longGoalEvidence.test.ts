import { describe, expect, it } from "vitest";
import {
  createLongGoalEvidenceManifest,
  generateLongGoalEvidenceReport,
  longGoalObjective,
  type LongGoalEvidenceBundle,
} from "@/lib/longGoalEvidence";

const bundle: LongGoalEvidenceBundle = {
  objective: longGoalObjective,
  generatedAt: "2026-05-16T10:00:00.000Z",
  items: [
    {
      id: "LG-EV-001",
      title: "Goal compass",
      status: "pass",
      proof: "coverageScore=100",
      command: "npm run philosophy:gap-audit -- --dry-run",
      artifact: "data/ecosystem/philosophy-goal-audits/<run-id>/report.md",
      boundary: "No canonical promotion.",
    },
    {
      id: "LG-EV-002",
      title: "Aesthetic smoke",
      status: "warn",
      proof: "No smoke artifact found yet.",
      command: "npm run ui:aesthetic-smoke",
      boundary: "Local screenshots only.",
    },
  ],
};

describe("long-goal evidence bundle", () => {
  it("summarizes evidence status without claiming goal completion", () => {
    const manifest = createLongGoalEvidenceManifest({
      runId: "long-goal-evidence-test",
      bundle,
    });

    expect(manifest).toMatchObject({
      mode: "long_goal_evidence_bundle",
      status: "warn",
      pass: 1,
      warn: 1,
      fail: 0,
      canonicalMutationAllowed: false,
    });
  });

  it("generates a Markdown report with the active objective and boundaries", () => {
    const manifest = createLongGoalEvidenceManifest({
      runId: "long-goal-evidence-test",
      bundle,
    });
    const report = generateLongGoalEvidenceReport({ manifest, bundle });

    expect(report).toContain("# Crystal Pool Long Goal Evidence Bundle");
    expect(report).toContain("长期自动探索 Crystal Pool");
    expect(report).toContain("goal remains");
    expect(report).toContain("does not promote canonical nodes");
  });
});
