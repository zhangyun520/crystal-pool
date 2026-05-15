import { clamp, type EdgeRelation, type Phase } from "./domain";

export const meaningFlowSides = [
  "crystallize",
  "soften",
  "tension",
  "dissolve",
  "intake",
  "neutral",
] as const;

export type MeaningFlowSide = (typeof meaningFlowSides)[number];

export type MeaningFlowEventType =
  | "phase"
  | "edge"
  | "node"
  | "corpus"
  | "market"
  | "ecosystem";

export type MeaningFlowEvent = {
  id: string;
  type: MeaningFlowEventType;
  side: MeaningFlowSide;
  at: string;
  title: string;
  detail: string;
  intensity: number;
  href?: string;
  phase?: Phase;
  relation?: EdgeRelation;
  score?: number;
  nodeId?: string;
  relatedNodeIds?: string[];
  clusterIds?: string[];
};

export type MeaningFlowLane = {
  side: MeaningFlowSide;
  label: string;
  totalIntensity: number;
  events: MeaningFlowEvent[];
};

export type MeaningFlowPressure = Record<MeaningFlowSide, number> & {
  netCrystallization: number;
};

export type MeaningDepthLevel = {
  label: string;
  count: number;
  share: number;
};

export type MeaningRelationDepth = {
  relation: EdgeRelation;
  count: number;
  weight: number;
};

export type MeaningFlowNode = {
  id: string;
  title: string;
  phase: Phase;
  score: number;
  emotionHa: number;
  edgeCount: number;
  href: string;
};

export type MeaningClusterSide = "bid" | "ask" | "balanced" | "quiet";

export type MeaningCluster = {
  id: string;
  label: string;
  nodeIds: string[];
  nodes: number;
  avgScore: number;
  edgeCount: number;
  avgHa: number;
  signalPrice: number;
  supportPressure: number;
  challengePressure: number;
  fundingIntent: number;
  verificationDepth: number;
  netPressure: number;
  dominantPhase: Phase;
  topNodeTitle: string;
  href: string;
  side: MeaningClusterSide;
  nodeSummaries: {
    id: string;
    title: string;
    phase: Phase;
    score: number;
    href: string;
  }[];
  recentContributions: {
    id: string;
    kind: string;
    actorAlias: string;
    body: string;
    weight: number;
    at: string;
    href: string;
  }[];
  recentOrders: {
    id: string;
    side: string;
    actorAlias: string;
    price: number;
    quantity: number;
    note?: string | null;
    at: string;
    href: string;
  }[];
};

export type MeaningOrderBookLevel = {
  price: number;
  bidSize: number;
  askSize: number;
  supportSize: number;
  challengeSize: number;
};

export type MeaningFlowSnapshot = {
  generatedAt: string;
  events: MeaningFlowEvent[];
  lanes: MeaningFlowLane[];
  pressure: MeaningFlowPressure;
  phaseDepth: MeaningDepthLevel[];
  relationDepth: MeaningRelationDepth[];
  topNodes: MeaningFlowNode[];
  queue: {
    inboxItems: number;
    inboxFiles: number;
    latestRunId?: string;
    latestRunMarks?: number;
    latestRunWarnings?: number;
    ecosystemPending?: number;
    ecosystemInboxLines?: number;
  };
  market: {
    signalPrice: number;
    buyPressure: number;
    sellPressure: number;
    supportPressure: number;
    challengePressure: number;
    fundingIntent: number;
    verificationDepth: number;
    openOrders: number;
    contributionEvents: number;
    actors: number;
    pendingAnchors: number;
    exportedAnchors: number;
    proof: {
      ok: boolean;
      eventCount: number;
      anchoredEvents: number;
      unanchoredEvents: number;
      coveragePercent: number;
      genesisHash: string | null;
      latestHash: string | null;
      issues: string[];
    };
    anchors: {
      id: string;
      provider: string;
      status: string;
      eventCount: number;
      bundleHash: string;
      externalProvider?: string | null;
      externalRef?: string | null;
      createdAt: string;
    }[];
    clusters: MeaningCluster[];
    orderBook: MeaningOrderBookLevel[];
    topBids: {
      actorAlias: string;
      price: number;
      quantity: number;
      note?: string | null;
    }[];
    topAsks: {
      actorAlias: string;
      price: number;
      quantity: number;
      note?: string | null;
    }[];
    recentTape: {
      id: string;
      kind: string;
      nodeTitle: string;
      actorAlias: string;
      weight: number;
      at: string;
      href: string;
    }[];
  };
};

export const laneLabels: Record<MeaningFlowSide, string> = {
  crystallize: "Crystallizing",
  soften: "Softening",
  tension: "Tension",
  dissolve: "Dissolving",
  intake: "Intake",
  neutral: "Neutral",
};

export function sideForPhaseTransition({
  fromPhase,
  toPhase,
  reason,
}: {
  fromPhase?: Phase | null;
  toPhase: Phase;
  reason?: string;
}): MeaningFlowSide {
  const lowerReason = reason?.toLowerCase() ?? "";
  if (lowerReason.includes("ha") || (fromPhase === "fossil" && toPhase === "liquid")) {
    return "soften";
  }
  if (toPhase === "seed" || toPhase === "crystal") return "crystallize";
  if (toPhase === "fossil") return "tension";
  if (toPhase === "dissolved") return "dissolve";
  if (!fromPhase) return "intake";
  return "neutral";
}

export function sideForRelation(relation: EdgeRelation): MeaningFlowSide {
  if (relation === "hardens_into" || relation === "triggers") {
    return "crystallize";
  }
  if (relation === "ha_softens") return "soften";
  if (relation === "contradicts") return "tension";
  if (relation === "dissolves_into") return "dissolve";
  return "neutral";
}

export function normalizeFlowIntensity(value: number) {
  return Math.round(clamp(value, 1, 100));
}

export function rankFlowEvents(events: MeaningFlowEvent[], limit = 80) {
  return [...events]
    .sort((a, b) => {
      const timeDelta = b.at.localeCompare(a.at);
      if (timeDelta !== 0) return timeDelta;
      return b.intensity - a.intensity;
    })
    .slice(0, limit);
}

export function calculateFlowPressure(
  events: MeaningFlowEvent[],
): MeaningFlowPressure {
  const base = Object.fromEntries(
    meaningFlowSides.map((side) => [side, 0]),
  ) as MeaningFlowPressure;
  for (const event of events) {
    base[event.side] += event.intensity;
  }
  base.netCrystallization =
    base.crystallize - base.dissolve - Math.round(base.tension * 0.35);
  return base;
}

export function buildFlowLanes(events: MeaningFlowEvent[]): MeaningFlowLane[] {
  return meaningFlowSides.map((side) => {
    const laneEvents = rankFlowEvents(
      events.filter((event) => event.side === side),
      8,
    );
    return {
      side,
      label: laneLabels[side],
      totalIntensity: laneEvents.reduce(
        (sum, event) => sum + event.intensity,
        0,
      ),
      events: laneEvents,
    };
  });
}

export function buildPhaseDepth(
  counts: Partial<Record<Phase, number>>,
): MeaningDepthLevel[] {
  const total = Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);
  return Object.entries(counts).map(([label, count]) => ({
    label,
    count: count ?? 0,
    share: total ? Math.round(((count ?? 0) / total) * 100) : 0,
  }));
}
