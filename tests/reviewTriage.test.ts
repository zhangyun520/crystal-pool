import { describe, expect, it } from "vitest";
import {
  buildHumaneReviewTriage,
  buildHumaneReviewTriageItem,
  type ReviewableJiEvent,
} from "@/lib/reviewTriage";

const baseEvent: ReviewableJiEvent = {
  id: "triage-event-1",
  sourceProject: "crystal-pool",
  kind: "manual.note",
  title: "Reviewer burden and humane triage cockpit",
  body: [
    "Domain: PHILOSOPHY_AESTHETICS",
    "Candidate kind: next_horizon_signal",
    "Proposal kind: AESTHETIC_SURFACE_PROPOSAL",
    "Review question: How can review stay humane?",
    "Acceptance check: Reviewer can see decision cost and reversibility.",
  ].join("\n"),
  occurredAt: "2026-05-16T10:00:00.000Z",
  refs: [{ label: "horizon", hash: "LG-HZ-001" }],
  status: "pending",
  createdAt: "2026-05-16T10:01:00.000Z",
};

describe("humane review triage", () => {
  it("routes aesthetic surface proposals toward reversible sandbox review", () => {
    const item = buildHumaneReviewTriageItem(baseEvent);

    expect(item).toMatchObject({
      eventId: "triage-event-1",
      domain: "PHILOSOPHY_AESTHETICS",
      proposalKind: "AESTHETIC_SURFACE_PROPOSAL",
      nextAction: "create_sandbox",
      decisionCost: "medium",
      reversibility: "reversible",
      canonicalMutationAllowed: false,
    });
    expect(item.acceptanceCheck).toContain("Reviewer can see decision cost");
  });

  it("makes weak soulful-data signals redress-first instead of import-first", () => {
    const item = buildHumaneReviewTriageItem({
      ...baseEvent,
      id: "weak-signal",
      sourceProject: "chrome",
      body: "Captured remote page text without refs or repair path.",
      refs: undefined,
    });

    expect(item.nextAction).toBe("request_redress");
    expect(item.decisionCost).toBe("high");
    expect(item.reversibility).toBe("review_required");
    expect(item.weakSoulfulSignals).toBeGreaterThanOrEqual(2);
  });

  it("summarizes backlog pressure without canonical mutation", () => {
    const summary = buildHumaneReviewTriage({
      events: [
        baseEvent,
        {
          ...baseEvent,
          id: "rfc-event",
          body: "Proposal kind: RFC_DRAFT_PROPOSAL\nAcceptance check: Draft before mutation.",
        },
      ],
      totalPending: 150,
      generatedAt: "2026-05-16T10:02:00.000Z",
    });

    expect(summary.pressure).toBe("saturated");
    expect(summary.counts.today).toBe(1);
    expect(summary.counts.highCost).toBe(1);
    expect(summary.counts.reversible).toBe(2);
    expect(summary.canonicalMutationAllowed).toBe(false);
    expect(summary.pressureDetail).toContain("overwhelm human review");
  });
});
