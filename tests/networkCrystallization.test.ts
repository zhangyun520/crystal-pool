import { describe, expect, it } from "vitest";
import {
  buildNetworkCrystallizationChain,
  candidateToJiEvent,
  candidateToJiEventId,
  candidateToReviewProposal,
  codingCandidateToSandboxInput,
  codingAutomationCrystallizationSources,
  generateNetworkCrystallizationReport,
  networkCandidateToSandboxInput,
  parseCrystallizationDomain,
  parseNetworkFeed,
  philosophyAestheticsCrystallizationSources,
  selectNetworkCandidates,
  sourcesForCrystallizationDomain,
  type NetworkCrystallizationManifest,
  type NetworkCrystallizationSource,
} from "@/lib/networkCrystallization";
import { validateJiEvent } from "@/lib/ji";

const source: NetworkCrystallizationSource = {
  id: "test-research",
  label: "Test Research Feed",
  url: "https://example.com/feed.xml",
  kind: "rss",
  qualityTier: "research",
  category: "test",
  trustReason: "fixture source for deterministic tests",
  queryHints: ["agency", "repair", "alignment"],
  defaultTags: ["network", "research"],
};

const rss = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title>Human agency and repair in accountable alignment systems</title>
    <link>https://example.com/research/agency-repair</link>
    <pubDate>Fri, 15 May 2026 10:00:00 GMT</pubDate>
    <description>Accountable alignment systems need traceable provenance, reviewable agency boundaries, reversible decisions, and visible repair paths before operational claims become trusted infrastructure.</description>
  </item>
  <item>
    <title>Short note</title>
    <link>https://example.com/short</link>
    <description>tiny</description>
  </item>
</channel></rss>`;

const atom = `<?xml version="1.0"?>
<feed>
  <entry>
    <title>Repair-centered interface governance for collaborative agents</title>
    <link href="https://example.com/atom/repair-interface" />
    <updated>2026-05-15T11:00:00.000Z</updated>
    <summary>Collaborative agents are safer when user interface states preserve responsibility, show why a proposal exists, and leave enough context for repair rather than passive deference.</summary>
  </entry>
