import { describe, expect, it } from "vitest";
import {
  calculateResponsibilityMaturity,
  generateResponsibilityMaturityReport,
} from "@/lib/responsibilityMaturity";

describe("AI responsibility maturity", () => {
  it("keeps the AI mainline locked when traceability and reversibility are missing", () => {
    const snapshot = calculateResponsibilityMaturity({
      totalDecisions: 10,
      traceableDecisions: 2,
      reversibleDecisions: 1,
      invalidOrFailedDecisions: 0,
      reviewedSuggestions: 1,
      openSuggestions: 4,
      completedSandboxRuns: 0,
      sandboxedAiRuns: 0,
      repairSignals: 0,
      nonSovereignBoundaries: 3,
    });

    expect(snapshot.status).toBe("locked");
    expect(snapshot.proposalKind).toBeUndefined();
    expect(snapshot.canAutoUnlock).toBe(false);
    expect(snapshot.blockingReasons).toEqual(
      expect.arrayContaining(["Traceability below 60.", "Reversibility below 60."]),
    );
  });

  it("can only generate a review proposal even at high maturity", () => {
    const snapshot = calculateResponsibilityMaturity({
      totalDecisions: 10,
      traceableDecisions: 10,
      reversibleDecisions: 10,
      invalidOrFailedDecisions: 0,
      reviewedSuggestions: 10,
      openSuggestions: 0,
      completedSandboxRuns: 4,
      sandboxedAiRuns: 2,
      repairSignals: 3,
      nonSovereignBoundaries: 3,
    });

    expect(snapshot.status).toBe("reviewable");
    expect(snapshot.proposalKind).toBe("AI_MAINLINE_PROPOSAL");
    expect(snapshot.reviewRequired).toBe(true);
    expect(snapshot.canAutoUnlock).toBe(false);
    expect(snapshot.recommendedProposal).toContain("Do not change AI permissions automatically");
  });

  it("renders a Markdown maturity report with the locked boundary", () => {
    const report = generateResponsibilityMaturityReport(
      calculateResponsibilityMaturity({
        totalDecisions: 0,
        traceableDecisions: 0,
        reversibleDecisions: 0,
        invalidOrFailedDecisions: 0,
        reviewedSuggestions: 0,
        openSuggestions: 0,
        completedSandboxRuns: 0,
        sandboxedAiRuns: 0,
        repairSignals: 0,
        nonSovereignBoundaries: 3,
      }),
    );

    expect(report).toContain("# AI Responsibility Maturity");
    expect(report).toContain("- canAutoUnlock: false");
  });
});
