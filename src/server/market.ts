import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { type ActorKind } from "@prisma/client";
import {
  anchorProviders,
  anchorProviderDetails,
  buildMarketDepth,
  computeContributionEventHash,
  contributionKinds,
  createAnchorBundle,
  createAnchorExportDocument,
  createManualExternalAnchorReference,
  marketOrderSides,
  summarizeContributionProofChain,
  type AnchorProvider,
  type ContributionChainEvent,
  type ContributionKind,
  type ContributionProofChainSummary,
  type ManualExternalAnchorReference,
  type MarketDepth,
  type MarketOrderCore,
  type MarketOrderSide,
} from "../lib/market";
import { type CrystalNodeCore } from "../lib/domain";
import { defaultPoolIds } from "../lib/pools";
import { getOrCreateActor } from "./actors";
import { prisma, type DbClient } from "./db";

export const marketDataDir = path.join(process.cwd(), "data", "market");
export const marketAnchorsDir = path.join(marketDataDir, "anchors");
export const marketLogsDir = path.join(marketDataDir, "logs");
export const marketSnapshotsDir = path.join(marketDataDir, "snapshots");

type ActorInput = {
  alias: string;
  actorKind?: ActorKind;
  publicKey?: string | null;
  url?: string | null;
};

export type CreateContributionInput = ActorInput & {
  nodeId: string;
  kind: ContributionKind;
  body: string;
  weight: number;
};

export type CreateMarketOrderInput = ActorInput & {
  nodeId: string;
  side: MarketOrderSide;
  price: number;
  quantity: number;
  note?: string | null;
};

export type SerializableContributionEvent = Omit<
  ContributionChainEvent,
  "createdAt" | "id"
> & {
  id: string;
  nodeTitle: string;
  actorAlias: string;
  anchorId?: string | null;
  createdAt: string;
  href: string;
};

export type SerializableMarketOrder = Omit<
  MarketOrderCore,
  "createdAt" | "id"
> & {
  id: string;
  nodeTitle: string;
  href: string;
  createdAt: string;
};

export type NodeMarketSnapshot = {
  depth: MarketDepth;
  contributions: SerializableContributionEvent[];
  orders: SerializableMarketOrder[];
};

export type MarketOverview = {
  totals: {
    contributionEvents: number;
    openOrders: number;
    actors: number;
    pendingAnchors: number;
    exportedAnchors: number;
  };
  depth: MarketDepth;
  recentContributions: SerializableContributionEvent[];
  recentOrders: SerializableMarketOrder[];
  anchors: {
    id: string;
    provider: AnchorProvider;
    status: string;
    fromEventHash?: string | null;
    toEventHash?: string | null;
    eventCount: number;
    bundleHash: string;
    bundlePath?: string | null;
    externalProvider?: string | null;
    externalRef?: string | null;
    externalRecordedAt?: string | null;
    externalNote?: string | null;
    createdAt: string;
    exportedAt?: string | null;
    anchoredAt?: string | null;
  }[];
  chain: ContributionProofChainSummary & {
    events: SerializableContributionEvent[];
  };
  topNodes: {
    id: string;
    title: string;
    href: string;
    phase: CrystalNodeCore["phase"];
    depth: MarketDepth;
  }[];
};

function iso(value: Date | string) {
  return new Date(value).toISOString();
}

export async function createContributionEvent(
  client: DbClient,
  input: CreateContributionInput,
) {
  const actor = await getOrCreateActor(client, {
    alias: input.alias,
    kind: input.actorKind,
    publicKey: input.publicKey,
    url: input.url,
  });
  const node = await client.crystalNode.findFirstOrThrow({
    where: { id: input.nodeId, archivedAt: null },
    select: { id: true },
  });
  const previous = await client.contributionEvent.findFirst({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { eventHash: true },
  });
  const createdAt = new Date();
  const payload = {
    nodeId: node.id,
    actorAlias: actor.alias,
    kind: input.kind,
    body: input.body.trim(),
    weight: input.weight,
    previousHash: previous?.eventHash ?? null,
    createdAt,
  };
  const eventHash = computeContributionEventHash(payload);

  return client.contributionEvent.create({
    data: {
      nodeId: node.id,
      actorId: actor.id,
      kind: input.kind,
      body: payload.body,
      weight: payload.weight,
      previousHash: payload.previousHash,
      eventHash,
      createdAt,
    },
    include: { actor: true, node: true },
  });
}

