import Link from "next/link";
import {
  Bot,
  BrainCircuit,
  CircleAlert,
  Eye,
  GitBranch,
  Lock,
  Send,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PhaseBadge } from "@/components/PhaseBadge";
import {
  runAIDirectorCycleAction,
  submitHumanSuggestionAction,
} from "@/server/aiActions";
import { getAIPoolDashboard } from "@/server/aiDirector";

export const dynamic = "force-dynamic";

export default async function AIPoolPage() {
  const dashboard = await getAIPoolDashboard();
  const latestCycle = dashboard.cycles[0];

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-stone-500">
            AI-Directed Pool
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Humans observe. The director mutates.
          </h1>
          <p className="mt-2 max-w-3xl text-stone-600">
            This pool is hard-isolated from normal editing. Human input enters as
            suggestions; validated AI decisions are the only mutation path.
          </p>
        </div>
        <form action={runAIDirectorCycleAction}>
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white shadow-sm hover:bg-stone-800">
            <BrainCircuit size={16} aria-hidden />
            Run Director Cycle
          </button>
        </form>
      </div>

      <section className="grid gap-4 lg:grid-cols-5">
        <Metric label="Model" value={dashboard.config.model} detail="Responses API" />
        <Metric
          label="API key"
          value={dashboard.config.hasApiKey ? "configured" : "missing"}
          detail={dashboard.config.hasApiKey ? "live calls enabled" : "cycles are skipped"}
        />
        <Metric label="AI nodes" value={dashboard.nodes.length} detail="owned by director" />
        <Metric
          label="Suggestions"
          value={dashboard.suggestions.length}
          detail={`${dashboard.review.suggestionStatusCounts.open} open`}
        />
        <Metric label="Decisions" value={dashboard.decisions.length} detail="validated audit log" />
      </section>

      {!dashboard.config.hasApiKey ? (
        <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <div className="flex items-start gap-3">
            <CircleAlert size={18} aria-hidden className="mt-0.5 shrink-0" />
            <p>
              `OPENAI_API_KEY` is not configured. The page is fully wired, but
              director cycles will record a skipped state until the key is added.
            </p>
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">AI Pool State</h2>
            <Link
              href="/flow?pool=ai"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700"
            >
              <Eye size={15} aria-hidden />
              Flow
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {dashboard.nodes.length === 0 ? (
              <p className="rounded-md border border-dashed border-stone-300 p-5 text-sm text-stone-500">
                No AI-owned nodes yet. Add a suggestion and run a director cycle.
              </p>
            ) : (
              dashboard.nodes.map((node) => (
                <article
                  key={node.id}
                  className="rounded-md border border-stone-200 bg-stone-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <PhaseBadge phase={node.phase} />
                        <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-stone-600">
                          score {Math.round(node.crystallizationScore)}
                        </span>
                      </div>
                      <h3 className="mt-3 font-semibold text-stone-950">
                        {node.title}
                      </h3>
                      <p className="mt-1 line-clamp-3 text-sm leading-6 text-stone-600">
                        {node.body}
                      </p>
                    </div>
                    <span className="inline-flex h-8 items-center gap-1 rounded-md bg-stone-950 px-2 text-xs font-semibold text-white">
                      <Bot size={13} aria-hidden />
                      AI-owned
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Human Suggestion</h2>
          <p className="mt-1 text-sm text-stone-600">
            Suggestions are visible to the director. They do not mutate nodes,
            edges, or phases.
          </p>
          <form action={submitHumanSuggestionAction} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Actor alias
              <input
                name="actorAlias"
                required
                defaultValue="observer"
                className="h-10 rounded-md border border-stone-300 px-3"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Suggestion title
              <input
                name="title"
                required
                className="h-10 rounded-md border border-stone-300 px-3"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Suggestion body
              <textarea
                name="body"
                required
                rows={5}
                className="rounded-md border border-stone-300 px-3 py-2"
              />
            </label>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white">
              <Send size={16} aria-hidden />
              Submit Suggestion
            </button>
          </form>
        </aside>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">AI Run Review</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <ReviewPill label="completed" value={dashboard.review.cycleStatusCounts.completed} />
            <ReviewPill label="skipped" value={dashboard.review.cycleStatusCounts.skipped} />
            <ReviewPill label="failed" value={dashboard.review.cycleStatusCounts.failed} />
            <ReviewPill label="pending" value={dashboard.review.cycleStatusCounts.pending} />
          </div>
          <div className="mt-4 grid gap-3">
            {dashboard.review.invalidDecisions.length === 0 ? (
              <p className="rounded-md border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                No invalid AI decisions recorded.
              </p>
            ) : (
              dashboard.review.invalidDecisions.map((decision) => (
                <article
                  key={decision.id}
                  className="rounded-md bg-rose-50 p-3 text-sm text-rose-950"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{decision.kind}</span>
                    <span className="text-xs">{formatDate(decision.createdAt)}</span>
                  </div>
                  <p className="mt-1 leading-6">{decision.reason}</p>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Suggestion Status</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <StatusRow label="Open" value={dashboard.review.suggestionStatusCounts.open} />
            <StatusRow label="Reviewed" value={dashboard.review.suggestionStatusCounts.reviewed} />
            <StatusRow label="Accepted" value={dashboard.review.suggestionStatusCounts.accepted} />
            <StatusRow label="Rejected" value={dashboard.review.suggestionStatusCounts.rejected} />
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            Suggestions remain human input. The director may consume them, but
            mutation still requires validated AI decisions and audit rows.
          </p>
        </aside>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Decision Audit</h2>
          <div className="mt-4 grid gap-3">
            {dashboard.decisions.length === 0 ? (
              <p className="text-sm text-stone-500">No AI decisions recorded.</p>
            ) : (
              dashboard.decisions.map((decision) => (
                <article
                  key={decision.id}
                  className="rounded-md bg-stone-50 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{decision.kind}</span>
                    <span className="rounded-md bg-white px-2 py-1 text-xs text-stone-600">
                      {decision.status}
                    </span>
                  </div>
                  <p className="mt-1 leading-6 text-stone-600">
                    {decision.rationale}
                  </p>
                  {decision.error ? (
                    <p className="mt-1 text-xs text-rose-700">{decision.error}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Lock size={18} aria-hidden />
            <h2 className="text-xl font-semibold">Permission Wall</h2>
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <Permission label="Observe AI nodes" allowed />
            <Permission label="Submit suggestions" allowed />
            <Permission label="Create nodes directly" />
            <Permission label="Create edges directly" />
            <Permission label="Change phase directly" />
          </div>
          <div className="mt-5">
            <h3 className="font-semibold">Latest Cycle</h3>
            {latestCycle ? (
              <div className="mt-2 rounded-md bg-stone-50 p-3 text-sm">
                <p className="font-medium">{latestCycle.status}</p>
                <p className="mt-1 text-stone-600">
                  {latestCycle.decisions.length} decisions · {latestCycle.model}
                </p>
                {latestCycle.error ? (
                  <p className="mt-1 text-amber-700">{latestCycle.error}</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-stone-500">No cycle yet.</p>
            )}
          </div>
        </aside>
      </section>

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">AI Graph Relations</h2>
        <div className="mt-4 grid gap-2">
          {dashboard.edges.length === 0 ? (
            <p className="text-sm text-stone-500">No AI-created edges yet.</p>
          ) : (
            dashboard.edges.map((edge) => (
              <div
                key={edge.id}
                className="grid gap-2 rounded-md bg-stone-50 p-3 text-sm md:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)_80px]"
              >
                <span>{edge.from.title}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-stone-700">
                  <GitBranch size={14} aria-hidden />
                  {edge.relation}
                </span>
                <span>{edge.to.title}</span>
                <span className="text-right font-mono">w{edge.weight}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </AppShell>
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
      <p className="mt-1 truncate text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{detail}</p>
    </div>
  );
}

function Permission({ label, allowed = false }: { label: string; allowed?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-stone-50 p-3">
      <span>{label}</span>
      <span
        className={`rounded-md px-2 py-1 text-xs font-semibold ${
          allowed ? "bg-lime-100 text-lime-950" : "bg-rose-100 text-rose-950"
        }`}
      >
        {allowed ? "allowed" : "blocked"}
      </span>
    </div>
  );
}

function ReviewPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-stone-50 p-3 text-center text-sm">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-stone-500">{label}</p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-stone-50 p-3">
      <span>{label}</span>
      <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-stone-700">
        {value}
      </span>
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
  }).format(date);
}
