"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Anchor,
  ArrowDownRight,
  CircleDot,
  Link2,
  Layers3,
  Pause,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  laneLabels,
  meaningFlowSides,
  type MeaningCluster,
  type MeaningClusterSide,
  type MeaningFlowEvent,
  type MeaningFlowSide,
  type MeaningOrderBookLevel,
  type MeaningFlowSnapshot,
} from "@/lib/meaningFlow";

const sideStyles: Record<MeaningFlowSide, string> = {
  crystallize: "bg-lime-100 text-lime-950 border-lime-200",
  soften: "bg-cyan-100 text-cyan-950 border-cyan-200",
  tension: "bg-amber-100 text-amber-950 border-amber-200",
  dissolve: "bg-rose-100 text-rose-950 border-rose-200",
  intake: "bg-violet-100 text-violet-950 border-violet-200",
  neutral: "bg-stone-100 text-stone-700 border-stone-200",
};

const sideBarStyles: Record<MeaningFlowSide, string> = {
  crystallize: "bg-lime-400",
  soften: "bg-cyan-400",
  tension: "bg-amber-400",
  dissolve: "bg-rose-400",
  intake: "bg-violet-400",
  neutral: "bg-stone-400",
};

const clusterSideStyles: Record<MeaningClusterSide, string> = {
  bid: "bg-lime-300 text-lime-950",
  ask: "bg-rose-300 text-rose-950",
  balanced: "bg-cyan-300 text-cyan-950",
  quiet: "bg-stone-300 text-stone-950",
};

