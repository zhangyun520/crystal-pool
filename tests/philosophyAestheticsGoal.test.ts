import { describe, expect, it } from "vitest";
import {
  evaluatePhilosophyAestheticsGoal,
  generatePhilosophyAestheticsGoalReport,
  philosophyAestheticsGapCategories,
  philosophyAestheticsPillars,
  philosophyGapToJiEvent,
  philosophyGapToRfcDraft,
  philosophyGapToSandboxInput,
  type PhilosophyAestheticsGoalEvidence,
} from "@/lib/philosophyAestheticsGoal";
import { validateJiEvent } from "@/lib/ji";
import { validateSandboxRunInput } from "@/lib/sandbox";

const evidence: PhilosophyAestheticsGoalEvidence = {
  ethicalInvariants: 11,
  constitutionStatus: "pass",
  hasConstitutionCheckScript: true,
  hasSoulfulDataAssessment: true,
  hasResponsibilityMaturity: true,
  aiMainlineAutoUnlockDisabled: true,
  sandboxModes: ["FUGUE", "SONATA", "SYMPHONY"],
  worldlineKeys: [
    "OTHERNESS_MIRROR",
    "RETURN_HOME",
    "DAO_GOVERNANCE",
    "GRIMDARK_EMPIRE",
    "STELLAR_COMMONWEALTH",
    "AI_DIRECTED_WORLD",
    "HOPEPUNK_REPAIR",
    "FORK_DRIFT",
  ],
  proposalLaneKinds: [
    "ETHICAL_INVARIANT_PROPOSAL",
    "AESTHETIC_SURFACE_PROPOSAL",
    "RFC_DRAFT_PROPOSAL",
    "ESSAY_NOTE_PROPOSAL",
    "ENGINEERING_TASK_PROPOSAL",
    "OBSERVATION_REVIEW",
  ],
  routes: ["/flow", "/observe", "/sandbox", "/ecosystem"],
  docs: [
    "docs/philosophy/soulful-data-hopepunk-engineering.md",
    "docs/philosophy/ai-discussion-brief.md",
  ],
  tests: ["tests/e2e/crystal-pool.spec.ts", ...Array.from({ length: 24 }, (_, index) => `tests/${index}.test.ts`)],
  packageScripts: ["lint", "test", "build", "test:e2e", "constitution:check"],
  pendingJiEvents: 32,
  typedReviewProposals: 16,
  philosophyCandidates: 8,
  philosophyReviewProposals: 8,
  philosophySandboxRuns: 4,
  hasPhilosophyGapAudit: true,
  hasAestheticSmokeScript: false,
  latestAestheticSmokeStatus: "missing",
  latestAestheticSmokeRoutes: [],
  latestAestheticSmokeScreenshots: 0,
  hasRepairQueueScript: false,
  latestRepairQueueStatus: "missing",
  latestRepairQueueItems: 0,
  latestRepairQueueJiEvents: 0,
  latestRepairQueueSandboxRuns: 0,
  hasWorldlineCoverageScript: false,
  latestWorldlineCoverageStatus: "missing",
  latestWorldlineCoveragePercent: 0,
  latestWorldlineCoverageMissingCells: 24,
  latestWorldlineCoverageSandboxRuns: 0,
};

