import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { NodeCard } from "@/components/NodeCard";
import { phases } from "@/lib/domain";
import {
  getAllNodes,
  getAllTags,
  parseNodeQueryFilters,
} from "@/server/queries";

export default async function NodesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const filters = parseNodeQueryFilters(await searchParams);
  const [nodes, tags] = await Promise.all([getAllNodes(filters), getAllTags()]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Crystal Nodes</h1>
          <p className="mt-2 max-w-2xl text-stone-600">
            Every fragment has a phase, score, emotion vector, tags, and
            relations.
          </p>
        </div>
        <p className="rounded-md bg-white px-3 py-2 text-sm text-stone-600 shadow-sm">
          {nodes.length} result{nodes.length === 1 ? "" : "s"}
        </p>
      </div>
      <form
        method="GET"
        className="mb-6 grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6"
      >
        <label className="grid gap-2 xl:col-span-2">
          <span className="text-sm font-medium text-stone-700">Search</span>
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="title, body, source ref"
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">Phase</span>
          <select
            name="phase"
            defaultValue={filters.phase ?? ""}
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
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
          <span className="text-sm font-medium text-stone-700">Tag</span>
          <select
            name="tag"
            defaultValue={filters.tag ?? ""}
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">Status</span>
          <select
            name="status"
            defaultValue={filters.status ?? "active"}
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
          >
            <option value="active">active</option>
            <option value="archived">archived</option>
            <option value="all">all</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">Sort</span>
            <select
              name="sort"
              defaultValue={filters.sort ?? "score"}
              className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
            >
              <option value="score">score</option>
              <option value="updatedAt">updated</option>
              <option value="createdAt">created</option>
              <option value="title">title</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">Dir</span>
            <select
              name="dir"
              defaultValue={filters.dir ?? "desc"}
              className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
            >
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </label>
        </div>
        <div className="flex items-end gap-2 xl:col-span-6">
          <button
            type="submit"
            className="h-10 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white"
          >
            Apply
          </button>
          <Link
            href="/nodes"
            className="inline-flex h-10 items-center rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-700"
          >
            Reset
          </Link>
        </div>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {nodes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500 md:col-span-2 xl:col-span-3">
            No nodes match these filters.
          </div>
        ) : (
          nodes.map((node) => <NodeCard key={node.id} node={node} />)
        )}
      </div>
    </AppShell>
  );
}