export async function createMarketOrder(
  client: DbClient,
  input: CreateMarketOrderInput,
) {
  const actor = await getOrCreateActor(client, {
    alias: input.alias,
    kind: input.actorKind,
    publicKey: input.publicKey,
    url: input.url,
  });
  const node = await client.crystalNode.findFirstOrThrow({
    where: { id: input.nodeId, archivedAt: null },
    select: { id: true },
  });
  return client.marketOrder.create({
    data: {
      nodeId: node.id,
      actorId: actor.id,
      side: input.side,
      price: input.price,
      quantity: input.quantity,
      note: input.note?.trim() || null,
    },
    include: { actor: true, node: true },
  });
}

function contributionToSerializable(
  event: {
    id: string;
    nodeId: string;
    kind: string;
    body: string;
    weight: number;
    previousHash: string | null;
    eventHash: string;
    anchorId?: string | null;
    createdAt: Date;
    actor: { alias: string };
    node: { title: string };
  },
): SerializableContributionEvent {
  return {
    id: event.id,
    nodeId: event.nodeId,
    nodeTitle: event.node.title,
    actorAlias: event.actor.alias,
    kind: event.kind as ContributionKind,
    body: event.body,
    weight: event.weight,
    previousHash: event.previousHash,
    eventHash: event.eventHash,
    anchorId: event.anchorId ?? null,
    createdAt: iso(event.createdAt),
    href: `/nodes/${event.nodeId}`,
  };
}

function orderToSerializable(order: {
  id: string;
  nodeId: string;
  side: string;
  price: number;
  quantity: number;
  note: string | null;
  status: string;
  createdAt: Date;
  actor: { alias: string };
  node: { title: string };
}): SerializableMarketOrder {
  return {
    id: order.id,
    nodeId: order.nodeId,
    nodeTitle: order.node.title,
    actorAlias: order.actor.alias,
    side: order.side as MarketOrderSide,
    price: order.price,
    quantity: order.quantity,
    note: order.note,
    status: order.status as "open" | "cancelled",
    createdAt: iso(order.createdAt),
    href: `/nodes/${order.nodeId}`,
  };
}

function toCoreNode(node: CrystalNodeCore): CrystalNodeCore {
  return node;
}

function aggregateDepth(depths: MarketDepth[]): MarketDepth {
  const empty: MarketDepth = {
    signalPrice: 0,
    buyPressure: 0,
    sellPressure: 0,
    supportPressure: 0,
    challengePressure: 0,
    fundingIntent: 0,
    verificationDepth: 0,
    openOrders: 0,
    topBids: [],
    topAsks: [],
  };
  if (depths.length === 0) return empty;
  const total = depths.reduce(
    (sum, depth) => ({
      signalPrice: sum.signalPrice + depth.signalPrice,
      buyPressure: sum.buyPressure + depth.buyPressure,
      sellPressure: sum.sellPressure + depth.sellPressure,
      supportPressure: sum.supportPressure + depth.supportPressure,
      challengePressure: sum.challengePressure + depth.challengePressure,
      fundingIntent: sum.fundingIntent + depth.fundingIntent,
      verificationDepth: sum.verificationDepth + depth.verificationDepth,
      openOrders: sum.openOrders + depth.openOrders,
      topBids: [...sum.topBids, ...depth.topBids],
      topAsks: [...sum.topAsks, ...depth.topAsks],
    }),
    empty,
  );
  return {
    ...total,
    signalPrice: Math.round((total.signalPrice / depths.length) * 10) / 10,
    topBids: total.topBids.sort((a, b) => b.price - a.price).slice(0, 5),
    topAsks: total.topAsks.sort((a, b) => a.price - b.price).slice(0, 5),
  };
}

