import {
  Activity,
  GitPullRequestArrow,
  Inbox,
  ListChecks,
  Network,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { assessJiEventSoulfulData } from "@/lib/ethicalKernel";
import {
  jiEventKinds,
  jiBodyField,
  jiKindLabels,
  jiReviewStatuses,
  jiSourceLabels,
  jiSourceProjects,
  type JiReviewStatus,
  type JiSourceProject,
} from "@/lib/ji";
import { sandboxModeDetails, sandboxModes } from "@/lib/sandbox";
import {
  createSandboxFromJiEventAction,
  dismissJiEventAction,
  draftRfcFromJiEventAction,
  importJiEventAsNodeAction,
  importJiInboxAction,
} from "@/server/jiActions";
import {
  describeJiEvent,
  getEcosystemDashboard,
  type EcosystemJiEvent,
} from "@/server/ji";
import {
  getLatestEcosystemRunSummary,
  getResponsibilityMaturitySnapshot,
} from "@/server/ecosystemDaemon";

export const dynamic = "force-dynamic";

export default async function EcosystemPage() {
  const [dashboard, latestDaemonRun, maturity] = await Promise.all([
    getEcosystemDashboard(),
    getLatestEcosystemRunSummary(),
    getResponsibilityMaturitySnapshot(),
  ]);

  return (
    <AppShell>
      <div className="grid gap-8">
        <section className="flex flex-col gap-4 border-b border-stone-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lime-700">
              Jellyfish / 水母生态
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-stone-950">
              JiEvent Review Queue
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Cross-project trigger points enter the mother pool here. Adapters
              can write inbox events, but only this queue may promote them into
              canonical nodes, local proof-chain contributions, sandbox runs, or
              RFC drafts.
            </p>
          </div>
          <form action={importJiInboxAction}>
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800">
              <Inbox size={16} aria-hidden />
              Import Inbox
            </button>
          </form>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Pending Ji"
            value={dashboard.totals.pending}
            detail="awaiting review"
          />
          <MetricCard
            label="Imported"
            value={dashboard.totals.imported}
            detail="node + contribution"
          />
          <MetricCard
            label="Sandboxed"
            value={dashboard.totals.sandboxed}
            detail="Fugue/Sonata/Symphony"
          />
          <MetricCard
            label="RFC Drafts"
            value={dashboard.totals.rfcDrafted}
            detail="local drafts only"
          />
          <MetricCard
            label="Inbox Lines"
            value={dashboard.inbox.lines}
            detail={`${dashboard.inbox.files} files, ${dashboard.inbox.errors} errors`}
          />
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <MetricCard
            label="Daemon"
            value={latestDaemonRun ? "ready" : "idle"}
            detail={latestDaemonRun?.runId ?? "run npm run ecosystem:once"}
          />
          <MetricCard
            label="Proposals"
            value={latestDaemonRun?.proposals.length ?? 0}
            detail="observe + propose only"
          />
          <MetricCard
            label="AI Mainline"
            value={maturity.status}
            detail={`${maturity.totalScore}/100, auto-unlock disabled`}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity size={18} aria-hidden className="text-lime-700" />
              <h2 className="text-lg font-semibold tracking-normal text-stone-950">
                Autonomy Cycle
              </h2>
            </div>
            {latestDaemonRun ? (
              <div className="mt-4 grid gap-3">
                <p className="text-sm text-stone-600">
                  Latest local run <code>{latestDaemonRun.runId}</code> wrote
                  observations, proposals, manifest, and report artifacts. It
                  did not mutate canonical pool state.
                </p>
                <div className="grid gap-2 text-sm md:grid-cols-3">
                  <HealthRow
                    label="observations"
                    value={latestDaemonRun.observations.length}
                  />
                  <HealthRow label="proposals" value={latestDaemonRun.proposals.length} />
                  <HealthRow
                    label="canonical mutation"
                    value={latestDaemonRun.manifest?.canonicalMutationAllowed ? "yes" : "no"}
                  />
                </div>
                <div className="grid gap-2">
                  {latestDaemonRun.proposals.slice(0, 4).map((proposal) => (
                    <div
                      key={proposal.id}
                      className="rounded-md border border-lime-100 bg-lime-50 p-3 text-sm text-lime-950"
                    >
                      <p className="font-semibold">{proposal.title}</p>
                      <p className="mt-1 leading-6">{proposal.body}</p>
                      {proposal.command ? (
                        <code className="mt-2 block rounded bg-white px-2 py-1 text-xs text-stone-700">
                          {proposal.command}
                        </code>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-stone-500">
                No autonomy cycle artifacts yet. Run{" "}
                <code>npm run ecosystem:once</code> to generate local
                observations and proposals.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} aria-hidden className="text-stone-600" />
              <h2 className="text-lg font-semibold tracking-normal text-stone-950">
                AI Mainline Gate
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Maturity can generate an AI_MAINLINE_PROPOSAL for review, but it
              cannot unlock AI sovereignty or mutate permissions.
            </p>
            <div className="mt-4 grid gap-2">
              {maturity.dimensions.map((dimension) => (
                <HealthRow
                  key={dimension.key}
                  label={dimension.label}
                  value={`${dimension.score}/100`}
                />
              ))}
            </div>
            <div className="mt-4 rounded-md border border-lime-100 bg-lime-50 p-3">
              <h3 className="text-sm font-semibold text-lime-950">
                Soulful Data Review Signal
              </h3>
              <p className="mt-2 text-sm leading-6 text-lime-900">
                Pending JiEvents are assessed for provenance, lived context,
                consent boundary, traceability, repairability, non-extractive
                use, and human responsibility. The signal informs review only;
                it cannot promote canonical truth.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Network size={18} aria-hidden className="text-lime-700" />
              <h2 className="text-lg font-semibold tracking-normal text-stone-950">
                Project Organs
              </h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {jiSourceProjects.map((source) => (
                <SourceRow
                  key={source}
                  source={source}
                  count={dashboard.bySource[source]}
                />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <GitPullRequestArrow size={18} aria-hidden className="text-stone-600" />
              <h2 className="text-lg font-semibold tracking-normal text-stone-950">
                Review State
              </h2>
            </div>
            <div className="mt-4 grid gap-2">
              {jiReviewStatuses.map((status) => (
                <HealthRow
                  key={status}
                  label={status.replace("_", " ")}
                  value={dashboard.byStatus[status]}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ListChecks size={18} aria-hidden className="text-fuchsia-700" />
                <h2 className="text-xl font-semibold tracking-normal text-stone-950">
                  Typed Proposal Lanes
                </h2>
              </div>
              <p className="mt-1 text-sm text-stone-500">
                Network, coding, and philosophy signals are sorted into
                reviewable artifact paths. They still cannot promote canonical
                pool state automatically.
              </p>
            </div>
            <Link
              href="/observe"
              className="hidden h-10 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 sm:inline-flex"
            >
              Observe
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.proposalLanes.map((lane) => (
              <ProposalLaneCard key={lane.kind} lane={lane} />
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-stone-950">
                Pending Trigger Points
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                External tools can suggest life; reviewers decide what becomes
                pool structure.
              </p>
            </div>
            <Link
              href="/flow"
              className="hidden h-10 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 sm:inline-flex"
            >
              <Sparkles size={16} aria-hidden />
              Flow Lane
            </Link>
          </div>
          {dashboard.pending.length > 0 ? (
            <div className="grid gap-4">
              {dashboard.pending.map((event) => (
                <PendingEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-500">
              No pending JiEvents. Use <code>npm run ji:event</code> or project
              adapters to write JSONL into <code>data/ecosystem/inbox</code>.
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold tracking-normal text-stone-950">
              Recent Review Trail
            </h2>
            <div className="mt-4 grid gap-3">
              {dashboard.recent.length > 0 ? (
                dashboard.recent.map((event) => (
                  <RecentEventRow key={event.id} event={event} />
                ))
              ) : (
                <p className="text-sm text-stone-500">No JiEvents imported yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold tracking-normal text-stone-950">
              Inbox Diagnostics
            </h2>
            <div className="mt-4 grid gap-2">
              {dashboard.inbox.diagnostics.length > 0 ? (
                dashboard.inbox.diagnostics.map((diagnostic, index) => (
                  <div
                    key={`${diagnostic.file ?? "inbox"}:${diagnostic.line ?? index}`}
                    className="rounded-md border border-red-100 bg-red-50 p-3 text-xs text-red-900"
                  >
                    <span className="font-semibold">{diagnostic.code}</span>{" "}
                    {diagnostic.file}:{diagnostic.line ?? "-"} ·{" "}
                    {diagnostic.message}
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-500">
                  Inbox JSONL is parseable. External refs remain observations
                  until review.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-normal text-stone-950">
            Event Kind Mix
          </h2>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {jiEventKinds.map((kind) => (
              <HealthRow
                key={kind}
                label={jiKindLabels[kind].label}
                value={dashboard.byKind[kind]}
              />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function MetricCard({
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
      <p className="text-xs font-medium uppercase tracking-normal text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-normal text-stone-950">
        {value}
      </p>
      <p className="mt-1 text-sm text-stone-500">{detail}</p>
    </div>
  );
}

function SourceRow({
  source,
  count,
}: {
  source: JiSourceProject;
  count: number;
}) {
  const detail = jiSourceLabels[source];
  return (
    <div className="rounded-md border border-stone-100 bg-stone-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-950">{detail.label}</p>
          <p className="text-xs text-stone-500">{detail.role}</p>
        </div>
        <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-stone-700">
          {count}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-stone-500">{detail.boundary}</p>
    </div>
  );
}

function ProposalLaneCard({
  lane,
}: {
  lane: Awaited<ReturnType<typeof getEcosystemDashboard>>["proposalLanes"][number];
}) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-950">
            {lane.label} / {lane.nativeLabel}
          </p>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            {lane.description}
          </p>
        </div>
        <span className="rounded bg-fuchsia-100 px-2 py-1 text-xs font-semibold text-fuchsia-900">
          {lane.count}
        </span>
      </div>
      <p className="mt-3 rounded-md bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-600">
        {lane.reviewPath}
      </p>
      <div className="mt-3 grid gap-2">
        {lane.events.length > 0 ? (
          lane.events.map((event) => (
            <div key={event.id} className="border-l-2 border-fuchsia-200 pl-3">
              <p className="line-clamp-2 text-xs font-medium leading-5 text-stone-800">
                {event.title}
              </p>
              <p className="mt-0.5 text-[11px] text-stone-500">
                {jiBodyField(event.body, "Domain") ?? event.sourceProject} ·{" "}
                {jiBodyField(event.body, "Candidate kind") ?? event.kind}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xs text-stone-400">
            No pending signals in this lane.
          </p>
        )}
      </div>
    </article>
  );
}

function PendingEventCard({ event }: { event: EcosystemJiEvent }) {
  const detail = describeJiEvent(event);
  const soulful = assessJiEventSoulfulData(event);
  const domain = jiBodyField(event.body, "Domain");
  const candidateKind = jiBodyField(event.body, "Candidate kind");
  const proposalKind = jiBodyField(event.body, "Proposal kind");
  const repository = jiBodyField(event.body, "Repository");

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={event.status} />
            <span className="rounded bg-lime-100 px-2 py-1 text-xs font-semibold text-lime-900">
              {detail.source.role}
            </span>
            <span className="rounded bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
              {event.kind}
            </span>
            {domain ? (
              <span className="rounded bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-900">
                {domain}
              </span>
            ) : null}
            {candidateKind ? (
              <span className="rounded bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-900">
                {candidateKind}
              </span>
            ) : null}
            {proposalKind ? (
              <span className="rounded bg-fuchsia-100 px-2 py-1 text-xs font-semibold text-fuchsia-900">
                {proposalKind}
              </span>
            ) : null}
            {repository ? (
              <span className="rounded bg-stone-900 px-2 py-1 text-xs font-semibold text-white">
                {repository}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-semibold tracking-normal text-stone-950">
            {event.title}
          </h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-600">
            {event.body}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
            <span>{event.sourceProject}</span>
            <span>{new Date(event.occurredAt).toLocaleString()}</span>
            <span>phase: {event.suggestedPhase ?? detail.defaultPhase}</span>
            {typeof event.ha === "number" ? <span>ha: {event.ha}</span> : null}
          </div>
          {event.refs?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {event.refs.map((ref) => (
                <span
                  key={`${ref.label}:${ref.href ?? ref.path ?? ref.hash}`}
                  className="rounded border border-stone-200 px-2 py-1 text-xs text-stone-600"
                >
                  {ref.label}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-4 rounded-md border border-lime-100 bg-lime-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-lime-800">
                  Soulful Data Review Signal
                </p>
                <p className="mt-1 text-sm text-lime-950">
                  score {soulfulScore(soulful.totalScore)} ·{" "}
                  {soulful.promotionPolicy.replace("_", " ")} · no auto-promote
                </p>
              </div>
              <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-lime-900">
                {soulful.weakSignals.length} weak signals
              </span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {soulful.dimensions.slice(0, 6).map((item) => (
                <div
                  key={item.key}
                  className="rounded border border-lime-100 bg-white px-2 py-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-stone-700">{item.label}</span>
                    <span className={soulfulStatusStyle(item.status)}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {domain === "CODING_AUTOMATION" ? (
            <div className="mt-3 rounded-md border border-violet-100 bg-violet-50 p-3 text-sm text-violet-950">
              <p className="font-semibold">Coding Intelligence Signal</p>
              <p className="mt-1 leading-6">
                This signal came from the coding lane. Treat repo metadata,
                release notes, and source summaries as observations; use
                Sandbox or RFC review before importing architecture lessons.
              </p>
            </div>
          ) : null}
          {domain === "PHILOSOPHY_AESTHETICS" ? (
            <div className="mt-3 rounded-md border border-fuchsia-100 bg-fuchsia-50 p-3 text-sm text-fuchsia-950">
              <p className="font-semibold">Philosophy / Aesthetics Signal</p>
              <p className="mt-1 leading-6">
                This signal may inform hopepunk ethics, soulful data, interface
                beauty, or worldline rehearsal. Treat it as a reviewable
                observation, not doctrine. Its proposal type should guide the
                next artifact: invariant, design surface, RFC, essay note, or
                engineering task.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-stone-100 pt-4 lg:grid-cols-[auto_1fr_auto_auto] lg:items-center">
        <form action={importJiEventAsNodeAction}>
          <input type="hidden" name="eventId" value={event.id} />
          <button className="inline-flex h-10 w-full items-center justify-center rounded-md bg-stone-950 px-3 text-sm font-medium text-white hover:bg-stone-800 lg:w-auto">
            Create Node + Proof
          </button>
        </form>

        <form
          action={createSandboxFromJiEventAction}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input type="hidden" name="eventId" value={event.id} />
          <select
            name="mode"
            className="h-10 rounded-md border border-stone-200 bg-white px-3 text-sm"
            defaultValue="SONATA"
          >
            {sandboxModes.map((mode) => (
              <option key={mode} value={mode}>
                {sandboxModeDetails[mode].label} /{" "}
                {sandboxModeDetails[mode].nativeLabel}
              </option>
            ))}
          </select>
          <button className="inline-flex h-10 items-center justify-center rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 hover:bg-stone-50">
            Create Sandbox
          </button>
        </form>

        <form action={draftRfcFromJiEventAction}>
          <input type="hidden" name="eventId" value={event.id} />
          <button className="inline-flex h-10 w-full items-center justify-center rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 lg:w-auto">
            Draft RFC
          </button>
        </form>

        <form action={dismissJiEventAction} className="flex gap-2">
          <input type="hidden" name="eventId" value={event.id} />
          <input
            name="reason"
            placeholder="dismiss note"
            className="h-10 min-w-0 rounded-md border border-stone-200 px-3 text-sm"
          />
          <button className="inline-flex h-10 items-center justify-center rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-500 hover:bg-stone-50">
            Dismiss
          </button>
        </form>
      </div>
    </article>
  );
}

function soulfulScore(value: number) {
  return `${value}/100`;
}

function soulfulStatusStyle(status: "pass" | "warn" | "fail") {
  const base = "rounded px-1.5 py-0.5 font-semibold";
  if (status === "fail") return `${base} bg-rose-100 text-rose-900`;
  if (status === "warn") return `${base} bg-amber-100 text-amber-900`;
  return `${base} bg-lime-100 text-lime-900`;
}

function RecentEventRow({ event }: { event: EcosystemJiEvent }) {
  return (
    <div className="rounded-md border border-stone-100 bg-stone-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={event.status} />
        <span className="text-xs text-stone-500">{event.sourceProject}</span>
        <span className="text-xs text-stone-500">{event.kind}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-stone-950">{event.title}</p>
      {event.importedNodeId ? (
        <Link
          href={`/nodes/${event.importedNodeId}`}
          className="mt-2 inline-flex text-xs font-medium text-lime-700"
        >
          Open node
        </Link>
      ) : null}
      {event.sandboxRunId ? (
        <Link
          href={`/sandbox?run=${event.sandboxRunId}`}
          className="mt-2 inline-flex text-xs font-medium text-lime-700"
        >
          Open sandbox
        </Link>
      ) : null}
      {event.rfcDraft ? (
        <pre className="mt-3 max-h-56 overflow-auto rounded bg-stone-950 p-3 text-xs leading-5 text-stone-100">
          {event.rfcDraft}
        </pre>
      ) : null}
    </div>
  );
}

function StatusPill({ status }: { status: JiReviewStatus }) {
  const styles: Record<JiReviewStatus, string> = {
    pending: "bg-amber-100 text-amber-900",
    imported: "bg-lime-100 text-lime-900",
    sandboxed: "bg-cyan-100 text-cyan-900",
    rfc_drafted: "bg-indigo-100 text-indigo-900",
    dismissed: "bg-stone-100 text-stone-600",
  };
  return (
    <span className={`rounded px-2 py-1 text-xs font-semibold ${styles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function HealthRow({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 text-sm">
      <span className="text-stone-600">{label}</span>
      <span className="font-semibold text-stone-950">{value}</span>
    </div>
  );
}
