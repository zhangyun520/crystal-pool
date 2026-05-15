import { prisma } from "./db";
import { getObservationPoolSnapshot } from "./observe";
import { getMarketOverviewForPool } from "./market";
import { getLatestEcosystemRunSummary } from "./ecosystemDaemon";
import { edgeRelations, phases, type EdgeRelation, type Phase } from "@/lib/domain";
import { defaultPoolIds } from "@/lib/pools";
import {
  buildFlowLanes,
  buildPhaseDepth,
  calculateFlowPressure,
  normalizeFlowIntensity,
  rankFlowEvents,
  sideForPhaseTransition,
  sideForRelation,
  type MeaningCluster,
  type MeaningFlowEvent,
  type MeaningFlowSnapshot,
  type MeaningOrderBookLevel,
} from "@/lib/meaningFlow";

function iso(value: Date | string) {
  return new Date(value).toISOString();
}

function phaseIntensity(toPhase: Phase, score: number) {
  const phaseBoost: Record<Phase, number> = {
    gas: 4,
    liquid: 12,
    seed: 28,
    crystal: 42,
    fossil: 34,
    dissolved: 24,
  };
  return normalizeFlowIntensity(phaseBoost[toPhase] + score * 0.42);
}

function sideForContribution(kind: string) {
  if (kind === "challenge") return "tension" as const;
  if (kind === "fund_intent" || kind === "build_intent") {
    return "crystallize" as const;
  }
  if (kind === "feedback" || kind === "review") return "neutral" as const;
  if (kind === "fork") return "intake" as const;
  return "crystallize" as const;
}

function sideForMarketOrder(side: string) {
  if (side === "ask" || side === "challenge") return "tension" as const;
  if (side === "support" || side === "bid") return "crystallize" as const;
  return "neutral" as const;
}

function sideForJiEvent(kind: string) {
  if (kind === "publish.blocked" || kind === "ci.failed") return "tension" as const;
  if (
    kind === "artifact.published" ||
    kind === "memory.learned" ||
    kind === "sandbox.lesson"
  ) {
    return "crystallize" as const;
  }
  if (kind === "manual.note") return "neutral" as const;
  return "intake" as const;
}

function sideForDaemonProposal(kind: string) {
  if (kind === "AI_MAINLINE_PROPOSAL" || kind === "WORLDLINE_REHEARSAL") {
    return "crystallize" as const;
  }
  if (kind === "INBOX_DIAGNOSTIC" || kind === "AI_MATURITY_WORK") {
    return "tension" as const;
  }
  return "intake" as const;
}

function sideForConstitutionStatus(status: string) {
  if (status === "fail") return "tension" as const;
  if (status === "warn") return "neutral" as const;
  return "crystallize" as const;
}

type FlowNodeForCluster = {
  id: string;
  title: string;
  phase: Phase;
  crystallizationScore: number;
  emotionHa: number;
  tags: { tag: { name: string } }[];
  incomingEdges: { id: string }[];
  outgoingEdges: { id: string }[];
};

type ClusterContributionInput = {
  nodeId: string;
  kind: string;
  weight: number;
};

