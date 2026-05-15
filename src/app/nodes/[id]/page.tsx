import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, GitBranch, Pencil } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  MeaningTimelinePanel,
  PhaseSuggestionPanel,
  ScoreBreakdownPanel,
  ScoreNowPanel,
} from "@/components/MeaningPanels";
import { EdgeRelationSelect } from "@/components/NodeForm";
import { PhaseBadge } from "@/components/PhaseBadge";
import { calculateCrystallizationBreakdown } from "@/lib/crystallization";
import { contributionKinds, marketOrderSides } from "@/lib/market";
import { phases, type CrystalNodeCore, type PhaseEventCore } from "@/lib/domain";
import {
  buildCrystallizationTimeline,
  explainScoreNow,
  explainScoreBreakdown,
  suggestPhaseInterventions,
  summarizeScoreDrivers,
} from "@/lib/meaningEngine";
import {
  createEdgeAction,
  createContributionEventAction,
  createMarketOrderAction,
  deleteEdgeAction,
  archiveNodeAction,
  haSoftenAction,
  mergeNodeAction,
  splitNodeAction,
  transitionPhaseAction,
  updateEdgeAction,
} from "@/server/actions";
import { getNodeMarket } from "@/server/market";
import { getNode, getNodesForSelection } from "@/server/queries";

