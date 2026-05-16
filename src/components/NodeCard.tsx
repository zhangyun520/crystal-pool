import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { type Phase } from "@/lib/domain";
import { PhaseBadge } from "./PhaseBadge";

type NodeCardNode = {
  id: string;
  title: string;
  body: string;
  phase: Phase;
  crystallizationScore: number;
  emotionHa: number;
  archivedAt?: Date | string | null;
  updatedAt: Date | string;
  tags?: { tag: { name: string } }[];
};

export function NodeCard({ node }: { node: NodeCardNode }) {
  const tags = node.tags?.map((item) => item.tag.name) ?? [];

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <PhaseBadge phase={node.phase} />
        <div className="flex flex-wrap justify-end gap-2">
          {node.archivedAt ? (
            <span className="rounded-md bg-stone-200 px-2 py-1 text-xs font-semibold text-stone-700">
              archived
            </span>
          ) : null}
          <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
            score {Math.round(node.crystallizationScore)}
          </span>
        </div>
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug text-stone-950">
        <Link href={`/nodes/${node.id}`} className="hover:underline">
          {node.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">
        {node.body}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-[#eef7d0] px-2 py-1 text-xs text-stone-700"
          >
            {tag}
          </span>
        ))}
        {node.emotionHa >= 6 ? (
          <span className="rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-900">
            ha {node.emotionHa}
          </span>
        ) : null}
      </div>
      <Link
        href={`/nodes/${node.id}`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-stone-900"
      >
        Open
        <ArrowUpRight size={14} aria-hidden />
      </Link>
    </article>
  );
}