function phaseLeader(nodes: FlowNodeForCluster[]): Phase {
  const counts = new Map<Phase, number>();
  for (const node of nodes) {
    counts.set(node.phase, (counts.get(node.phase) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "gas";
}

function pressureSide(netPressure: number, supportPressure: number, challengePressure: number) {
  if (supportPressure + challengePressure < 1) return "quiet" as const;
  if (netPressure > 18) return "bid" as const;
  if (netPressure < -12) return "ask" as const;
  return "balanced" as const;
}

function contributionPressureForNode(
  nodeId: string,
  contributions: ClusterContributionInput[],
) {
  return contributions
    .filter((event) => event.nodeId === nodeId)
    .reduce(
      (sum, event) => {
        if (event.kind === "challenge") {
          sum.challenge += event.weight * 10;
        } else if (event.kind === "fund_intent") {
          sum.funding += event.weight * 12;
          sum.support += event.weight * 4;
        } else if (event.kind === "verify") {
          sum.verification += event.weight * 12;
          sum.support += event.weight * 6;
        } else if (event.kind === "review") {
          sum.verification += event.weight * 7;
          sum.support += event.weight * 4;
        } else if (event.kind === "build_intent") {
          sum.support += event.weight * 9;
        } else {
          sum.support += event.weight * 6;
        }
        return sum;
      },
      { support: 0, challenge: 0, funding: 0, verification: 0 },
    );
}

function buildMeaningClusters({
  nodes,
  contributions,
  orders,
}: {
  nodes: FlowNodeForCluster[];
  contributions: (ClusterContributionInput & {
    id?: string;
    actorAlias?: string;
    body?: string;
    createdAt?: string;
    href?: string;
  })[];
  orders: {
    id?: string;
    nodeId: string;
    side: string;
    price: number;
    quantity: number;
    actorAlias?: string;
    note?: string | null;
    createdAt?: string;
    href?: string;
  }[];
}): MeaningCluster[] {
  const groups = new Map<string, FlowNodeForCluster[]>();
  for (const node of nodes) {
    const tagNames = node.tags.map((entry) => entry.tag.name).slice(0, 4);
    const keys = tagNames.length > 0 ? tagNames : [`phase:${node.phase}`];
    for (const key of keys) {
      groups.set(key, [...(groups.get(key) ?? []), node]);
    }
  }

  return [...groups.entries()]
    .map(([label, clusterNodes]) => {
      const nodeIds = new Set(clusterNodes.map((node) => node.id));
      const avgScore =
        clusterNodes.reduce((sum, node) => sum + node.crystallizationScore, 0) /
        clusterNodes.length;
      const avgHa =
        clusterNodes.reduce((sum, node) => sum + node.emotionHa, 0) /
        clusterNodes.length;
      const edgeCount = clusterNodes.reduce(
        (sum, node) =>
          sum + node.incomingEdges.length + node.outgoingEdges.length,
        0,
      );
      const contributionPressure = clusterNodes.reduce(
        (sum, node) => {
          const pressure = contributionPressureForNode(node.id, contributions);
          return {
            support: sum.support + pressure.support,
            challenge: sum.challenge + pressure.challenge,
            funding: sum.funding + pressure.funding,
            verification: sum.verification + pressure.verification,
          };
        },
        { support: 0, challenge: 0, funding: 0, verification: 0 },
      );
      const orderPressure = orders
        .filter((order) => nodeIds.has(order.nodeId))
        .reduce(
          (sum, order) => {
            const notional = order.price * order.quantity;
            if (order.side === "bid" || order.side === "support") {
              sum.support += notional;
            } else {
              sum.challenge += notional;
            }
            return sum;
          },
          { support: 0, challenge: 0 },
        );
      const supportPressure = Math.round(
        contributionPressure.support + orderPressure.support,
      );
      const challengePressure = Math.round(
        contributionPressure.challenge + orderPressure.challenge,
      );
      const fundingIntent = Math.round(contributionPressure.funding);
      const verificationDepth = Math.round(contributionPressure.verification);
      const netPressure = supportPressure + fundingIntent + verificationDepth - challengePressure;
      const signalPrice = Math.round(
        Math.max(
          0,
          Math.min(
            100,
            avgScore * 0.5 +
              edgeCount * 1.8 +
              supportPressure * 0.12 +
              fundingIntent * 0.2 +
              verificationDepth * 0.18 -
              challengePressure * 0.15 +
              avgHa * 0.8,
          ),
        ) * 10,
      ) / 10;
      const topNode = [...clusterNodes].sort(
        (a, b) => b.crystallizationScore - a.crystallizationScore,
      )[0];
      const clusterNodeIds = clusterNodes.map((node) => node.id);
      const clusterNodeIdSet = new Set(clusterNodeIds);
      const recentContributions = contributions
        .filter((event) => clusterNodeIdSet.has(event.nodeId))
        .slice(0, 6)
        .map((event) => ({
          id: event.id ?? `${event.nodeId}:${event.kind}:${event.weight}`,
          kind: event.kind,
          actorAlias: event.actorAlias ?? "unknown",
          body: event.body ?? "",
          weight: event.weight,
          at: event.createdAt ?? "",
          href: event.href ?? `/nodes/${event.nodeId}`,
        }));
      const recentOrders = orders
        .filter((order) => clusterNodeIdSet.has(order.nodeId))
        .slice(0, 6)
        .map((order) => ({
          id: order.id ?? `${order.nodeId}:${order.side}:${order.price}`,
          side: order.side,
          actorAlias: order.actorAlias ?? "unknown",
          price: order.price,
          quantity: order.quantity,
          note: order.note,
          at: order.createdAt ?? "",
          href: order.href ?? `/nodes/${order.nodeId}`,
        }));

      return {
        id: label,
        label,
        nodeIds: clusterNodeIds,
        nodes: clusterNodes.length,
        avgScore: Math.round(avgScore),
        edgeCount,
        avgHa: Math.round(avgHa * 10) / 10,
        signalPrice,
        supportPressure,
        challengePressure,
        fundingIntent,
        verificationDepth,
        netPressure: Math.round(netPressure),
        dominantPhase: phaseLeader(clusterNodes),
        topNodeTitle: topNode.title,
        href: `/nodes/${topNode.id}`,
        side: pressureSide(netPressure, supportPressure, challengePressure),
        nodeSummaries: clusterNodes
          .sort((a, b) => b.crystallizationScore - a.crystallizationScore)
          .slice(0, 8)
          .map((node) => ({
            id: node.id,
            title: node.title,
            phase: node.phase,
            score: Math.round(node.crystallizationScore),
            href: `/nodes/${node.id}`,
          })),
        recentContributions,
        recentOrders,
      } satisfies MeaningCluster;
    })
    .sort((a, b) => b.signalPrice - a.signalPrice)
    .slice(0, 14);
}

function buildMeaningOrderBook({
  signalPrice,
  buyPressure,
  sellPressure,
  supportPressure,
  challengePressure,
}: {
  signalPrice: number;
  buyPressure: number;
  sellPressure: number;
  supportPressure: number;
  challengePressure: number;
}): MeaningOrderBookLevel[] {
  const center = Math.max(1, Math.round(signalPrice / 5) * 5);
  return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const closeness = Math.max(0.2, 1 - Math.abs(offset) * 0.18);
    const isBid = offset <= 0;
    const isAsk = offset >= 0;
    return {
      price: center + offset * 5,
      bidSize: isBid ? Math.round((buyPressure + supportPressure * 0.35) * closeness) : 0,
      askSize: isAsk ? Math.round((sellPressure + challengePressure * 0.55) * closeness) : 0,
      supportSize: isBid ? Math.round(supportPressure * closeness) : 0,
      challengeSize: isAsk ? Math.round(challengePressure * closeness) : 0,
    };
  });
}

export async function getMeaningFlowSnapshot({
  poolId = defaultPoolIds.canonical,
}: {
  poolId?: string;
} = {}): Promise<MeaningFlowSnapshot> {
  const [observation, market] = await Promise.all([
    getObservationPoolSnapshot(),
    getMarketOverviewForPool(poolId),
  ]);
  const [phaseEvents, edges, nodes, jiEvents, latestEcosystemRun] = await Promise.all([
    prisma.phaseEvent.findMany({
      where: { node: { poolId } },
      include: { node: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.crystalEdge.findMany({
      where: {
        from: { archivedAt: null, poolId },
        to: { archivedAt: null, poolId },
      },
      include: { from: true, to: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.crystalNode.findMany({
      where: { archivedAt: null, poolId },
      include: {
        tags: { include: { tag: true } },
        incomingEdges: { select: { id: true } },
        outgoingEdges: { select: { id: true } },
      },
      orderBy: [{ updatedAt: "desc" }, { crystallizationScore: "desc" }],
      take: 80,
    }),
    prisma.jiEventRecord.findMany({
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      take: 40,
    }),
    getLatestEcosystemRunSummary(),
  ]);
  const clusterIdsForNode = (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId);
    const tagNames = node?.tags.map((entry) => entry.tag.name).slice(0, 4) ?? [];
    return tagNames.length ? tagNames : node ? [`phase:${node.phase}`] : [];
  };
  const clusterIdsForNodes = (nodeIds: string[]) =>
    Array.from(new Set(nodeIds.flatMap((nodeId) => clusterIdsForNode(nodeId))));

  const phaseFlow: MeaningFlowEvent[] = phaseEvents.map((event) => ({
    id: `phase:${event.id}`,
    type: "phase",
    side: sideForPhaseTransition({
      fromPhase: event.fromPhase,
      toPhase: event.toPhase,
      reason: event.reason,
    }),
    at: iso(event.createdAt),
    title: event.node.title,
    detail: `${event.fromPhase ?? "new"} -> ${event.toPhase}: ${event.reason}`,
    intensity: phaseIntensity(
      event.toPhase as Phase,
      event.node.crystallizationScore,
    ),
    href: `/nodes/${event.nodeId}`,
    phase: event.toPhase as Phase,
    score: Math.round(event.node.crystallizationScore),
    nodeId: event.nodeId,
    relatedNodeIds: [event.nodeId],
    clusterIds: clusterIdsForNode(event.nodeId),
  }));

  const edgeFlow: MeaningFlowEvent[] = edges.map((edge) => ({
    id: `edge:${edge.id}`,
    type: "edge",
    side: sideForRelation(edge.relation as EdgeRelation),
    at: iso(edge.createdAt),
    title: `${edge.from.title} -> ${edge.to.title}`,
    detail: `${edge.relation} with weight ${edge.weight}`,
    intensity: normalizeFlowIntensity(12 + edge.weight * 13),
    href: `/nodes/${edge.fromId}`,
    relation: edge.relation as EdgeRelation,
    nodeId: edge.fromId,
    relatedNodeIds: [edge.fromId, edge.toId],
    clusterIds: clusterIdsForNodes([edge.fromId, edge.toId]),
  }));

  const nodeFlow: MeaningFlowEvent[] = nodes.slice(0, 32).map((node) => {
    const isFresh =
      Math.abs(node.updatedAt.getTime() - node.createdAt.getTime()) < 1_500;
    return {
      id: `node:${node.id}:${isFresh ? "created" : "updated"}`,
      type: "node",
      side: isFresh
        ? "intake"
        : sideForPhaseTransition({ toPhase: node.phase as Phase }),
      at: iso(isFresh ? node.createdAt : node.updatedAt),
      title: node.title,
      detail: `${isFresh ? "Node entered pool" : "Node updated"} at score ${Math.round(node.crystallizationScore)}`,
      intensity: normalizeFlowIntensity(8 + node.crystallizationScore * 0.55),
      href: `/nodes/${node.id}`,
      phase: node.phase as Phase,
      score: Math.round(node.crystallizationScore),
      nodeId: node.id,
      relatedNodeIds: [node.id],
      clusterIds: clusterIdsForNode(node.id),
    } satisfies MeaningFlowEvent;
  });

  const corpusFlow: MeaningFlowEvent[] = observation.runs.slice(0, 12).map((run) => ({
    id: `corpus:${run.runId}`,
    type: "corpus",
    side: run.warnings > 0 ? "tension" : "intake",
    at: iso(run.createdAt),
    title: run.runId,
    detail: `${run.inputItems} input items produced ${run.marks} marks, ${run.trajectoryEvents} trajectory events, ${run.warnings} warnings`,
    intensity: normalizeFlowIntensity(
      10 + run.marks * 7 + run.trajectoryEvents * 4 + run.warnings * 12,
    ),
    href: "/observe",
  }));

  const marketContributionFlow: MeaningFlowEvent[] =
    market.recentContributions.slice(0, 24).map((event) => ({
      id: `market:contribution:${event.id}`,
      type: "market",
      side: sideForContribution(event.kind),
      at: event.createdAt,
      title: `${event.kind} · ${event.nodeTitle}`,
      detail: `${event.actorAlias} recorded weight ${event.weight}: ${event.body}`,
      intensity: normalizeFlowIntensity(10 + event.weight * 8),
      href: event.href,
      nodeId: event.nodeId,
      relatedNodeIds: [event.nodeId],
      clusterIds: clusterIdsForNode(event.nodeId),
    }));

  const marketOrderFlow: MeaningFlowEvent[] = market.recentOrders
    .slice(0, 24)
    .map((order) => ({
      id: `market:order:${order.id}`,
      type: "market",
      side: sideForMarketOrder(order.side),
      at: order.createdAt,
      title: `${order.side} · ${order.nodeTitle}`,
      detail: `${order.actorAlias} simulated ${order.quantity} @ ${order.price}${order.note ? `: ${order.note}` : ""}`,
      intensity: normalizeFlowIntensity(
        8 + Math.sqrt(Math.max(0, order.price * order.quantity)),
      ),
      href: order.href,
      nodeId: order.nodeId,
      relatedNodeIds: [order.nodeId],
      clusterIds: clusterIdsForNode(order.nodeId),
    }));

  const ecosystemFlow: MeaningFlowEvent[] = jiEvents.map((event) => {
    const href = event.importedNodeId
      ? `/nodes/${event.importedNodeId}`
      : event.sandboxRunId
        ? `/sandbox?run=${event.sandboxRunId}`
        : "/ecosystem";
    return {
      id: `ecosystem:${event.id}`,
      type: "ecosystem",
      side: sideForJiEvent(event.kind),
      at: iso(event.occurredAt),
      title: `${event.sourceProject} · ${event.title}`,
      detail: `${event.kind} / ${event.status}: ${event.body}`,
      intensity: normalizeFlowIntensity(
        12 + (event.ha ?? 2) * 7 + (event.status === "pending" ? 8 : 0),
      ),
      href,
      nodeId: event.importedNodeId ?? undefined,
      relatedNodeIds: event.importedNodeId ? [event.importedNodeId] : undefined,
      clusterIds: event.importedNodeId
        ? clusterIdsForNode(event.importedNodeId)
        : [`ecosystem:${event.sourceProject}`],
    } satisfies MeaningFlowEvent;
  });
  const daemonProposalFlow: MeaningFlowEvent[] =
    latestEcosystemRun?.proposals.slice(0, 12).map((proposal) => ({
      id: `ecosystem-daemon:${proposal.id}`,
      type: "ecosystem",
      side: sideForDaemonProposal(proposal.kind),
      at: proposal.createdAt,
      title: `daemon · ${proposal.title}`,
      detail: `${proposal.kind}: ${proposal.body}`,
      intensity: normalizeFlowIntensity(
        16 + (proposal.kind === "WORLDLINE_REHEARSAL" ? 16 : 8),
      ),
      href:
        proposal.kind === "WORLDLINE_REHEARSAL" && proposal.worldlineKey
          ? "/sandbox"
          : "/ecosystem",
      clusterIds: [
        proposal.worldlineKey
          ? `worldline:${proposal.worldlineKey}`
          : "ecosystem:daemon",
      ],
    })) ?? [];
  const ethicsFlow: MeaningFlowEvent[] = observation.ethics.results
    .filter((result) => result.status !== "pass")
    .slice(0, 8)
    .map((result) => ({
      id: `constitution:${result.invariantId}`,
      type: "ecosystem",
      side: sideForConstitutionStatus(result.status),
      at: observation.ethics.checkedAt,
      title: `constitution · ${result.title}`,
      detail: `${result.invariantId} ${result.status}: ${result.detail}`,
      intensity: normalizeFlowIntensity(result.status === "fail" ? 84 : 38),
      href: "/observe",
      clusterIds: ["ethics:constitution"],
    }));
  if (ethicsFlow.length === 0) {
    ethicsFlow.push({
      id: "constitution:pass",
      type: "ecosystem",
      side: "crystallize",
      at: observation.ethics.checkedAt,
      title: "constitution · ethical kernel",
      detail:
        "Ethical kernel passed local guardrails: no wallet, token, RPC, automatic upload, auto-unlock, or direct external canonical mutation.",
      intensity: normalizeFlowIntensity(34),
      href: "/observe",
      clusterIds: ["ethics:constitution"],
    });
  }

  const events = rankFlowEvents(
    [
      ...phaseFlow,
      ...edgeFlow,
      ...nodeFlow,
      ...corpusFlow,
      ...marketContributionFlow,
      ...marketOrderFlow,
      ...ecosystemFlow,
      ...daemonProposalFlow,
      ...ethicsFlow,
    ],
    120,
  );

  const relationDepth = edgeRelations.map((relation) => {
    const relationEdges = edges.filter((edge) => edge.relation === relation);
    return {
      relation,
      count: relationEdges.length,
      weight: Math.round(
        relationEdges.reduce((sum, edge) => sum + edge.weight, 0) * 10,
      ) / 10,
    };
  });
  const clusters = buildMeaningClusters({
    nodes: nodes.map((node) => ({
      id: node.id,
      title: node.title,
      phase: node.phase as Phase,
      crystallizationScore: node.crystallizationScore,
      emotionHa: node.emotionHa,
      tags: node.tags,
      incomingEdges: node.incomingEdges,
      outgoingEdges: node.outgoingEdges,
    })),
    contributions: market.recentContributions.map((event) => ({
      id: event.id,
      nodeId: event.nodeId,
      kind: event.kind,
      actorAlias: event.actorAlias,
      body: event.body,
      weight: event.weight,
      createdAt: event.createdAt,
      href: event.href,
    })),
    orders: market.recentOrders.map((order) => ({
      id: order.id,
      nodeId: order.nodeId,
      side: order.side,
      price: order.price,
      quantity: order.quantity,
      actorAlias: order.actorAlias,
      note: order.note,
      createdAt: order.createdAt,
      href: order.href,
    })),
  });
  const orderBook = buildMeaningOrderBook({
    signalPrice: market.depth.signalPrice,
    buyPressure: market.depth.buyPressure,
    sellPressure: market.depth.sellPressure,
    supportPressure: market.depth.supportPressure,
    challengePressure: market.depth.challengePressure,
  });

  return {
    generatedAt: new Date().toISOString(),
    events,
    lanes: buildFlowLanes(events),
    pressure: calculateFlowPressure(events),
    phaseDepth: buildPhaseDepth(
      Object.fromEntries(
        phases.map((phase) => [
          phase,
          nodes.filter((node) => node.phase === phase).length,
        ]),
      ) as Record<Phase, number>,
    ),
    relationDepth,
    topNodes: nodes
      .sort((a, b) => b.crystallizationScore - a.crystallizationScore)
      .slice(0, 8)
      .map((node) => ({
        id: node.id,
        title: node.title,
        phase: node.phase as Phase,
        score: Math.round(node.crystallizationScore),
        emotionHa: node.emotionHa,
        edgeCount: node.incomingEdges.length + node.outgoingEdges.length,
        href: `/nodes/${node.id}`,
      })),
    queue: {
      inboxItems: observation.inbox.items,
      inboxFiles: observation.inbox.files,
      latestRunId: observation.runs[0]?.runId,
      latestRunMarks: observation.runs[0]?.marks,
      latestRunWarnings: observation.runs[0]?.warnings,
      ecosystemPending: observation.ecosystem.pending,
      ecosystemInboxLines: observation.ecosystem.inbox.lines,
    },
    market: {
      signalPrice: market.depth.signalPrice,
      buyPressure: market.depth.buyPressure,
      sellPressure: market.depth.sellPressure,
      supportPressure: market.depth.supportPressure,
      challengePressure: market.depth.challengePressure,
      fundingIntent: market.depth.fundingIntent,
      verificationDepth: market.depth.verificationDepth,
      openOrders: market.depth.openOrders,
      contributionEvents: market.totals.contributionEvents,
      actors: market.totals.actors,
      pendingAnchors: market.totals.pendingAnchors,
      exportedAnchors: market.totals.exportedAnchors,
      proof: {
        ok: market.chain.ok,
        eventCount: market.chain.eventCount,
        anchoredEvents: market.chain.anchoredEvents,
        unanchoredEvents: market.chain.unanchoredEvents,
        coveragePercent: market.chain.coveragePercent,
        genesisHash: market.chain.genesisHash,
        latestHash: market.chain.latestHash,
        issues: market.chain.issues.slice(0, 3),
      },
      anchors: market.anchors.slice(0, 6).map((anchor) => ({
        id: anchor.id,
        provider: anchor.provider,
        status: anchor.status,
        eventCount: anchor.eventCount,
        bundleHash: anchor.bundleHash,
        externalProvider: anchor.externalProvider,
        externalRef: anchor.externalRef,
        createdAt: anchor.createdAt,
      })),
      clusters,
      orderBook,
      topBids: market.depth.topBids.map((order) => ({
        actorAlias: order.actorAlias,
        price: order.price,
        quantity: order.quantity,
        note: order.note,
      })),
      topAsks: market.depth.topAsks.map((order) => ({
        actorAlias: order.actorAlias,
        price: order.price,
        quantity: order.quantity,
        note: order.note,
      })),
      recentTape: market.recentContributions.slice(0, 8).map((event) => ({
        id: event.id,
        kind: event.kind,
        nodeTitle: event.nodeTitle,
        actorAlias: event.actorAlias,
        weight: event.weight,
        at: event.createdAt,
        href: event.href,
      })),
    },
  };
}
