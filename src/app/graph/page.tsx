import Link from "next/link";
import { Filter, GitBranch, RotateCcw, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GraphView } from "@/components/GraphView";
import { edgeRelations, phases } from "@/lib/domain";
import {
  getAllTags,
  getGraphData,
  parseGraphQueryFilters,
} from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const filters = parseGraphQueryFilters(await searchParams);
  const [{ nodes, edges }, tags] = await Promise.all([
    getGraphData(filters),
    getAllTags(),
  ]);
  const selectedId = nodes.some((node) => node.id === filters.selected)
    ? filters.selected
    : nodes[0]?.id;
  const graphNodes = nodes.map((node) => ({
    id: node.id,
    title: node.title,
    body: node.body,
    phase: node.phase,
    crystallizationScore: node.crystallizationScore,
    emotionHa: node.emotionHa,
    tags: node.tags.map((entry) => entry.tag.name),
  }));
  const graphEdges = edges.map((edge) => ({
    id: edge.id,
    fromId: edge.fromId,
    toId: edge.toId,
    relation: edge.relation,
    weight: edge.weight,
    from: { title: edge.from.title },
    to: { title: edge.to.title },
  }));
  const activePhases = new Set(nodes.map((node) => node.phase)).size;
  const avgScore = nodes.length
    ? Math.round(
        nodes.reduce((sum, node) => sum + node.crystallizationScore, 0) /
          nodes.length,
      )
    : 0;
  const relationWeight = edges.reduce((sum, edge) => sum + edge.weight, 0);

  return (
    <AppShell>
      <section className="mb-6 overflow-hidden rounded-lg border border-stone-200 bg-stone-950 text-white shadow-2xl shadow-stone-950/10">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-lime-100">
              <Sparkles size={15} aria-hidden />
              Crystal relation field
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal">
              Meaning patterns as a living crystal map.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">
              Node mass follows crystallization score, orbit follows phase, and
              relation energy shows where meaning is hardening, softening, or
              contradicting itself.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <HeroMetric label="nodes" value={nodes.length} />
            <HeroMetric label="edges" value={edges.length} />
            <HeroMetric label="phases" value={activePhases} />
            <HeroMetric label="avg score" value={avgScore} />
          </div>
        </div>
        <div className="border-t border-white/10 bg-white/[0.03] px-6 py-3 text-xs text-stone-400 lg:px-7">
          total relation weight {relationWeight.toFixed(1)} · filters show active
          canonical nodes only
        </div>
      </section>
      <form
        method="GET"
        className="mb-6 grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">Phase orbit</span>
          <select
            name="phase"
            defaultValue={filters.phase ?? ""}
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-200"
          >
            <option value="">All phases</option>
            {phases.map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">Relation energy</span>
          <select
            name="relation"
            defaultValue={filters.relation ?? ""}
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-200"
          >
            <option value="">All relations</option>
            {edgeRelations.map((relation) => (
              <option key={relation} value={relation}>
                {relation}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">Tag</span>
          <select
            name="tag"
            defaultValue={filters.tag ?? ""}
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-200"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
        <input type="hidden" name="selected" value={selectedId ?? ""} />
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            <Filter size={15} aria-hidden />
            Apply
          </button>
          <Link
            href="/graph"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            <RotateCcw size={15} aria-hidden />
            Reset
          </Link>
        </div>
      </form>
      <GraphView
        nodes={graphNodes}
        edges={graphEdges}
        initialSelectedId={selectedId}
      />
    </AppShell>
  );
}

function HeroMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <GitBranch size={16} aria-hidden className="text-lime-200" />
        <p className="font-mono text-2xl font-semibold">{value}</p>
      </div>
      <p className="mt-2 text-xs uppercase tracking-normal text-stone-400">{label}</p>
    </div>
  );
}
