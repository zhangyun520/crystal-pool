import { describe, expect, it } from "vitest";
import {
  buildNetworkCrystallizationChain,
  candidateToJiEvent,
  candidateToJiEventId,
  generateNetworkCrystallizationReport,
  parseNetworkFeed,
  selectNetworkCandidates,
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
    expect(event.body).toContain("Chain hash:");
    expect(event.body).toContain("Review question:");
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
      createdAt: "2026-05-16T00:00:00.000Z",
      completedAt: "2026-05-16T00:00:00.000Z",
      sources: 1,
      fetchedSources: 1,
      failedSources: 0,
      candidates: candidates.length,
      chained: chain.length,
      jiEventsWritten: candidates.length,
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
    expect(report).toContain("does not create canonical CrystalNodes");
    expect(report).toContain("Review the JiEvents in /ecosystem");
  });
});