describe("philosophy/aesthetics goal audit", () => {
  it("tracks the full pillar and artifact category space", () => {
    expect(philosophyAestheticsPillars).toContain("HOPEPUNK_REPAIR");
    expect(philosophyAestheticsPillars).toContain("ARTISTIC_OPERATION_SURFACE");
    expect(philosophyAestheticsGapCategories).toEqual([
      "mechanism",
      "interface",
      "protocol",
      "article",
      "test",
      "governance_boundary",
    ]);
  });

  it("evaluates open gaps without claiming the long goal is complete", () => {
    const audit = evaluatePhilosophyAestheticsGoal({
      evidence,
      generatedAt: "2026-05-16T10:00:00.000Z",
    });

    expect(audit.coverageScore).toBeLessThan(100);
    expect(audit.openItems.length).toBeGreaterThan(0);
    expect(audit.requirements.some((item) => item.status === "covered")).toBe(true);
    expect(audit.openItems.map((item) => item.id)).toContain("CP-GOAL-004");
    expect(audit.openItems.map((item) => item.id)).toContain("CP-GOAL-012");
  });

  it("closes the aesthetic screenshot gap only after successful local evidence exists", () => {
    const audit = evaluatePhilosophyAestheticsGoal({
      evidence: {
        ...evidence,
        hasAestheticSmokeScript: true,
        latestAestheticSmokeStatus: "pass",
        latestAestheticSmokeRoutes: ["/flow", "/observe", "/ecosystem", "/sandbox"],
        latestAestheticSmokeScreenshots: 8,
      },
    });
    const screenshotEvidence = audit.requirements.find(
      (item) => item.id === "CP-GOAL-012",
    );

    expect(screenshotEvidence).toMatchObject({ status: "covered" });
    expect(audit.openItems.map((item) => item.id)).not.toContain("CP-GOAL-012");
  });

  it("closes the hopepunk repair gap only after a repair queue run creates review work", () => {
    const audit = evaluatePhilosophyAestheticsGoal({
      evidence: {
        ...evidence,
        hasRepairQueueScript: true,
        latestRepairQueueStatus: "watch",
        latestRepairQueueItems: 2,
        latestRepairQueueJiEvents: 2,
        latestRepairQueueSandboxRuns: 1,
      },
    });
    const repairEvidence = audit.requirements.find(
      (item) => item.id === "CP-GOAL-004",
    );

    expect(repairEvidence).toMatchObject({ status: "covered" });
    expect(audit.openItems.map((item) => item.id)).not.toContain("CP-GOAL-004");
  });

  it("closes the worldline sandbox gap only after full matrix evidence exists", () => {
    const audit = evaluatePhilosophyAestheticsGoal({
      evidence: {
        ...evidence,
        hasWorldlineCoverageScript: true,
        latestWorldlineCoverageStatus: "pass",
        latestWorldlineCoveragePercent: 100,
        latestWorldlineCoverageMissingCells: 0,
        latestWorldlineCoverageSandboxRuns: 12,
      },
    });
    const matrixEvidence = audit.requirements.find(
      (item) => item.id === "CP-GOAL-007",
    );

    expect(matrixEvidence).toMatchObject({ status: "covered" });
    expect(audit.openItems.map((item) => item.id)).not.toContain("CP-GOAL-007");
  });

  it("turns open gaps into review-gated JiEvents and sandbox rehearsals", () => {
    const audit = evaluatePhilosophyAestheticsGoal({ evidence });
    const gap = audit.openItems[0];
    const event = philosophyGapToJiEvent({
      gap,
      runId: "goal-audit-test",
      occurredAt: "2026-05-16T10:00:00.000Z",
    });
    const sandboxInput = philosophyGapToSandboxInput(gap, event.id);

    expect(validateJiEvent(event)).toMatchObject({
      sourceProject: "crystal-pool",
      kind: "manual.note",
      suggestedPhase: expect.any(String),
    });
    expect(event.body).toContain("Domain: PHILOSOPHY_AESTHETICS");
    expect(event.body).toContain(`Proposal kind: ${gap.proposalKind}`);
    expect(event.body).toContain("cannot promote canonical pool state");
    expect(validateSandboxRunInput(sandboxInput)).toMatchObject({
      mode: gap.sandboxMode,
      worldlineKey: gap.worldlineKey,
    });
  });

  it("generates RFC and Markdown reports with explicit non-promotion boundary", () => {
    const audit = evaluatePhilosophyAestheticsGoal({ evidence });
    const draft = philosophyGapToRfcDraft(audit.openItems[0]);
    const report = generatePhilosophyAestheticsGoalReport(audit);

    expect(draft).toContain("## Acceptance Check");
    expect(draft).toContain("does not create canonical nodes");
    expect(report).toContain("# Crystal Pool Philosophy / Aesthetics Goal Audit");
    expect(report).toContain("observe + propose only");
  });
});
