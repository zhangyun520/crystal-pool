import { createHash } from "node:crypto";
import { clamp, type CrystalNodeCore } from "./domain";

export const marketSchemaVersion = "crystal-pool.meaning-market.v1";
export const contributionEventSchemaVersion =
  "crystal-pool.contribution-event.v1";
export const chainAnchorBundleSchemaVersion =
  "crystal-pool.chain-anchor-bundle.v1";

export const contributionKinds = [
  "support",
  "challenge",
  "review",
  "verify",
  "build_intent",
  "fund_intent",
  "fork",
  "feedback",
] as const;

export type ContributionKind = (typeof contributionKinds)[number];

export const marketOrderSides = [
  "bid",
  "ask",
  "support",
  "challenge",
] as const;

export type MarketOrderSide = (typeof marketOrderSides)[number];

export const anchorProviders = ["local", "ipfs", "arweave"] as const;

export type AnchorProvider = (typeof anchorProviders)[number];

export const anchorStatuses = [
  "pending",
  "exported",
  "anchored",
  "failed",
] as const;

export type AnchorStatus = (typeof anchorStatuses)[number];

export type CanonicalContributionInput = {
  nodeId: string;
  actorAlias: string;
  kind: ContributionKind;
  body: string;
  weight: number;
  previousHash?: string | null;
  createdAt: Date | string;
};

export type ContributionChainEvent = CanonicalContributionInput & {
  id?: string;
  eventHash: string;
};

export type ContributionProofChainSummary = {
  ok: boolean;
  issues: string[];
  eventCount: number;
  anchoredEvents: number;
  unanchoredEvents: number;
  coveragePercent: number;
  genesisHash: string | null;
  latestHash: string | null;
};

export type MarketOrderCore = {
  id?: string;
  nodeId: string;
  actorAlias: string;
  side: MarketOrderSide;
  price: number;
  quantity: number;
  note?: string | null;
  status?: "open" | "cancelled";
  createdAt?: Date | string;
};

export type MarketDepth = {
  signalPrice: number;
  buyPressure: number;
  sellPressure: number;
  supportPressure: number;
  challengePressure: number;
  fundingIntent: number;
  verificationDepth: number;
  openOrders: number;
  topBids: MarketDepthOrder[];
  topAsks: MarketDepthOrder[];
};

export type MarketDepthOrder = {
  id?: string;
  actorAlias: string;
  side: MarketOrderSide;
  price: number;
  quantity: number;
  note?: string | null;
};

export type AnchorBundleEvent = ContributionChainEvent & {
  nodeTitle?: string;
};

export type ChainAnchorBundle = {
  schemaVersion: typeof chainAnchorBundleSchemaVersion;
  provider: AnchorProvider;
  createdAt: string;
  eventCount: number;
  fromEventHash: string | null;
  toEventHash: string | null;
  events: AnchorBundleEvent[];
  bundleHash: string;
};

export type AnchorProviderDesign = {
  label: string;
  description: string;
  handoff: string;
  externalUpload: false;
};

export const anchorProviderDetails: Record<AnchorProvider, AnchorProviderDesign> = {
  local: {
    label: "Local Proof Bundle",
    description: "A local JSON proof bundle only. No network upload occurs.",
    handoff: "Keep the bundle under data/market/anchors/ or copy it into a later notarization workflow.",
    externalUpload: false,
  },
  ipfs: {
    label: "IPFS-ready Bundle",
    description: "A content-addressable proof bundle prepared for manual IPFS upload.",
    handoff: "Upload the exported JSON manually in a future IPFS workflow, then record the CID separately.",
    externalUpload: false,
  },
  arweave: {
    label: "Arweave-ready Bundle",
    description: "A permanence-oriented proof bundle prepared for manual Arweave upload.",
    handoff: "Upload the exported JSON manually in a future Arweave workflow, then record the transaction id separately.",
    externalUpload: false,
  },
};

export type ChainAnchorExportDocument = ChainAnchorBundle & {
  anchorId: string;
  providerDesign: AnchorProviderDesign;
  externalUpload: false;
};

export type ManualExternalAnchorReference = {
  externalProvider: AnchorProvider;
  externalRef: string;
  recordedAt: string;
  note?: string;
  externalUpload: false;
};

type CanonicalValue =
  | string
  | number
  | boolean
  | null
  | CanonicalValue[]
  | { [key: string]: CanonicalValue };

function normalizeCanonicalValue(value: unknown): CanonicalValue {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeCanonicalValue);
  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, CanonicalValue> = {};
    for (const key of Object.keys(input).sort()) {
      const next = input[key];
      if (next !== undefined) output[key] = normalizeCanonicalValue(next);
    }
    return output;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }
  return String(value);
}

export function canonicalJson(value: unknown) {
  return JSON.stringify(normalizeCanonicalValue(value));
}

