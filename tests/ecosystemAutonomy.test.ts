import { describe, expect, it } from "vitest";
import {
  buildEcosystemAutonomyObservations,
  buildEcosystemAutonomyProposals,
  createEcosystemAutonomyManifest,
  generateEcosystemAutonomyReport,
  type EcosystemAutonomyContext,
} from "@/lib/ecosystemAutonomy";
import { calculateResponsibilityMaturity } from "@/lib/responsibilityMaturity";

function context(overrides: Partial<EcosystemAutonomyContext> = {}): EcosystemAutonomyContext {
  return {
    runId: "cycle-a",
    now: "2026-05-15T00:00:00.000Z",
    pendingJiEvents: 0,
    inboxErrors: 0,
    importedJiEvents: 0,
    sandboxRuns: 0,
    completedSandboxRuns: 0,
    sandboxByWorldline: {},
    anchorPending: 0,
    anchorExported: 0,
    repo: {
      root: "/tmp/crystal-pool",
      branch: "main",
      dirtyFiles: 0,
      hasRemote: false,
    },
    maturity: calculateResponsibilityMaturity({
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
    ...overrides,
  };
}

describe("ecosystem autonomy cycle planning", () => {
  it("generates observe-and-propose artifacts without canonical mutation", () => {
    const input = context({ pendingJiEvents: 2 });
    const observations = buildEcosystemAutonomyObservations(input);
    const proposals = buildEcosystemAutonomyProposals(input);
    const manifest = createEcosystemAutonomyManifest({
      context: input,
      observations,
      proposals,
    });

    expect(observations.map((item) => item.kind)).toContain("ji.inbox");
    expect(proposals.map((item) => item.kind)).toContain("JI_REVIEW_QUEUE");
    expect(manifest.canonicalMutationAllowed).toBe(false);
    expect(manifest.allowedWrites).toEqual(
      expect.arrayContaining(["JiEventRecord import from JSONL inbox"]),
    );
  });

  it("proposes worldline rehearsals when coverage is missing", () => {
    const proposals = buildEcosystemAutonomyProposals(context(), { maxProposals: 8 });
    const worldline = proposals.find(
      (proposal) => proposal.kind === "WORLDLINE_REHEARSAL",
    );

    expect(worldline?.worldlineKey).toBe("OTHERNESS_MIRROR");
    expect(worldline?.mode).toBe("SYMPHONY");
    expect(worldline?.command).toContain("npm run worldline:run");
  });

  it("reports the no-auto-unlock boundary", () => {
    const input = context();
    const report = generateEcosystemAutonomyReport({
      context: input,
      observations: buildEcosystemAutonomyObservations(input),
      proposals: buildEcosystemAutonomyProposals(input),
    });

    expect(report).toContain("observe + propose only");
    expect(report).toContain("canAutoUnlock: false");
    expect(report).toContain("HOPEPUNK_REPAIR");
  });
});
