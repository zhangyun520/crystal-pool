import { describe, expect, it } from "vitest";
import { validateJiEvent } from "@/lib/ji";
import {
  buildLongGoalHorizonProposals,
  createLongGoalHorizonManifest,
  generateLongGoalHorizonReport,
  longGoalHorizonProposalToJiEvent,
  longGoalHorizonProposalToRfcDraft,
  longGoalHorizonProposalToSandboxInput,
  type LongGoalHorizonContext,
} from "@/lib/longGoalHorizon";
import { validateSandboxRunInput } from "@/lib/sandbox";

const greenContext: LongGoalHorizonContext = {
  generatedAt: "2026-05-16T10:00:00.000Z",
  evidenceStatus: "pass",
  goalCoverageScore: 100,
  openGoalItems: 0,
  pendingJiEvents: 3,
  worldlineCoveragePercent: 100,
  forkCompatibilityStatus: "pass",
  aestheticSmokeStatus: "pass",
};

describe("long-goal horizon", () => {
  it("keeps exploration alive after green evidence", () => {
    const proposals = buildLongGoalHorizonProposals(greenContext);
    const manifest = createLongGoalHorizonManifest({
      runId: "long-goal-horizon-test",
      generatedAt: greenContext.generatedAt,
      proposals,
    });

    expect(proposals.length).toBeGreaterThan(3);
    expect(proposals.map((proposal) => proposal.id)).toContain("LG-HZ-001");
    expect(proposals.some((proposal) => proposal.category === "interface")).toBe(
      true,
    );
    expect(manifest).toMatchObject({
      mode: "long_goal_horizon",
      status: "watch",
      canonicalMutationAllowed: false,
    });
  });

  it("falls back to reliability repair when evidence is not green", () => {
    const proposals = buildLongGoalHorizonProposals({
      ...greenContext,
      evidenceStatus: "warn",
      goalCoverageScore: 90,
      openGoalItems: 1,
    });

    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({
      id: "LG-HZ-000",
      pillar: "RELIABILITY_ETHICS",
      proposalKind: "ENGINEERING_TASK_PROPOSAL",
    });
  });

  it("turns proposals into valid review-gated JiEvents and sandbox inputs", () => {
    const proposal = buildLongGoalHorizonProposals(greenContext)[0];
    const event = validateJiEvent(
      longGoalHorizonProposalToJiEvent({
        proposal,
        runId: "long-goal-horizon-test",
        occurredAt: greenContext.generatedAt,
      }),
    );
    const sandboxInput = validateSandboxRunInput(
      longGoalHorizonProposalToSandboxInput(proposal, event.id),
    );

    expect(event.body).toContain("Candidate kind: next_horizon_signal");
    expect(event.body).toContain("cannot promote canonical pool state");
    expect(sandboxInput.sourceJiEventIds).toEqual([event.id]);
    expect(["FUGUE", "SONATA", "SYMPHONY"]).toContain(sandboxInput.mode);
    expect(sandboxInput.worldlineKey).toBe(proposal.worldlineKey);
  });

  it("generates RFC and report language with the no-auto-promote boundary", () => {
    const proposals = buildLongGoalHorizonProposals(greenContext);
    const manifest = createLongGoalHorizonManifest({
      runId: "long-goal-horizon-test",
      generatedAt: greenContext.generatedAt,
      proposals,
      jiEventsWritten: proposals.length,
      sandboxRunsCreated: 2,
    });
    const draft = longGoalHorizonProposalToRfcDraft(proposals[0]);
    const report = generateLongGoalHorizonReport({
      manifest,
      context: greenContext,
      proposals,
    });

    expect(draft).toContain("Horizon RFC Draft");
    expect(draft).toContain("does not create canonical nodes");
    expect(report).toContain("# Crystal Pool Long Goal Horizon");
    expect(report).toContain("pendingJiEvents: 3");
    expect(report).toContain("must not promote canonical pool state");
  });
});