export default async function NodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const node = await getNode(id);
  if (!node) notFound();
  const [nodeOptions, nodeMarket] = await Promise.all([
    getNodesForSelection(id),
    getNodeMarket(id),
  ]);
  const isArchived = Boolean(node.archivedAt);

  const connectedEdges = [
    ...node.outgoingEdges.map((edge) => ({
      id: edge.id,
      direction: "out" as const,
      label: edge.to.title,
      nodeId: edge.toId,
      relation: edge.relation,
      weight: edge.weight,
      createdAt: edge.createdAt,
    })),
    ...node.incomingEdges.map((edge) => ({
      id: edge.id,
      direction: "in" as const,
      label: edge.from.title,
      nodeId: edge.fromId,
      relation: edge.relation,
      weight: edge.weight,
      createdAt: edge.createdAt,
    })),
  ];
  const scoreEdges = connectedEdges.map((edge) => ({
    id: edge.id,
    fromId: edge.direction === "out" ? node.id : edge.nodeId,
    toId: edge.direction === "out" ? edge.nodeId : node.id,
    relation: edge.relation,
    weight: edge.weight,
    createdAt: edge.createdAt,
    relatedTitle: edge.label,
    direction: edge.direction,
  }));
  const phaseEvents = node.phaseEvents as unknown as PhaseEventCore[];
  const nodeCore = node as unknown as CrystalNodeCore;
  const scoreBreakdown = calculateCrystallizationBreakdown(
    nodeCore,
    scoreEdges,
    phaseEvents,
  );
  const scoreNowExplanation = explainScoreNow(
    nodeCore,
    scoreBreakdown,
    scoreEdges,
    phaseEvents,
  );
  const scoreExplanations = explainScoreBreakdown(
    scoreBreakdown,
    nodeCore,
    scoreEdges,
    phaseEvents,
  );
  const scoreDrivers = summarizeScoreDrivers(scoreExplanations);
  const phaseSuggestions = suggestPhaseInterventions(
    nodeCore,
    scoreEdges,
    phaseEvents,
  );
  const meaningTimeline = buildCrystallizationTimeline(
    nodeCore,
    scoreEdges,
    phaseEvents,
  );

  return (
    <AppShell>
      <Link
        href="/nodes"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-stone-600"
      >
        <ArrowLeft size={16} aria-hidden />
        Back to nodes
      </Link>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <article className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <PhaseBadge phase={node.phase} />
              {isArchived ? (
                <span className="ml-2 inline-flex items-center rounded-md bg-stone-200 px-2 py-1 text-xs font-semibold uppercase text-stone-700">
                  archived
                </span>
              ) : null}
              <h1 className="mt-4 text-3xl font-semibold leading-tight">
                {node.title}
              </h1>
              {isArchived ? (
                <p className="mt-3 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-600">
                  Archived{" "}
                  {node.archivedAt
                    ? node.archivedAt.toLocaleString()
                    : "without timestamp"}
                  {node.archiveReason ? ` · ${node.archiveReason}` : ""}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/nodes/${node.id}/edit`}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold"
              >
                <Pencil size={15} aria-hidden />
                Edit
              </Link>
              <form action={archiveNodeAction.bind(null, node.id)}>
                <input
                  type="hidden"
                  name="archiveReason"
                  value="Archived from node detail"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-rose-200 px-3 text-sm font-semibold text-rose-700"
                  disabled={isArchived}
                >
                  <Archive size={15} aria-hidden />
                  {isArchived ? "Archived" : "Archive"}
                </button>
              </form>
            </div>
          </div>
          <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-stone-700">
            {node.body}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {node.tags.map((item) => (
              <span
                key={item.tagId}
                className="rounded-md bg-[#eef7d0] px-2 py-1 text-sm text-stone-700"
              >
                {item.tag.name}
              </span>
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            <Metric label="Score" value={node.crystallizationScore} />
            <Metric label="Entropy resistance" value={node.entropyResistance} />
            <Metric label="Publicness" value={node.publicness} />
            <Metric label="Private intensity" value={node.privateIntensity} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            <Metric label="Fear" value={node.emotionFear} />
            <Metric label="Curiosity" value={node.emotionCuriosity} />
            <Metric label="Joy" value={node.emotionJoy} />
            <Metric label="Boredom" value={node.emotionBoredom} />
            <Metric label="Ha" value={node.emotionHa} />
          </div>
        </article>

        <aside className="grid gap-6">
          {isArchived ? (
            <section className="rounded-lg border border-stone-200 bg-white p-5 text-sm leading-6 text-stone-600 shadow-sm">
              Archived nodes keep their phase history and backup footprint, but
              are hidden from the active pool, graph, and default node list.
            </section>
          ) : null}
          {!isArchived ? (
            <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Phase Actions</h2>
              <div className="mt-4 grid gap-2">
                {phases
                  .filter((phase) => phase !== node.phase)
                  .map((phase) => (
                    <form
                      key={phase}
                      action={transitionPhaseAction.bind(null, node.id, phase)}
                      className="flex gap-2"
                    >
                      <input
                        type="hidden"
                        name="reason"
                        value={`Manual ${phase} transition`}
                      />
                      <button
                        type="submit"
                        className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-left text-sm font-medium hover:bg-stone-50"
                      >
                        {phase === "seed"
                          ? "Promote to Seed"
                          : phase === "crystal"
                            ? "Crystallize"
                            : phase === "fossil"
                              ? "Fossilize"
                              : phase === "dissolved"
                                ? "Dissolve"
                                : `Move to ${phase}`}
                      </button>
                    </form>
                  ))}
                <form action={haSoftenAction.bind(null, node.id)}>
                  <button
                    type="submit"
                    className="h-10 w-full rounded-md bg-amber-200 px-3 text-left text-sm font-semibold text-amber-950 hover:bg-amber-300"
                  >
                    Ha Soften
                  </button>
                </form>
              </div>
            </section>
          ) : null}

          {!isArchived ? (
            <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <GitBranch size={18} aria-hidden />
                <h2 className="text-lg font-semibold">Create Edge</h2>
              </div>
              <form action={createEdgeAction} className="mt-4 grid gap-3">
                <input type="hidden" name="fromId" value={node.id} />
                <select
                  name="toId"
                  required
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                >
                  <option value="">Connect to...</option>
                  {nodeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
                <EdgeRelationSelect />
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-stone-700">
                    Weight
                  </span>
                  <input
                    name="weight"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    defaultValue="1"
                    className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="h-10 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white"
                >
                  Connect
                </button>
              </form>
            </section>
          ) : null}

          {!isArchived ? (
            <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Meaning Market</h2>
              <div className="mt-4 grid gap-2 text-sm">
                <MarketStat label="Signal" value={nodeMarket.depth.signalPrice} />
                <MarketStat label="Support" value={nodeMarket.depth.supportPressure} />
                <MarketStat label="Challenge" value={nodeMarket.depth.challengePressure} />
                <MarketStat label="Funding" value={nodeMarket.depth.fundingIntent} />
              </div>

              <form
                action={createContributionEventAction.bind(null, node.id)}
                className="mt-5 grid gap-3 border-t border-stone-200 pt-4"
              >
                <input
                  name="actorAlias"
                  required
                  defaultValue="local-operator"
                  aria-label="Contribution actor alias"
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                />
                <select
                  name="kind"
                  aria-label="Contribution kind"
                  defaultValue="support"
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                >
                  {contributionKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
                <input
                  name="weight"
                  aria-label="Contribution weight"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  defaultValue="1"
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                />
                <textarea
                  name="body"
                  required
                  rows={3}
                  aria-label="Contribution body"
                  placeholder="Record support, challenge, review, verification, funding intent..."
                  className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="h-10 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white"
                >
                  Record Contribution
                </button>
              </form>

              <form
                action={createMarketOrderAction.bind(null, node.id)}
                className="mt-5 grid gap-3 border-t border-stone-200 pt-4"
              >
                <input
                  name="actorAlias"
                  required
                  defaultValue="local-operator"
                  aria-label="Order actor alias"
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                />
                <select
                  name="side"
                  aria-label="Market order side"
                  defaultValue="bid"
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                >
                  {marketOrderSides.map((side) => (
                    <option key={side} value={side}>
                      {side}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="price"
                    aria-label="Market order price"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    defaultValue={Math.max(
                      1,
                      Math.round(nodeMarket.depth.signalPrice),
                    )}
                    className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                  />
                  <input
                    name="quantity"
                    aria-label="Market order quantity"
                    type="number"
                    min="0.01"
                    max="10000"
                    step="0.01"
                    defaultValue="1"
                    className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                  />
                </div>
                <input
                  name="note"
                  aria-label="Market order note"
                  placeholder="Simulated intent note"
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                />
                <button
                  type="submit"
                  className="h-10 rounded-md border border-stone-300 px-3 text-sm font-semibold"
                >
                  Place Simulated Order
                </button>
              </form>

              <div className="mt-5 grid gap-3">
                <h3 className="text-sm font-semibold text-stone-700">
                  Recent contributions
                </h3>
                {nodeMarket.contributions.slice(0, 4).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-md bg-stone-50 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{event.kind}</span>
                      <span className="text-xs text-stone-500">
                        w{event.weight}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-stone-600">
                      {event.actorAlias}: {event.body}
                    </p>
                    <p className="mt-1 break-all text-xs text-stone-400">
                      {event.eventHash.slice(0, 18)}...
                    </p>
                  </div>
                ))}
                {nodeMarket.contributions.length === 0 ? (
                  <p className="text-sm text-stone-500">
                    No contribution events yet.
                  </p>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3">
                <h3 className="text-sm font-semibold text-stone-700">
                  Recent simulated orders
                </h3>
                {nodeMarket.orders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="rounded-md bg-stone-50 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{order.side}</span>
                      <span className="text-xs text-stone-500">
                        {order.quantity} @ {order.price}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-stone-600">
                      {order.actorAlias}
                      {order.note ? `: ${order.note}` : ""}
                    </p>
                  </div>
                ))}
                {nodeMarket.orders.length === 0 ? (
                  <p className="text-sm text-stone-500">
                    No simulated orders yet.
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {!isArchived ? (
            <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Merge / Split</h2>
              <form
                action={mergeNodeAction.bind(null, node.id)}
                className="mt-4 grid gap-3 border-b border-stone-200 pb-4"
              >
                <select
                  name="sourceId"
                  required
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                >
                  <option value="">Merge another node into this...</option>
                  {nodeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
                <input
                  name="mergeReason"
                  placeholder="Merge reason"
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                />
                <button
                  type="submit"
                  className="h-10 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white"
                >
                  Merge Into This
                </button>
              </form>
              <form
                action={splitNodeAction.bind(null, node.id)}
                className="mt-4 grid gap-3"
              >
                <input
                  name="title"
                  required
                  placeholder="New split node title"
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                />
                <textarea
                  name="body"
                  required
                  rows={4}
                  placeholder="Extracted concept body"
                  className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <select
                  name="phase"
                  defaultValue="gas"
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                >
                  {phases.map((phase) => (
                    <option key={phase} value={phase}>
                      {phase}
                    </option>
                  ))}
                </select>
                <input
                  name="tags"
                  placeholder="tags for split node"
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
                />
                <button
                  type="submit"
                  className="h-10 rounded-md border border-stone-300 px-3 text-sm font-semibold"
                >
                  Split New Node
                </button>
              </form>
            </section>
          ) : null}
        </aside>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <ScoreNowPanel explanation={scoreNowExplanation} />
        <PhaseSuggestionPanel suggestions={phaseSuggestions} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <ScoreBreakdownPanel
          total={scoreBreakdown.total}
          explanations={scoreExplanations}
          drivers={scoreDrivers}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Connected Edges</h2>
          <div className="mt-4 grid gap-3">
            {connectedEdges.length === 0 ? (
              <p className="text-sm text-stone-500">No edges yet.</p>
            ) : (
              connectedEdges.map((edge) => (
                <div
                  key={edge.id}
                  className="flex flex-col gap-3 rounded-md border border-stone-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {edge.direction === "out" ? "to" : "from"}{" "}
                      <Link
                        href={`/nodes/${edge.nodeId}`}
                        className="hover:underline"
                      >
                        {edge.label}
                      </Link>
                    </p>
                  </div>
                  {isArchived ? (
                    <p className="text-sm text-stone-500">
                      {edge.relation} · weight {edge.weight}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2 sm:items-end">
                      <form
                        action={updateEdgeAction.bind(null, edge.id, node.id)}
                        className="flex flex-wrap gap-2"
                      >
                        <EdgeRelationSelect defaultValue={edge.relation} />
                        <input
                          name="weight"
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          defaultValue={edge.weight}
                          className="h-10 w-24 rounded-md border border-stone-300 bg-white px-2 text-sm"
                        />
                        <button
                          type="submit"
                          className="h-10 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white"
                        >
                          Update
                        </button>
                      </form>
                      <form
                        action={deleteEdgeAction.bind(null, edge.id, node.id)}
                      >
                        <button
                          type="submit"
                          className="h-9 rounded-md border border-stone-300 px-3 text-sm"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Phase History</h2>
          <div className="mt-4 grid gap-3">
            {node.phaseEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-md border border-stone-200 p-3 text-sm"
              >
                <p className="font-medium">
                  {event.fromPhase ?? "origin"} → {event.toPhase}
                </p>
                <p className="mt-1 text-stone-600">{event.reason}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {event.createdAt.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <MeaningTimelinePanel events={meaningTimeline} />
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-stone-50 p-3">
      <p className="text-xs font-medium uppercase tracking-normal text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold">{Math.round(value)}</p>
    </div>
  );
}

function MarketStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-stone-50 p-3">
      <span className="text-stone-600">{label}</span>
      <span className="font-semibold">{Math.round(value * 10) / 10}</span>
    </div>
  );
}