export async function getNodeMarket(
  nodeId: string,
): Promise<NodeMarketSnapshot> {
  const [node, contributions, orders] = await Promise.all([
    prisma.crystalNode.findUniqueOrThrow({
      where: { id: nodeId },
      include: {
        incomingEdges: { select: { id: true } },
        outgoingEdges: { select: { id: true } },
      },
    }),
    prisma.contributionEvent.findMany({
      where: { nodeId },
      include: { actor: true, node: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.marketOrder.findMany({
      where: { nodeId },
      include: { actor: true, node: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);
  const serializableContributions = contributions.map(contributionToSerializable);
  const serializableOrders = orders.map(orderToSerializable);
  const depth = buildMarketDepth({
    node: toCoreNode(node as unknown as CrystalNodeCore),
    edgeCount: node.incomingEdges.length + node.outgoingEdges.length,
    contributions: serializableContributions,
    orders: serializableOrders,
  });

  return {
    depth,
    contributions: serializableContributions,
    orders: serializableOrders,
  };
}

export async function getMarketOverview(): Promise<MarketOverview> {
  const poolId = defaultPoolIds.canonical;
  return getMarketOverviewForPool(poolId);
}

export async function getMarketOverviewForPool(
  poolId: string = defaultPoolIds.canonical,
): Promise<MarketOverview> {
  const [
    nodes,
    contributions,
    orders,
    actors,
    unanchoredEvents,
    pendingAnchors,
    exportedAnchors,
    anchors,
  ] = await Promise.all([
    prisma.crystalNode.findMany({
      where: { archivedAt: null, poolId },
      include: {
        incomingEdges: { select: { id: true } },
        outgoingEdges: { select: { id: true } },
      },
      orderBy: { crystallizationScore: "desc" },
      take: 80,
    }),
    prisma.contributionEvent.findMany({
      where: { node: { poolId } },
      include: { actor: true, node: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.marketOrder.findMany({
      where: { status: "open", node: { poolId } },
      include: { actor: true, node: true },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
    prisma.actor.count(),
    prisma.contributionEvent.count({ where: { anchorId: null, node: { poolId } } }),
    prisma.chainAnchor.count({ where: { status: "pending" } }),
    prisma.chainAnchor.count({ where: { status: "exported" } }),
    prisma.chainAnchor.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const serializableContributions = contributions.map(contributionToSerializable);
  const chainSummary = summarizeContributionProofChain(serializableContributions);
  const serializableOrders = orders.map(orderToSerializable);
  const topNodes = nodes
    .map((node) => {
      const nodeContributions = serializableContributions.filter(
        (event) => event.nodeId === node.id,
      );
      const nodeOrders = serializableOrders.filter(
        (order) => order.nodeId === node.id,
      );
      const depth = buildMarketDepth({
        node: toCoreNode(node as unknown as CrystalNodeCore),
        edgeCount: node.incomingEdges.length + node.outgoingEdges.length,
        contributions: nodeContributions,
        orders: nodeOrders,
      });
      return {
        id: node.id,
        title: node.title,
        href: `/nodes/${node.id}`,
        phase: node.phase as CrystalNodeCore["phase"],
        depth,
      };
    })
    .sort((a, b) => b.depth.signalPrice - a.depth.signalPrice)
    .slice(0, 8);

  return {
    totals: {
      contributionEvents: await prisma.contributionEvent.count({
        where: { node: { poolId } },
      }),
      openOrders: orders.length,
      actors,
      pendingAnchors: pendingAnchors + unanchoredEvents,
      exportedAnchors,
    },
    depth: aggregateDepth(topNodes.map((node) => node.depth)),
    recentContributions: serializableContributions.slice(0, 24),
    recentOrders: serializableOrders.slice(0, 24),
    anchors: anchors.map((anchor) => ({
      id: anchor.id,
      provider: anchor.provider as AnchorProvider,
      status: anchor.status,
      fromEventHash: anchor.fromEventHash,
      toEventHash: anchor.toEventHash,
      eventCount: anchor.eventCount,
      bundleHash: anchor.bundleHash,
      bundlePath: anchor.bundlePath,
      externalProvider: anchor.externalProvider,
      externalRef: anchor.externalRef,
      externalRecordedAt: anchor.externalRecordedAt
        ? iso(anchor.externalRecordedAt)
        : null,
      externalNote: anchor.externalNote,
      createdAt: iso(anchor.createdAt),
      exportedAt: anchor.exportedAt ? iso(anchor.exportedAt) : null,
      anchoredAt: anchor.anchoredAt ? iso(anchor.anchoredAt) : null,
    })),
    chain: {
      ...chainSummary,
      events: serializableContributions.slice(0, 24),
    },
    topNodes,
  };
}

function marketAnchorId(createdAt: string, bundleHash: string) {
  const stamp = createdAt.replace(/[-:.]/g, "").slice(0, 15);
  return `market-anchor-${stamp}-${bundleHash.slice(0, 12)}`;
}

async function appendMarketLog(message: string) {
  await mkdir(marketLogsDir, { recursive: true });
  const line = `${new Date().toISOString()} ${message}\n`;
  await appendFile(path.join(marketLogsDir, "market.log"), line, "utf8");
}

export async function exportPendingMarketAnchor({
  provider = "local",
  limit = 500,
}: {
  provider?: AnchorProvider;
  limit?: number;
} = {}) {
  if (!anchorProviders.includes(provider)) {
    throw new Error(`Unsupported anchor provider: ${provider}`);
  }

  const events = await prisma.contributionEvent.findMany({
    where: { anchorId: null },
    include: { actor: true, node: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit,
  });
  if (events.length === 0) {
    await appendMarketLog(`anchor skipped provider=${provider} reason=no-pending-events`);
    return {
      created: false,
      provider,
      eventCount: 0,
      externalUpload: false,
      handoff: anchorProviderDetails[provider].handoff,
      message: "No pending contribution events.",
    };
  }

  const createdAt = new Date().toISOString();
  const bundle = createAnchorBundle({
    provider,
    createdAt,
    events: events.map((event) => ({
      id: event.id,
      nodeId: event.nodeId,
      nodeTitle: event.node.title,
      actorAlias: event.actor.alias,
      kind: event.kind as ContributionKind,
      body: event.body,
      weight: event.weight,
      previousHash: event.previousHash,
      eventHash: event.eventHash,
      createdAt: event.createdAt,
    })),
  });
  const anchorId = marketAnchorId(createdAt, bundle.bundleHash);
  const exportDocument = createAnchorExportDocument({ anchorId, bundle });
  const relativePath = path.join("data", "market", "anchors", `${anchorId}.json`);
  const absolutePath = path.join(process.cwd(), relativePath);

  await mkdir(marketAnchorsDir, { recursive: true });
  await writeFile(
    absolutePath,
    `${JSON.stringify(exportDocument, null, 2)}\n`,
    "utf8",
  );

  await prisma.$transaction(async (tx) => {
    await tx.chainAnchor.create({
      data: {
        id: anchorId,
        provider,
        status: "exported",
        fromEventHash: bundle.fromEventHash,
        toEventHash: bundle.toEventHash,
        eventCount: bundle.eventCount,
        bundleHash: bundle.bundleHash,
        bundlePath: relativePath,
        exportedAt: new Date(createdAt),
      },
    });
    await tx.contributionEvent.updateMany({
      where: { id: { in: events.map((event) => event.id) } },
      data: { anchorId },
    });
  });

  await appendMarketLog(
    `anchor exported id=${anchorId} provider=${provider} events=${bundle.eventCount} hash=${bundle.bundleHash}`,
  );
  return {
    created: true,
    id: anchorId,
    provider,
    eventCount: bundle.eventCount,
    bundleHash: bundle.bundleHash,
    bundlePath: absolutePath,
    externalUpload: false,
    handoff: anchorProviderDetails[provider].handoff,
  };
}

export async function writeMarketSnapshot() {
  const overview = await getMarketOverview();
  const stamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15);
  const fileName = `market-snapshot-${stamp}.json`;
  await mkdir(marketSnapshotsDir, { recursive: true });
  const absolutePath = path.join(marketSnapshotsDir, fileName);
  await writeFile(absolutePath, `${JSON.stringify(overview, null, 2)}\n`, "utf8");
  await appendMarketLog(`snapshot written path=${absolutePath}`);
  return {
    path: absolutePath,
    overview,
  };
}

export async function recordManualAnchorExternalReference({
  anchorId,
  externalProvider,
  externalRef,
  note,
}: {
  anchorId: string;
  externalProvider: AnchorProvider;
  externalRef: string;
  note?: string | null;
}): Promise<ManualExternalAnchorReference & { anchorId: string }> {
  const reference = createManualExternalAnchorReference({
    externalProvider,
    externalRef,
    note,
  });
  await prisma.chainAnchor.update({
    where: { id: anchorId },
    data: {
      status: "anchored",
      externalProvider: reference.externalProvider,
      externalRef: reference.externalRef,
      externalRecordedAt: new Date(reference.recordedAt),
      externalNote: reference.note ?? null,
      anchoredAt: new Date(reference.recordedAt),
    },
  });
  await appendMarketLog(
    `anchor external-ref recorded id=${anchorId} provider=${reference.externalProvider} ref=${reference.externalRef}`,
  );
  return {
    anchorId,
    ...reference,
  };
}

export function isContributionKind(value: string): value is ContributionKind {
  return contributionKinds.includes(value as ContributionKind);
}

export function isMarketOrderSide(value: string): value is MarketOrderSide {
  return marketOrderSides.includes(value as MarketOrderSide);
}