export function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function iso(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function normalizedWeight(value: number) {
  return Math.round(clamp(value, 0, 10) * 100) / 100;
}

export function canonicalContributionPayload(
  input: CanonicalContributionInput,
) {
  return {
    schemaVersion: contributionEventSchemaVersion,
    nodeId: input.nodeId,
    actorAlias: input.actorAlias.trim(),
    kind: input.kind,
    body: input.body.trim(),
    weight: normalizedWeight(input.weight),
    previousHash: input.previousHash ?? null,
    createdAt: iso(input.createdAt),
  };
}

export function computeContributionEventHash(
  input: CanonicalContributionInput,
) {
  return sha256Hex(canonicalJson(canonicalContributionPayload(input)));
}

export function validateContributionChain(events: ContributionChainEvent[]) {
  const ordered = [...events].sort((a, b) => {
    const timeDelta = iso(a.createdAt).localeCompare(iso(b.createdAt));
    if (timeDelta !== 0) return timeDelta;
    return (a.id ?? "").localeCompare(b.id ?? "");
  });
  const issues: string[] = [];
  let previousHash: string | null = null;

  for (const event of ordered) {
    if ((event.previousHash ?? null) !== previousHash) {
      issues.push(
        `${event.id ?? event.eventHash} points to ${event.previousHash ?? "null"} but expected ${previousHash ?? "null"}.`,
      );
    }
    const expectedHash = computeContributionEventHash(event);
    if (event.eventHash !== expectedHash) {
      issues.push(
        `${event.id ?? event.eventHash} hash mismatch: expected ${expectedHash}.`,
      );
    }
    previousHash = event.eventHash;
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function summarizeContributionProofChain(
  events: (ContributionChainEvent & { anchorId?: string | null })[],
): ContributionProofChainSummary {
  const ordered = [...events].sort((a, b) => {
    const timeDelta = iso(a.createdAt).localeCompare(iso(b.createdAt));
    if (timeDelta !== 0) return timeDelta;
    return (a.id ?? "").localeCompare(b.id ?? "");
  });
  const validation = validateContributionChain(ordered);
  const anchoredEvents = ordered.filter((event) => event.anchorId).length;
  const eventCount = ordered.length;

  return {
    ok: validation.ok,
    issues: validation.issues,
    eventCount,
    anchoredEvents,
    unanchoredEvents: eventCount - anchoredEvents,
    coveragePercent: eventCount
      ? Math.round((anchoredEvents / eventCount) * 100)
      : 0,
    genesisHash: ordered[0]?.eventHash ?? null,
    latestHash: ordered.at(-1)?.eventHash ?? null,
  };
}

const phaseMarketBoost: Record<CrystalNodeCore["phase"], number> = {
  gas: 4,
  liquid: 12,
  seed: 24,
  crystal: 38,
  fossil: 24,
  dissolved: 8,
};

const contributionSignalWeight: Record<ContributionKind, number> = {
  support: 2.2,
  challenge: -3.4,
  review: 2.6,
  verify: 4.2,
  build_intent: 3.6,
  fund_intent: 3.8,
  fork: 1.4,
  feedback: 1.8,
};

export function calculateSignalPrice({
  node,
  edgeCount,
  contributions,
  orders,
}: {
  node: CrystalNodeCore;
  edgeCount: number;
  contributions: Pick<ContributionChainEvent, "kind" | "weight">[];
  orders: Pick<MarketOrderCore, "side" | "price" | "quantity" | "status">[];
}) {
  const contributionSignal = contributions.reduce(
    (sum, event) => sum + contributionSignalWeight[event.kind] * event.weight,
    0,
  );
  const openOrders = orders.filter((order) => order.status !== "cancelled");
  const orderSignal = openOrders.reduce((sum, order) => {
    const pressure = Math.sqrt(Math.max(0, order.price * order.quantity));
    if (order.side === "bid" || order.side === "support") return sum + pressure;
    return sum - pressure * 0.72;
  }, 0);
  const haSoftening =
    node.phase === "fossil"
      ? node.emotionHa * 1.6
      : Math.min(4, node.emotionHa * 0.35);
  const fossilRisk =
    node.crystallizationScore >= 72 && node.emotionHa < 2 ? 8 : 0;
  const score =
    phaseMarketBoost[node.phase] +
    node.crystallizationScore * 0.52 +
    edgeCount * 2.1 +
    node.publicness * 0.8 +
    node.privateIntensity * 0.35 +
    contributionSignal +
    orderSignal +
    haSoftening -
    node.emotionBoredom * 1.3 -
    fossilRisk;

  return Math.round(clamp(score, 0, 100) * 10) / 10;
}

export function buildMarketDepth({
  node,
  edgeCount,
  contributions,
  orders,
}: {
  node: CrystalNodeCore;
  edgeCount: number;
  contributions: ContributionChainEvent[];
  orders: MarketOrderCore[];
}): MarketDepth {
  const openOrders = orders.filter((order) => order.status !== "cancelled");
  const orderNotional = (side: MarketOrderSide) =>
    openOrders
      .filter((order) => order.side === side)
      .reduce((sum, order) => sum + order.price * order.quantity, 0);
  const contributionWeight = (kind: ContributionKind) =>
    contributions
      .filter((event) => event.kind === kind)
      .reduce((sum, event) => sum + event.weight, 0);
  const topOrders = (side: MarketOrderSide, direction: "asc" | "desc") =>
    openOrders
      .filter((order) => order.side === side)
      .sort((a, b) =>
        direction === "desc" ? b.price - a.price : a.price - b.price,
      )
      .slice(0, 5)
      .map((order) => ({
        id: order.id,
        actorAlias: order.actorAlias,
        side: order.side,
        price: Math.round(order.price * 100) / 100,
        quantity: Math.round(order.quantity * 100) / 100,
        note: order.note,
      }));

  const supportWeight =
    contributionWeight("support") +
    contributionWeight("review") * 0.55 +
    contributionWeight("verify") * 0.8 +
    contributionWeight("build_intent") * 0.7;
  const challengeWeight = contributionWeight("challenge");
  const fundingWeight = contributionWeight("fund_intent");
  const verificationWeight =
    contributionWeight("verify") + contributionWeight("review") * 0.65;

  return {
    signalPrice: calculateSignalPrice({
      node,
      edgeCount,
      contributions,
      orders: openOrders,
    }),
    buyPressure: Math.round(orderNotional("bid") + orderNotional("support")),
    sellPressure: Math.round(orderNotional("ask")),
    supportPressure: Math.round(supportWeight * 10 + orderNotional("support")),
    challengePressure: Math.round(
      challengeWeight * 10 + orderNotional("challenge"),
    ),
    fundingIntent: Math.round(fundingWeight * 12 + orderNotional("bid") * 0.25),
    verificationDepth: Math.round(verificationWeight * 10),
    openOrders: openOrders.length,
    topBids: topOrders("bid", "desc"),
    topAsks: topOrders("ask", "asc"),
  };
}

export function createAnchorBundle({
  provider,
  events,
  createdAt = new Date().toISOString(),
}: {
  provider: AnchorProvider;
  events: AnchorBundleEvent[];
  createdAt?: Date | string;
}): ChainAnchorBundle {
  const orderedEvents = [...events].sort((a, b) => {
    const timeDelta = iso(a.createdAt).localeCompare(iso(b.createdAt));
    if (timeDelta !== 0) return timeDelta;
    return (a.id ?? "").localeCompare(b.id ?? "");
  });
  const payload: Omit<ChainAnchorBundle, "bundleHash"> = {
    schemaVersion: chainAnchorBundleSchemaVersion,
    provider,
    createdAt: iso(createdAt),
    eventCount: orderedEvents.length,
    fromEventHash: orderedEvents[0]?.eventHash ?? null,
    toEventHash: orderedEvents.at(-1)?.eventHash ?? null,
    events: orderedEvents.map((event) => ({
      id: event.id,
      nodeId: event.nodeId,
      nodeTitle: event.nodeTitle,
      actorAlias: event.actorAlias,
      kind: event.kind,
      body: event.body,
      weight: normalizedWeight(event.weight),
      previousHash: event.previousHash ?? null,
      eventHash: event.eventHash,
      createdAt: iso(event.createdAt),
    })),
  };

  return {
    ...payload,
    bundleHash: sha256Hex(canonicalJson(payload)),
  };
}

export function createAnchorExportDocument({
  anchorId,
  bundle,
}: {
  anchorId: string;
  bundle: ChainAnchorBundle;
}): ChainAnchorExportDocument {
  return {
    ...bundle,
    anchorId,
    providerDesign: anchorProviderDetails[bundle.provider],
    externalUpload: false,
  };
}

export function createManualExternalAnchorReference({
  externalProvider,
  externalRef,
  recordedAt = new Date().toISOString(),
  note,
}: {
  externalProvider: AnchorProvider;
  externalRef: string;
  recordedAt?: Date | string;
  note?: string | null;
}): ManualExternalAnchorReference {
  if (!anchorProviders.includes(externalProvider)) {
    throw new Error(`Unsupported external anchor provider: ${externalProvider}`);
  }
  const ref = externalRef.trim();
  if (!ref) {
    throw new Error("Manual external anchor reference is required.");
  }
  const trimmedNote = note?.trim();
  return {
    externalProvider,
    externalRef: ref,
    recordedAt: iso(recordedAt),
    note: trimmedNote || undefined,
    externalUpload: false,
  };
}