export function MeaningFlowBoard({
  initialSnapshot,
  poolSlug = "canonical",
}: {
  initialSnapshot: MeaningFlowSnapshot;
  poolSlug?: string;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [isLive, setIsLive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/meaning-flow?pool=${poolSlug}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Flow snapshot failed");
      setSnapshot((await response.json()) as MeaningFlowSnapshot);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Flow unavailable");
    }
  }, [poolSlug]);

  useEffect(() => {
    if (!isLive) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [isLive, refresh]);

  const maxPressure = useMemo(
    () =>
      Math.max(
        1,
        ...meaningFlowSides.map((side) => snapshot.pressure[side] ?? 0),
      ),
    [snapshot.pressure],
  );
  const tape = snapshot.events.slice(0, 42);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 lg:grid-cols-7">
        <Metric label="Net crystallization" value={snapshot.pressure.netCrystallization} detail="positive means hardening bias" />
        <Metric label="Tape events" value={snapshot.events.length} detail="latest local flow" />
        <Metric label="Signal price" value={snapshot.market.signalPrice} detail="simulated meaning price" />
        <Metric label="Buy pressure" value={snapshot.market.buyPressure} detail={`${snapshot.market.openOrders} open orders`} />
        <Metric label="Ecosystem Ji" value={snapshot.queue.ecosystemPending ?? 0} detail={`${snapshot.queue.ecosystemInboxLines ?? 0} inbox lines`} />
        <Metric label="Pending anchors" value={snapshot.market.pendingAnchors} detail={`${snapshot.market.exportedAnchors} exported bundles`} />
        <Metric label="Proof coverage" value={`${snapshot.market.proof.coveragePercent}%`} detail={`${snapshot.market.proof.unanchoredEvents} unanchored events`} />
      </section>

      <OrderFlowTerminal snapshot={snapshot} />

      <ProofChainStrip snapshot={snapshot} />

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Meaning Tape</h2>
            <p className="mt-1 text-sm text-stone-600">
              Auto-refreshing every five seconds. Generated at{" "}
              {formatDate(snapshot.generatedAt)}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {error ? (
              <span className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-950">
                {error}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setIsLive((value) => !value)}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700"
            >
              {isLive ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
              {isLive ? "Pause" : "Live"}
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white"
            >
              <RefreshCw size={16} aria-hidden />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {tape.map((event) => (
            <FlowTapeRow key={event.id} event={event} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)]">
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold">Market Depth</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MarketRow
              label="Support pressure"
              value={snapshot.market.supportPressure}
              tone="bg-lime-400"
            />
            <MarketRow
              label="Challenge pressure"
              value={snapshot.market.challengePressure}
              tone="bg-amber-400"
            />
            <MarketRow
              label="Funding intent"
              value={snapshot.market.fundingIntent}
              tone="bg-cyan-400"
            />
            <MarketRow
              label="Verification depth"
              value={snapshot.market.verificationDepth}
              tone="bg-stone-800"
            />
          </div>
        </div>

        <aside className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Market Tape</h2>
            <span className="text-sm text-stone-500">
              {snapshot.market.contributionEvents} events · {snapshot.market.actors} actors
            </span>
          </div>
          <div className="mt-4 grid gap-2">
            {snapshot.market.recentTape.length === 0 ? (
              <p className="text-sm text-stone-500">
                No contribution events yet. Add support, challenge, or verification from a node.
              </p>
            ) : (
              snapshot.market.recentTape.map((event) => (
                <Link
                  key={event.id}
                  href={event.href}
                  className="rounded-md bg-stone-50 p-3 text-sm transition hover:bg-stone-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium">{event.kind}</span>
                    <span className="text-xs text-stone-500">
                      w{event.weight}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-stone-600">
                    {event.actorAlias} · {event.nodeTitle}
                  </p>
                </Link>
              ))
            )}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)]">
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold">Parallel Lanes</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {snapshot.lanes
              .filter((lane) => lane.side !== "neutral")
              .map((lane) => (
                <section
                  key={lane.side}
                  className="rounded-lg border border-stone-200 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{lane.label}</h3>
                    <span className="text-sm text-stone-500">
                      {lane.totalIntensity}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {lane.events.length === 0 ? (
                      <p className="text-sm text-stone-500">Quiet lane.</p>
                    ) : (
                      lane.events.slice(0, 4).map((event) => (
                        <SmallEvent key={event.id} event={event} />
                      ))
                    )}
                  </div>
                </section>
              ))}
          </div>
        </div>

        <aside className="grid gap-6">
          <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-semibold">Pressure</h2>
            <div className="mt-4 grid gap-3">
              {meaningFlowSides.map((side) => (
                <PressureRow
                  key={side}
                  side={side}
                  value={snapshot.pressure[side] ?? 0}
                  max={maxPressure}
                />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-semibold">Phase Depth</h2>
            <div className="mt-4 grid gap-3">
              {snapshot.phaseDepth.map((level) => (
                <DepthRow
                  key={level.label}
                  label={level.label}
                  count={level.count}
                  share={level.share}
                />
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(380px,0.7fr)]">
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold">Top Meaning Levels</h2>
          <div className="mt-4 grid gap-3">
            {snapshot.topNodes.map((node) => (
              <Link
                key={node.id}
                href={node.href}
                className="rounded-md border border-stone-200 p-3 transition hover:bg-stone-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{node.title}</h3>
                    <p className="mt-1 text-sm text-stone-600">
                      {node.phase} · {node.edgeCount} edges · ha {node.emotionHa}
                    </p>
                  </div>
                  <span className="rounded-md bg-stone-950 px-2 py-1 text-sm font-semibold text-white">
                    {node.score}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold">Relation Depth</h2>
          <div className="mt-4 grid gap-3">
            {snapshot.relationDepth.map((relation) => (
              <div
                key={relation.relation}
                className="flex items-center justify-between gap-3 rounded-md bg-stone-50 p-3"
              >
                <span className="text-sm font-medium text-stone-700">
                  {relation.relation}
                </span>
                <span className="text-sm text-stone-500">
                  {relation.count} edges · weight {relation.weight}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FlowTapeRow({ event }: { event: MeaningFlowEvent }) {
  const content = (
    <article className="grid gap-3 rounded-md border border-stone-200 p-3 transition hover:bg-stone-50 lg:grid-cols-[104px_140px_minmax(0,1fr)_88px] lg:items-center">
      <time className="text-xs font-medium text-stone-500">
        {formatTime(event.at)}
      </time>
      <span
        className={`inline-flex w-fit items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${sideStyles[event.side]}`}
      >
        <CircleDot size={12} aria-hidden />
        {event.side}
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{event.title}</h3>
          <span className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-600">
            {event.type}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-stone-600">{event.detail}</p>
      </div>
      <Intensity value={event.intensity} side={event.side} />
    </article>
  );

  return event.href ? (
    <Link href={event.href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function OrderFlowTerminal({
  snapshot,
}: {
  snapshot: MeaningFlowSnapshot;
}) {
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(
    snapshot.market.clusters[0]?.id ?? null,
  );
  const maxClusterPressure = Math.max(
    1,
    ...snapshot.market.clusters.map((cluster) =>
      Math.max(cluster.supportPressure, cluster.challengePressure),
    ),
  );
  const selectedCluster =
    selectedClusterId === null
      ? null
      : snapshot.market.clusters.find((cluster) => cluster.id === selectedClusterId) ??
        null;
  const selectedClusterNodeIds = new Set(selectedCluster?.nodeIds ?? []);
  const topTape = snapshot.events
    .filter(
      (event) =>
        event.type === "market" ||
        event.type === "edge" ||
        event.type === "ecosystem",
    )
    .filter((event) => {
      if (!selectedCluster) return true;
      if (event.clusterIds?.includes(selectedCluster.id)) return true;
      return event.relatedNodeIds?.some((nodeId) => selectedClusterNodeIds.has(nodeId));
    })
    .slice(0, 10);
  const ladderLevels = selectedCluster
    ? buildClusterBookLevels(selectedCluster)
    : snapshot.market.orderBook;
  const ladderSignal = selectedCluster?.signalPrice ?? snapshot.market.signalPrice;

  return (
    <section className="overflow-hidden rounded-lg border border-stone-900 bg-stone-950 text-stone-50 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-stone-800 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-9 items-center gap-2 rounded-md bg-lime-300 px-3 text-sm font-black uppercase text-lime-950">
            <Layers3 size={16} aria-hidden />
            Meaning Order Flow
          </span>
          <TerminalMetric label="SIG" value={snapshot.market.signalPrice} />
          <TerminalMetric label="BID" value={snapshot.market.buyPressure} />
          <TerminalMetric label="ASK/CHAL" value={snapshot.market.challengePressure} />
          <TerminalMetric label="VERIFY" value={snapshot.market.verificationDepth} />
          <TerminalMetric label="JI" value={snapshot.queue.ecosystemPending ?? 0} />
          <TerminalMetric label="PROOF" value={snapshot.market.proof.ok ? "OK" : "CHECK"} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
          <button
            type="button"
            onClick={() => setSelectedClusterId(null)}
            className="h-7 rounded bg-stone-800 px-2 font-semibold text-stone-200 transition hover:bg-stone-700"
          >
            All clusters
          </button>
          {selectedCluster ? (
            <span className="rounded bg-lime-300 px-2 py-1 font-semibold text-lime-950">
              watching {selectedCluster.label}
            </span>
          ) : null}
          <span>live {formatTime(snapshot.generatedAt)}</span>
          <span className="rounded bg-stone-800 px-2 py-1">
            {snapshot.market.contributionEvents} chain events
          </span>
          <span className="rounded bg-stone-800 px-2 py-1">
            {snapshot.market.exportedAnchors} anchors
          </span>
          <span className="rounded bg-stone-800 px-2 py-1">
            head {shortHash(snapshot.market.proof.latestHash)}
          </span>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_330px_360px]">
        <div className="border-b border-stone-800 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h2 className="text-sm font-black uppercase tracking-normal text-stone-100">
              Cluster Heatmap
            </h2>
            <span className="text-xs text-stone-400">
              tag clusters · support/challenge imbalance
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full border-t border-stone-800 text-left text-xs">
              <thead className="bg-stone-900 text-stone-400">
                <tr>
                  <TerminalTh>Cluster</TerminalTh>
                  <TerminalTh>Side</TerminalTh>
                  <TerminalTh>Sig</TerminalTh>
                  <TerminalTh>Nodes</TerminalTh>
                  <TerminalTh>Avg</TerminalTh>
                  <TerminalTh>Bid pressure</TerminalTh>
                  <TerminalTh>Challenge</TerminalTh>
                  <TerminalTh>Fund</TerminalTh>
                  <TerminalTh>Verify</TerminalTh>
                  <TerminalTh>Lead</TerminalTh>
                </tr>
              </thead>
              <tbody>
                {snapshot.market.clusters.map((cluster) => (
                  <ClusterRow
                    key={cluster.id}
                    cluster={cluster}
                    maxPressure={maxClusterPressure}
                    selected={cluster.id === selectedCluster?.id}
                    onSelect={() => setSelectedClusterId(cluster.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <OrderBookLadder
          levels={ladderLevels}
          signalPrice={ladderSignal}
          label={selectedCluster?.label ?? "all"}
        />

        <div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h2 className="text-sm font-black uppercase tracking-normal text-stone-100">
              Market Prints
            </h2>
            <span className="text-xs text-stone-400">
              newest pressure prints
            </span>
          </div>
          <div className="border-t border-stone-800">
            {topTape.length === 0 ? (
              <p className="px-4 py-5 text-sm text-stone-400">
                No market prints yet.
              </p>
            ) : (
              topTape.map((event) => (
                <TerminalTapeRow key={event.id} event={event} />
              ))
            )}
          </div>
          <ClusterInspector cluster={selectedCluster} />
        </div>
      </div>
    </section>
  );
}

function ProofChainStrip({ snapshot }: { snapshot: MeaningFlowSnapshot }) {
  const proof = snapshot.market.proof;
  const StatusIcon = proof.ok ? ShieldCheck : ShieldAlert;
  const anchors = snapshot.market.anchors.slice(0, 3);

  return (
    <section
      id="flow-proof-chain"
      className="overflow-hidden rounded-lg border border-stone-900 bg-[#10130f] text-stone-50 shadow-sm"
    >
      <div className="grid gap-0 xl:grid-cols-[minmax(0,0.75fr)_minmax(360px,0.55fr)]">
        <div className="border-b border-stone-800 p-4 xl:border-b-0 xl:border-r">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-cyan-200 px-3 py-2 text-sm font-black uppercase text-cyan-950">
                <StatusIcon size={16} aria-hidden />
                Local Proof Chain
              </div>
              <h2 className="mt-3 text-xl font-semibold">Hash spine and anchor state</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-400">
                Contribution events stay local and deterministic. External refs are manual handoff notes, never automatic uploads.
              </p>
            </div>
            <Link
              href="/observe#proof-chain"
              className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-stone-700 px-3 text-sm font-semibold text-stone-100 hover:bg-stone-900"
            >
              <Link2 size={16} aria-hidden />
              Open explorer
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <ProofMetric label="events" value={proof.eventCount} />
            <ProofMetric label="anchored" value={proof.anchoredEvents} />
            <ProofMetric label="pending" value={proof.unanchoredEvents} />
            <ProofMetric label="coverage" value={`${proof.coveragePercent}%`} />
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <HashPlate label="genesis" value={proof.genesisHash} />
            <HashPlate label="latest" value={proof.latestHash} />
          </div>

          {!proof.ok ? (
            <div className="mt-4 rounded-md border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">
              {proof.issues[0] ?? "Proof chain needs inspection."}
            </div>
          ) : null}
        </div>

        <aside className="p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-normal text-stone-100">
              Anchor lane
            </h2>
            <span className="rounded bg-stone-900 px-2 py-1 text-xs text-stone-400">
              local/manual
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {anchors.length === 0 ? (
              <div className="rounded-md border border-dashed border-stone-700 p-4 text-sm text-stone-400">
                No exported anchor bundles yet. Pending contribution events are visible as proof pressure.
              </div>
            ) : (
              anchors.map((anchor) => (
                <Link
                  key={anchor.id}
                  href="/observe#anchors"
                  className="rounded-md border border-stone-800 bg-stone-950 p-3 text-sm hover:bg-stone-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <Anchor size={15} aria-hidden />
                      {anchor.provider}
                    </span>
                    <span className="rounded bg-stone-800 px-2 py-1 text-xs text-stone-300">
                      {anchor.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-stone-500">
                    {anchor.eventCount} events · {formatDate(anchor.createdAt)}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-cyan-200">
                    {shortHash(anchor.bundleHash)}
                  </p>
                  {anchor.externalRef ? (
                    <p className="mt-2 truncate text-xs text-lime-200">
                      {anchor.externalProvider}: {anchor.externalRef}
                    </p>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function ProofMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border border-stone-800 bg-stone-950 p-3">
      <p className="text-xs uppercase text-stone-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-black text-stone-50">{value}</p>
    </div>
  );
}

function HashPlate({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-md border border-stone-800 bg-stone-950 p-3">
      <p className="text-xs uppercase text-stone-500">{label}</p>
      <p className="mt-1 break-all font-mono text-xs text-cyan-200">
        {value ?? "none"}
      </p>
    </div>
  );
}

function ClusterRow({
  cluster,
  maxPressure,
  selected,
  onSelect,
}: {
  cluster: MeaningCluster;
  maxPressure: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const bidWidth = `${Math.max(2, Math.round((cluster.supportPressure / maxPressure) * 100))}%`;
  const askWidth = `${Math.max(2, Math.round((cluster.challengePressure / maxPressure) * 100))}%`;

  return (
    <tr
      className={`border-t border-stone-800 text-stone-200 hover:bg-stone-900 ${
        selected ? "bg-stone-900 outline outline-1 outline-lime-300" : ""
      }`}
    >
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={onSelect}
          className="text-left font-semibold hover:text-lime-200"
        >
          {cluster.label}
        </button>
        <p className="mt-0.5 max-w-44 truncate text-[11px] text-stone-500">
          {cluster.topNodeTitle}
        </p>
      </td>
      <td className="px-3 py-2">
        <span
          className={`inline-flex min-w-16 justify-center rounded px-2 py-1 text-[11px] font-black uppercase ${clusterSideStyles[cluster.side]}`}
        >
          {cluster.side}
        </span>
      </td>
      <td className="px-3 py-2 font-mono text-lime-200">
        {cluster.signalPrice}
      </td>
      <td className="px-3 py-2 font-mono">{cluster.nodes}</td>
      <td className="px-3 py-2 font-mono">{cluster.avgScore}</td>
      <td className="px-3 py-2">
        <PressureCell
          value={cluster.supportPressure}
          width={bidWidth}
          bar="bg-lime-400"
        />
      </td>
      <td className="px-3 py-2">
        <PressureCell
          value={cluster.challengePressure}
          width={askWidth}
          bar="bg-rose-400"
        />
      </td>
      <td className="px-3 py-2 font-mono text-cyan-200">
        {cluster.fundingIntent}
      </td>
      <td className="px-3 py-2 font-mono text-stone-200">
        {cluster.verificationDepth}
      </td>
      <td className="px-3 py-2">
        <span className="rounded bg-stone-800 px-2 py-1 text-[11px] text-stone-300">
          {cluster.dominantPhase}
        </span>
      </td>
    </tr>
  );
}

function OrderBookLadder({
  levels,
  signalPrice,
  label,
}: {
  levels: MeaningOrderBookLevel[];
  signalPrice: number;
  label: string;
}) {
  const maxSize = Math.max(
    1,
    ...levels.flatMap((level) => [level.bidSize, level.askSize]),
  );
  const asks = levels.filter((level) => level.price >= signalPrice).reverse();
  const bids = levels.filter((level) => level.price <= signalPrice).reverse();

  return (
    <div className="border-b border-stone-800 xl:border-b-0 xl:border-r">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-black uppercase tracking-normal text-stone-100">
          Meaning DOM
        </h2>
        <span className="text-xs text-stone-400">{label} ladder</span>
      </div>
      <div className="border-t border-stone-800 px-3 py-3">
        <div className="grid grid-cols-[1fr_76px_1fr] px-2 pb-2 text-[11px] uppercase text-stone-500">
          <span>Ask/Challenge</span>
          <span className="text-center">Price</span>
          <span className="text-right">Bid/Support</span>
        </div>
        <div className="grid gap-1">
          {asks.map((level) => (
            <BookLevelRow
              key={`ask:${level.price}`}
              level={level}
              maxSize={maxSize}
              side="ask"
            />
          ))}
          <div className="my-2 rounded bg-lime-300 px-3 py-2 text-center font-mono text-sm font-black text-lime-950">
            MID {signalPrice}
          </div>
          {bids.map((level) => (
            <BookLevelRow
              key={`bid:${level.price}`}
              level={level}
              maxSize={maxSize}
              side="bid"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ClusterInspector({ cluster }: { cluster: MeaningCluster | null }) {
  if (!cluster) {
    return (
      <div className="border-t border-stone-800 px-4 py-4 text-sm text-stone-400">
        Select a cluster to inspect its nodes, contribution prints, and simulated orders.
      </div>
    );
  }

  return (
    <aside className="border-t border-stone-800 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-normal text-stone-100">
            Cluster Inspector
          </h2>
          <p className="mt-1 text-lg font-semibold text-lime-200">
            {cluster.label}
          </p>
        </div>
        <Link
          href={cluster.href}
          className="rounded bg-stone-800 px-2 py-1 text-xs font-semibold text-stone-200 hover:bg-stone-700"
        >
          Open lead
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <InspectorMetric label="net" value={cluster.netPressure} />
        <InspectorMetric label="ha" value={cluster.avgHa} />
        <InspectorMetric label="phase" value={cluster.dominantPhase} />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase text-stone-500">
          Nodes
        </p>
        <div className="grid gap-2">
          {cluster.nodeSummaries.slice(0, 5).map((node) => (
            <Link
              key={node.id}
              href={node.href}
              className="grid grid-cols-[minmax(0,1fr)_44px] items-center gap-3 rounded bg-stone-900 p-2 text-xs hover:bg-stone-800"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-stone-100">
                  {node.title}
                </p>
                <p className="mt-0.5 text-stone-500">{node.phase}</p>
              </div>
              <span className="text-right font-mono text-lime-200">
                {node.score}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
        <InspectorList
          title="Contribution Prints"
          empty="No contribution prints in this cluster."
          items={cluster.recentContributions.map((event) => ({
            id: event.id,
            href: event.href,
            label: `${event.kind} · w${event.weight}`,
            detail: `${event.actorAlias}: ${event.body}`,
          }))}
        />
        <InspectorList
          title="Sim Orders"
          empty="No simulated orders in this cluster."
          items={cluster.recentOrders.map((order) => ({
            id: order.id,
            href: order.href,
            label: `${order.side} ${order.quantity} @ ${order.price}`,
            detail: `${order.actorAlias}${order.note ? `: ${order.note}` : ""}`,
          }))}
        />
      </div>
    </aside>
  );
}

function InspectorMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded bg-stone-900 p-2">
      <p className="text-stone-500">{label}</p>
      <p className="mt-1 truncate font-mono font-semibold text-stone-100">
        {value}
      </p>
    </div>
  );
}

function InspectorList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { id: string; href: string; label: string; detail: string }[];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-stone-500">
        {title}
      </p>
      <div className="grid gap-2">
        {items.length === 0 ? (
          <p className="rounded bg-stone-900 p-2 text-xs text-stone-500">
            {empty}
          </p>
        ) : (
          items.slice(0, 4).map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded bg-stone-900 p-2 text-xs hover:bg-stone-800"
            >
              <p className="font-semibold text-stone-100">{item.label}</p>
              <p className="mt-0.5 line-clamp-2 text-stone-500">
                {item.detail}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function buildClusterBookLevels(cluster: MeaningCluster): MeaningOrderBookLevel[] {
  const center = Math.max(1, Math.round(cluster.signalPrice / 5) * 5);
  return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const closeness = Math.max(0.2, 1 - Math.abs(offset) * 0.18);
    const isBid = offset <= 0;
    const isAsk = offset >= 0;
    return {
      price: center + offset * 5,
      bidSize: isBid
        ? Math.round((cluster.supportPressure + cluster.fundingIntent * 0.4) * closeness)
        : 0,
      askSize: isAsk ? Math.round(cluster.challengePressure * closeness) : 0,
      supportSize: isBid ? Math.round(cluster.supportPressure * closeness) : 0,
      challengeSize: isAsk
        ? Math.round(cluster.challengePressure * closeness)
        : 0,
    };
  });
}

function BookLevelRow({
  level,
  maxSize,
  side,
}: {
  level: MeaningOrderBookLevel;
  maxSize: number;
  side: "bid" | "ask";
}) {
  const bidWidth = `${Math.max(2, Math.round((level.bidSize / maxSize) * 100))}%`;
  const askWidth = `${Math.max(2, Math.round((level.askSize / maxSize) * 100))}%`;
  return (
    <div className="grid h-8 grid-cols-[1fr_76px_1fr] items-center overflow-hidden rounded bg-stone-900 text-xs">
      <div className="relative h-full">
        <div
          className="absolute inset-y-0 right-0 bg-rose-500/35"
          style={{ width: askWidth }}
        />
        <span className="relative flex h-full items-center px-2 font-mono text-rose-100">
          {side === "ask" ? level.askSize : level.challengeSize}
        </span>
      </div>
      <div className="text-center font-mono font-semibold text-stone-100">
        {level.price}
      </div>
      <div className="relative h-full">
        <div
          className="absolute inset-y-0 left-0 bg-lime-400/35"
          style={{ width: bidWidth }}
        />
        <span className="relative flex h-full items-center justify-end px-2 font-mono text-lime-100">
          {side === "bid" ? level.bidSize : level.supportSize}
        </span>
      </div>
    </div>
  );
}

function TerminalTapeRow({ event }: { event: MeaningFlowEvent }) {
  return (
    <Link
      href={event.href ?? "/flow"}
      className="grid grid-cols-[74px_84px_minmax(0,1fr)_52px] items-center gap-2 border-b border-stone-800 px-4 py-2 text-xs hover:bg-stone-900"
    >
      <time className="font-mono text-stone-500">{formatTime(event.at)}</time>
      <span
        className={`rounded px-2 py-1 text-center font-black uppercase ${sideStyles[event.side]}`}
      >
        {event.side}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-stone-100">{event.title}</p>
        <p className="truncate text-stone-500">{event.detail}</p>
      </div>
      <span className="text-right font-mono text-lime-200">
        {event.intensity}
      </span>
    </Link>
  );
}

function PressureCell({
  value,
  width,
  bar,
}: {
  value: number;
  width: string;
  bar: string;
}) {
  return (
    <div className="min-w-28">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono">{formatCompact(value)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-800">
        <div className={`h-full ${bar}`} style={{ width }} />
      </div>
    </div>
  );
}

function TerminalTh({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2 font-semibold">{children}</th>;
}

function TerminalMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <span className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-700 px-3 font-mono text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="font-black text-stone-50">{value}</span>
    </span>
  );
}

function SmallEvent({ event }: { event: MeaningFlowEvent }) {
  return (
    <Link
      href={event.href ?? "/flow"}
      className="rounded-md bg-stone-50 p-3 text-sm transition hover:bg-stone-100"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium">{event.title}</span>
        <span className="text-xs text-stone-500">{event.intensity}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-stone-600">{event.detail}</p>
    </Link>
  );
}

function PressureRow({
  side,
  value,
  max,
}: {
  side: MeaningFlowSide;
  value: number;
  max: number;
}) {
  const width = `${Math.max(2, Math.round((value / max) * 100))}%`;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-stone-700">{laneLabels[side]}</span>
        <span className="text-stone-500">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full ${sideBarStyles[side]}`} style={{ width }} />
      </div>
    </div>
  );
}

function DepthRow({
  label,
  count,
  share,
}: {
  label: string;
  count: number;
  share: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-stone-700">{label}</span>
        <span className="text-stone-500">
          {count} · {share}%
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full bg-stone-800" style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

function Intensity({
  value,
  side,
}: {
  value: number;
  side: MeaningFlowSide;
}) {
  return (
    <div className="min-w-20">
      <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
        <span className="inline-flex items-center gap-1">
          <Zap size={12} aria-hidden />
          {value}
        </span>
        <ArrowDownRight size={12} aria-hidden />
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full ${sideBarStyles[side]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-stone-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 break-words text-sm text-stone-500">{detail}</p>
    </div>
  );
}

function MarketRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  const width = `${Math.max(2, Math.min(100, Math.round(value)))}%`;
  return (
    <div className="rounded-md bg-stone-50 p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-stone-700">{label}</span>
        <span className="text-stone-500">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div className={`h-full ${tone}`} style={{ width }} />
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatCompact(value: number) {
  if (Math.abs(value) >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(Math.round(value));
}

function shortHash(value: string | null | undefined) {
  if (!value) return "none";
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}
