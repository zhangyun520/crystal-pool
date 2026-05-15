import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HakimiPanel } from "@/components/HakimiPanel";
import { NodeCard } from "@/components/NodeCard";
import { PhaseBadge } from "@/components/PhaseBadge";
import { getHakimiSuggestions } from "@/lib/hakimi";
import { phases, type CrystalEdgeCore, type CrystalNodeCore } from "@/lib/domain";
import { getAllEdges, getAllNodes, getPhaseCounts } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [nodes, edges, counts] = await Promise.all([
    getAllNodes(),
    getAllEdges(),
    getPhaseCounts(),
  ]);

  const strongest = nodes
    .filter((node) => node.phase === "crystal")
    .slice(0, 4);
  const newSeeds = nodes
    .filter((node) => node.phase === "seed")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 4);
  const dissolving = nodes
    .filter(
      (node) =>
        node.phase === "fossil" ||
        node.phase === "dissolved" ||
        node.crystallizationScore < 18,
    )
    .slice(0, 4);
  const haFeed = nodes
    .filter(
      (node) =>
        node.emotionHa >= 6 ||
        node.outgoingEdges.some((edge) => edge.relation === "ha_softens") ||
        node.incomingEdges.some((edge) => edge.relation === "ha_softens"),
    )
    .slice(0, 4);
  const countMap = new Map(counts.map((item) => [item.phase, item._count.phase]));
  const hakimiSuggestions = getHakimiSuggestions(
    nodes as unknown as CrystalNodeCore[],
    edges as unknown as CrystalEdgeCore[],
  );

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-stone-500">
                Pool Surface
              </p>
              <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-stone-950 sm:text-4xl">
                Fragments enter as fluctuations, resonate through edges, and
                cross phase thresholds.
              </h1>
            </div>
            <Link
              href="/nodes/new"
              className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800"
            >
              <Plus size={16} aria-hidden />
              Add Fragment
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-[#eef7d0] p-4">
              <p className="text-sm text-stone-600">Nodes</p>
              <p className="mt-1 text-3xl font-semibold">{nodes.length}</p>
            </div>
            <div className="rounded-md bg-cyan-50 p-4">
              <p className="text-sm text-stone-600">Edges</p>
              <p className="mt-1 text-3xl font-semibold">{edges.length}</p>
            </div>
            <div className="rounded-md bg-rose-50 p-4">
              <p className="text-sm text-stone-600">Average score</p>
              <p className="mt-1 text-3xl font-semibold">
                {nodes.length
                  ? Math.round(
                      nodes.reduce(
                        (sum, node) => sum + node.crystallizationScore,
                        0,
                      ) / nodes.length,
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Phase Map</h2>
          <div className="mt-4 grid gap-3">
            {phases.map((phase) => (
              <div
                key={phase}
                className="flex items-center justify-between rounded-md bg-stone-50 p-3"
              >
                <PhaseBadge phase={phase} />
                <span className="text-lg font-semibold">
                  {countMap.get(phase) ?? 0}
                </span>
              </div>
            ))}
          </div>
        </section>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6">
          <PoolSection title="Strongest Crystals" nodes={strongest} />
          <PoolSection title="New Seeds" nodes={newSeeds} />
          <PoolSection title="Dissolving / Fossilizing" nodes={dissolving} />
          <PoolSection title="Ha Feed" nodes={haFeed} />
        </div>
        <HakimiPanel suggestions={hakimiSuggestions} />
      </div>
    </AppShell>
  );
}

function PoolSection({
  title,
  nodes,
}: {
  title: string;
  nodes: Awaited<ReturnType<typeof getAllNodes>>;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link href="/nodes" className="text-sm font-medium text-stone-600">
          View all
        </Link>
      </div>
      {nodes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
          Nothing has surfaced here yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {nodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>
      )}
    </section>
  );
}
