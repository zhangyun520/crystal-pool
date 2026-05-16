import { AppShell } from "@/components/AppShell";
import { MeaningFlowBoard } from "@/components/MeaningFlowBoard";
import {
  defaultPoolIdForSlug,
  defaultPoolSpaces,
  normalizePoolSlug,
} from "@/lib/pools";
import { getMeaningFlowSnapshot } from "@/server/meaningFlow";

export const dynamic = "force-dynamic";

export default async function FlowPage({
  searchParams,
}: {
  searchParams: Promise<{ pool?: string | string[] }>;
}) {
  const params = await searchParams;
  const poolParam = Array.isArray(params.pool) ? params.pool[0] : params.pool;
  const poolSlug = normalizePoolSlug(poolParam);
  const snapshot = await getMeaningFlowSnapshot({
    poolId: defaultPoolIdForSlug(poolSlug),
  });

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-stone-500">
            Meaning Flow
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Crystallization Tape</h1>
          <p className="mt-2 max-w-3xl text-stone-600">
            A local order-flow view of phase changes, edges, corpus runs, node
            updates, pressure, and depth inside the {poolSlug} pool.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2" aria-label="Pool flow selector">
          {defaultPoolSpaces.map((pool) => {
            const slug = pool.slug === "canonical" ? "canonical" : pool.slug;
            const active = normalizePoolSlug(slug) === poolSlug;
            return (
              <a
                key={pool.id}
                href={`/flow?pool=${slug}`}
                className={`inline-flex h-10 items-center rounded-md border px-3 text-sm font-semibold shadow-sm ${
                  active
                    ? "border-stone-950 bg-stone-950 text-white"
                    : "border-stone-300 bg-white text-stone-700"
                }`}
              >
                {pool.name}
              </a>
            );
          })}
        </nav>
      </div>
      <MeaningFlowBoard initialSnapshot={snapshot} poolSlug={poolSlug} />
    </AppShell>
  );
}