</feed>`;

describe("network crystallization skill", () => {
  it("parses RSS and Atom feeds into quality-scored candidates", () => {
    const candidates = [
      ...parseNetworkFeed(rss, source),
      ...parseNetworkFeed(atom, { ...source, kind: "atom" }),
    ];
    const selected = selectNetworkCandidates(candidates, {
      minQuality: 72,
      maxItems: 4,
    });

    expect(candidates).toHaveLength(3);
    expect(selected.map((candidate) => candidate.title)).toContain(
      "Human agency and repair in accountable alignment systems",
    );
    expect(selected.every((candidate) => candidate.qualityScore >= 72)).toBe(true);
  });

  it("parses crystallization domains and separates source quotas", () => {
    expect(parseCrystallizationDomain("coding")).toBe("CODING_AUTOMATION");
    expect(parseCrystallizationDomain("philosophy")).toBe(
      "PHILOSOPHY_AESTHETICS",
    );
    expect(parseCrystallizationDomain("AI_RESEARCH")).toBe("AI_RESEARCH");
    expect(() => parseCrystallizationDomain("finance")).toThrow(
      /Invalid crystallization domain/,
    );
    expect(
      sourcesForCrystallizationDomain("CODING_AUTOMATION").every(
        (item) => item.domain === "CODING_AUTOMATION",
      ),
    ).toBe(true);
    expect(sourcesForCrystallizationDomain("AI_RESEARCH")).toHaveLength(3);
    expect(
      sourcesForCrystallizationDomain("PHILOSOPHY_AESTHETICS").every(
        (item) => item.domain === "PHILOSOPHY_AESTHETICS",
      ),
    ).toBe(true);
  });

  it("deduplicates known JiEvent ids before writing a new review signal", () => {
    const [candidate] = parseNetworkFeed(rss, source);
    const knownEventIds = new Set([candidateToJiEventId(candidate)]);
    const selected = selectNetworkCandidates([candidate], { knownEventIds });

    expect(selected).toEqual([]);
  });

  it("builds a deterministic local chain and valid JiEvent observations", () => {
    const candidates = selectNetworkCandidates(parseNetworkFeed(rss, source), {
      minQuality: 72,
      maxItems: 1,
    });
    const chain = buildNetworkCrystallizationChain({
      candidates,
      previousHash: "previous-hash",
      createdAt: "2026-05-16T00:00:00.000Z",
    });
    const event = candidateToJiEvent(candidates[0], chain[0]);

    expect(chain).toHaveLength(1);
    expect(chain[0].previousHash).toBe("previous-hash");
    expect(chain[0].eventHash).toHaveLength(64);
    expect(validateJiEvent(event)).toMatchObject({
      sourceProject: "network",
      kind: "memory.learned",
      suggestedPhase: "seed",
    });
    expect(event.body).toContain("Domain: AI_RESEARCH");
    expect(event.body).toContain("Candidate kind: ai_research_signal");
    expect(event.body).toContain("Proposal kind: OBSERVATION_REVIEW");
    expect(event.body).toContain("Chain hash:");
    expect(event.body).toContain("Acceptance check:");
    expect(event.body).toContain("Review question:");
  });

  it("turns coding candidates into reviewable JiEvents and sandbox inputs", () => {
    const [candidate] = parseNetworkFeed(
      `<?xml version="1.0"?><feed>
        <entry>
          <title>Agent sandbox architecture for repo review</title>
          <link href="https://github.com/openai/codex/releases/tag/v1" />
          <updated>2026-05-15T11:00:00.000Z</updated>
          <summary>Agent tooling adds permission boundaries, sandbox review, modular architecture, and rollback paths for coding automation.</summary>
        </entry>
      </feed>`,
      codingAutomationCrystallizationSources[0],
    );
    const event = candidateToJiEvent(candidate);
    const sandbox = codingCandidateToSandboxInput(candidate, event.id);

    expect(candidate.domain).toBe("CODING_AUTOMATION");
    expect(candidate.candidateKind).toBe("ai_coding_agent_pattern");
    expect(candidate.proposalKind).toBe("RFC_DRAFT_PROPOSAL");
    expect(event.body).toContain("Domain: CODING_AUTOMATION");
    expect(event.body).toContain("Candidate kind: ai_coding_agent_pattern");
    expect(event.body).toContain("Proposal kind: RFC_DRAFT_PROPOSAL");
    expect(event.refs?.some((ref) => ref.label === "repo")).toBe(true);
    expect(event.refs?.some((ref) => ref.label === "proposal-kind")).toBe(true);
    expect(sandbox.mode).toBe("SONATA");
    expect(sandbox.worldlineKey).toBe("AI_DIRECTED_WORLD");
    expect(sandbox.sourceJiEventIds).toEqual([event.id]);
  });

  it("maps coding signal kinds to distinct sandbox worldlines", () => {
    const baseCandidate = parseNetworkFeed(rss, {
      ...source,
      domain: "CODING_AUTOMATION",
      candidateKind: "repo_architecture_signal",
      repo: "openai/codex",
    })[0];

    expect(
      codingCandidateToSandboxInput({
        ...baseCandidate,
        candidateKind: "tooling_failure_signal",
      }).mode,
    ).toBe("FUGUE");
    expect(
      codingCandidateToSandboxInput({
        ...baseCandidate,
        candidateKind: "repo_architecture_signal",
      }).worldlineKey,
    ).toBe("STELLAR_COMMONWEALTH");
    expect(
      codingCandidateToSandboxInput({
        ...baseCandidate,
        candidateKind: "programming_paradigm_signal",
      }).worldlineKey,
    ).toBe("DAO_GOVERNANCE");
  });

  it("turns philosophy/aesthetics signals into review-gated sandbox inputs", () => {
    const [candidate] = parseNetworkFeed(
      `<?xml version="1.0"?><rss><channel>
        <item>
          <title>Hope as repair infrastructure for humane interfaces</title>
          <link>https://example.com/essays/hope-repair-interface</link>
          <pubDate>Fri, 15 May 2026 10:00:00 GMT</pubDate>
          <description>Hopepunk systems need provenance, consent, repair capacity, interface beauty, and human responsibility before aesthetic language can become trustworthy infrastructure.</description>
        </item>
      </channel></rss>`,
      philosophyAestheticsCrystallizationSources[0],
    );
    const event = candidateToJiEvent(candidate);
    const sandbox = networkCandidateToSandboxInput(candidate, event.id);

    expect(candidate.domain).toBe("PHILOSOPHY_AESTHETICS");
    expect(candidate.candidateKind).toBe("ethical_philosophy_signal");
    expect(candidate.proposalKind).toBe("ETHICAL_INVARIANT_PROPOSAL");
    expect(event.body).toContain("Domain: PHILOSOPHY_AESTHETICS");
    expect(event.body).toContain("Proposal kind: ETHICAL_INVARIANT_PROPOSAL");
    expect(event.body).toContain("Suggested artifacts:");
    expect(event.body).toContain(
      "Should this philosophy/aesthetics signal become a design principle",
    );
    expect(candidateToReviewProposal(candidate)).toMatchObject({
      proposalKind: "ETHICAL_INVARIANT_PROPOSAL",
      acceptanceCheck: expect.stringContaining("Invariant has id"),
    });
    expect(sandbox.mode).toBe("SONATA");
    expect(sandbox.worldlineKey).toBe("HOPEPUNK_REPAIR");
    expect(sandbox.sourceJiEventIds).toEqual([event.id]);
    expect(sandbox.description).toContain("not doctrine");
  });

  it("routes philosophy/aesthetics candidates into typed review proposals", () => {
    const [interfaceCandidate] = parseNetworkFeed(
      `<?xml version="1.0"?><rss><channel>
        <item>
          <title>Handmade interface design as a trust signal</title>
          <link>https://example.com/design/handmade-trust</link>
          <description>Interface design can make responsibility, provenance, consent, and repair visible instead of hiding decisions behind generic automation.</description>
        </item>
      </channel></rss>`,
      philosophyAestheticsCrystallizationSources[2],
    );
    const [worldlineCandidate] = parseNetworkFeed(
      `<?xml version="1.0"?><rss><channel>
        <item>
          <title>Worldline narratives for repair under future pressure</title>
          <link>https://example.com/essay/worldline-repair</link>
          <description>Stories about future institutions can reveal where hope, otherness, governance, and repair paths become brittle.</description>
        </item>
      </channel></rss>`,
      {
        ...philosophyAestheticsCrystallizationSources[4],
        candidateKind: "worldline_narrative_signal",
      },
    );

    expect(candidateToReviewProposal(interfaceCandidate)).toMatchObject({
      proposalKind: "AESTHETIC_SURFACE_PROPOSAL",
      acceptanceCheck: expect.stringContaining("desktop/mobile"),
    });
    expect(candidateToReviewProposal(worldlineCandidate)).toMatchObject({
      proposalKind: "ESSAY_NOTE_PROPOSAL",
      acceptanceCheck: expect.stringContaining("Essay note includes thesis"),
    });
  });

  it("reports the observe-and-propose boundary", () => {
    const candidates = selectNetworkCandidates(parseNetworkFeed(rss, source), {
      minQuality: 72,
      maxItems: 1,
    });
    const chain = buildNetworkCrystallizationChain({ candidates });
    const manifest: NetworkCrystallizationManifest = {
      runId: "network-test",
      mode: "network_observe_propose",
      domain: "AI_RESEARCH",
      createdAt: "2026-05-16T00:00:00.000Z",
      completedAt: "2026-05-16T00:00:00.000Z",
      sources: 1,
      fetchedSources: 1,
      failedSources: 0,
      repoScans: 0,
      candidates: candidates.length,
      chained: chain.length,
      jiEventsWritten: candidates.length,
      sandboxRunsCreated: 0,
      reviewProposals: candidates.length,
      previousHash: null,
      latestHash: chain.at(-1)?.eventHash ?? null,
      intervalRecommendationMs: 3_600_000,
      canonicalMutationAllowed: false,
    };
    const report = generateNetworkCrystallizationReport({
      manifest,
      candidates,
      chain,
    });

    expect(report).toContain("Network Crystallization Run");
    expect(report).toContain("domain: AI_RESEARCH");
    expect(report).toContain("Typed Review Proposals");
    expect(report).toContain("OBSERVATION_REVIEW");
    expect(report).toContain("does not create canonical CrystalNodes");
    expect(report).toContain("Review the JiEvents in /ecosystem");
  });
});
