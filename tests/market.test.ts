import { describe, expect, it } from "vitest";
import { nodeFixture } from "./helpers";
import {
  buildMarketDepth,
  canonicalJson,
  calculateSignalPrice,
  computeContributionEventHash,
  createAnchorBundle,
  createAnchorExportDocument,
  createManualExternalAnchorReference,
  anchorProviderDetails,
  summarizeContributionProofChain,
  type ContributionChainEvent,
  validateContributionChain,
} from "@/lib/market";

function contribution(
  override: Partial<ContributionChainEvent & { anchorId?: string | null }> = {},
): ContributionChainEvent & { anchorId?: string | null } {
  const base = {
    id: "event-a",
    nodeId: "node-a",
    actorAlias: "tester",
    kind: "support" as const,
    body: "meaningful support",
    weight: 2,
    previousHash: null,
    createdAt: "2026-05-13T01:00:00.000Z",
  };
  const input = { ...base, ...override };
  return {
    ...input,
    eventHash:
      override.eventHash ??
      computeContributionEventHash({
        nodeId: input.nodeId,
        actorAlias: input.actorAlias,
        kind: input.kind,
        body: input.body,
        weight: input.weight,
        previousHash: input.previousHash,
        createdAt: input.createdAt,
      }),
  };
}

describe("meaning market", () => {
  it("canonical JSON sorts object keys", () => {
    expect(canonicalJson({ b: 2, a: { d: 4, c: 3 } })).toBe(
      canonicalJson({ a: { c: 3, d: 4 }, b: 2 }),
    );
  });

  it("validates a stable previousHash contribution chain", () => {
    const first = contribution();
    const second = contribution({
      id: "event-b",
      kind: "verify",
      body: "verified",
      previousHash: first.eventHash,
      createdAt: "2026-05-13T01:01:00.000Z",
    });

    expect(validateContributionChain([first, second])).toEqual({
      ok: true,
      issues: [],
    });
  });

  it("rejects tampered contribution events", () => {
    const event = contribution();
    const tampered = { ...event, body: "different body" };

    const result = validateContributionChain([tampered]);

    expect(result.ok).toBe(false);
    expect(result.issues[0]).toContain("hash mismatch");
  });

  it("calculates deterministic signal prices", () => {
    const node = nodeFixture({
      phase: "seed",
      crystallizationScore: 60,
      publicness: 5,
      emotionHa: 2,
    });
    const supportPrice = calculateSignalPrice({
      node,
      edgeCount: 3,
      contributions: [
        contribution({ kind: "support", weight: 3 }),
        contribution({ kind: "verify", weight: 2 }),
      ],
      orders: [{ side: "bid", price: 40, quantity: 2, status: "open" }],
    });
    const challengedPrice = calculateSignalPrice({
      node,
      edgeCount: 3,
      contributions: [contribution({ kind: "challenge", weight: 6 })],
      orders: [{ side: "ask", price: 40, quantity: 2, status: "open" }],
    });

    expect(supportPrice).toBeGreaterThan(challengedPrice);
    expect(supportPrice).toBe(calculateSignalPrice({
      node,
      edgeCount: 3,
      contributions: [
        contribution({ kind: "support", weight: 3 }),
        contribution({ kind: "verify", weight: 2 }),
      ],
      orders: [{ side: "bid", price: 40, quantity: 2, status: "open" }],
    }));
  });

  it("aggregates hybrid order book pressure", () => {
    const node = nodeFixture({ phase: "crystal", crystallizationScore: 72 });
    const depth = buildMarketDepth({
      node,
      edgeCount: 4,
      contributions: [
        contribution({ kind: "support", weight: 2 }),
        contribution({ kind: "review", weight: 2 }),
        contribution({ kind: "challenge", weight: 1 }),
        contribution({ kind: "fund_intent", weight: 3 }),
      ],
      orders: [
        {
          id: "bid-a",
          nodeId: node.id,
          actorAlias: "buyer",
          side: "bid",
          price: 50,
          quantity: 2,
          status: "open",
        },
        {
          id: "ask-a",
          nodeId: node.id,
          actorAlias: "seller",
          side: "ask",
          price: 60,
          quantity: 1,
          status: "open",
        },
      ],
    });

    expect(depth.buyPressure).toBe(100);
    expect(depth.sellPressure).toBe(60);
    expect(depth.challengePressure).toBeGreaterThan(0);
    expect(depth.fundingIntent).toBeGreaterThan(0);
    expect(depth.topBids[0].id).toBe("bid-a");
    expect(depth.topAsks[0].id).toBe("ask-a");
  });

  it("creates anchor bundles with event range and digest", () => {
    const first = contribution();
    const second = contribution({
      id: "event-b",
      previousHash: first.eventHash,
      createdAt: "2026-05-13T01:01:00.000Z",
    });
    const bundle = createAnchorBundle({
      provider: "ipfs",
      createdAt: "2026-05-13T02:00:00.000Z",
      events: [second, first],
    });

    expect(bundle.eventCount).toBe(2);
    expect(bundle.fromEventHash).toBe(first.eventHash);
    expect(bundle.toEventHash).toBe(second.eventHash);
    expect(bundle.bundleHash).toHaveLength(64);
    expect(bundle.events[0].id).toBe("event-a");
  });

  it("keeps IPFS and Arweave as explicit manual handoff designs", () => {
    expect(anchorProviderDetails.local.externalUpload).toBe(false);
    expect(anchorProviderDetails.ipfs.externalUpload).toBe(false);
    expect(anchorProviderDetails.arweave.externalUpload).toBe(false);
    expect(anchorProviderDetails.ipfs.description).toContain("manual IPFS");
    expect(anchorProviderDetails.arweave.description).toContain("manual Arweave");
  });

  it("creates anchor export documents without implying external upload", () => {
    const bundle = createAnchorBundle({
      provider: "arweave",
      createdAt: "2026-05-13T02:00:00.000Z",
      events: [contribution()],
    });
    const document = createAnchorExportDocument({
      anchorId: "market-anchor-test",
      bundle,
    });

    expect(document.anchorId).toBe("market-anchor-test");
    expect(document.bundleHash).toBe(bundle.bundleHash);
    expect(document.externalUpload).toBe(false);
    expect(document.providerDesign.label).toBe("Arweave-ready Bundle");
  });

  it("records manual external references without changing contribution hashes", () => {
    const event = contribution();
    const before = event.eventHash;
    const reference = createManualExternalAnchorReference({
      externalProvider: "ipfs",
      externalRef: "bafy-test-cid",
      recordedAt: "2026-05-15T03:00:00.000Z",
      note: "manually uploaded outside Crystal Pool",
    });
    const after = computeContributionEventHash(event);

    expect(reference).toMatchObject({
      externalProvider: "ipfs",
      externalRef: "bafy-test-cid",
      externalUpload: false,
    });
    expect(after).toBe(before);
  });

  it("summarizes local proof-chain coverage without changing chain semantics", () => {
    const first = contribution({ anchorId: "anchor-a" });
    const second = contribution({
      id: "event-b",
      kind: "verify",
      body: "verified",
      previousHash: first.eventHash,
      createdAt: "2026-05-13T01:01:00.000Z",
    });

    const summary = summarizeContributionProofChain([second, first]);

    expect(summary.ok).toBe(true);
    expect(summary.eventCount).toBe(2);
    expect(summary.anchoredEvents).toBe(1);
    expect(summary.unanchoredEvents).toBe(1);
    expect(summary.coveragePercent).toBe(50);
    expect(summary.genesisHash).toBe(first.eventHash);
    expect(summary.latestHash).toBe(second.eventHash);
  });
});
