import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Anchor,
  CheckCircle2,
  Code2,
  Compass,
  ClipboardCheck,
  Eye,
  GitFork,
  GitCommitHorizontal,
  Hash,
  Link2,
  Network,
  Palette,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PhaseBadge } from "@/components/PhaseBadge";
import { phases, type Phase } from "@/lib/domain";
import { anchorProviderDetails } from "@/lib/market";
import { recordManualAnchorReferenceAction } from "@/server/anchorActions";
import { getObservationPoolSnapshot } from "@/server/observe";

export const dynamic = "force-dynamic";

const signalStyles = {
  good: "border-lime-200 bg-lime-50 text-lime-950",
  watch: "border-amber-200 bg-amber-50 text-amber-950",
  alert: "border-rose-200 bg-rose-50 text-rose-950",
};

const signalIcons = {
  good: CheckCircle2,
  watch: Activity,
  alert: AlertTriangle,
};

type ObservationSnapshot = Awaited<ReturnType<typeof getObservationPoolSnapshot>>;
type MarketSnapshot = ObservationSnapshot["market"];
type MarketContribution = MarketSnapshot["chain"]["events"][number];
type MarketAnchor = MarketSnapshot["anchors"][number];

export default async function ObservePage() {
  const snapshot = await getObservationPoolSnapshot();
  const latestRun = snapshot.runs[0];

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-stone-500">
            Observation Pool
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Long-Run Monitor</h1>
          <p className="mt-2 max-w-3xl text-stone-600">
            Corpus queue, worker artifacts, trajectory marks, and pool health
            in one local watch surface.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/observe"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 shadow-sm"
          >
            <RefreshCw size={16} aria-hidden />
            Refresh
          </Link>
          <Link
            href="/corpus"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white shadow-sm"
          >
            <Eye size={16} aria-hidden />
            Mark Corpus
          </Link>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Inbox items" value={snapshot.inbox.items} detail={`${snapshot.inbox.files} files`} />
        <MetricCard label="Observed runs" value={snapshot.runSummary.totalRuns} detail={`${snapshot.runSummary.marks} marks`} />
        <MetricCard label="Trajectory events" value={snapshot.runSummary.trajectoryEvents} detail={`${snapshot.runSummary.highHa} high-ha`} />
        <MetricCard label="Pool nodes" value={snapshot.pool.activeNodes} detail={`${snapshot.pool.edges} active edges`} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-4">
        <MetricCard label="Contribution events" value={snapshot.market.totals.contributionEvents} detail={`${snapshot.market.totals.actors} actors`} />
        <MetricCard label="Open orders" value={snapshot.market.totals.openOrders} detail="simulated only" />
        <MetricCard label="Pending anchors" value={snapshot.market.totals.pendingAnchors} detail="run npm run market:tick" />
        <MetricCard label="Exported anchors" value={snapshot.market.totals.exportedAnchors} detail="local bundles" />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="AI API"
          value={snapshot.ai.hasApiKey ? "ready" : "missing"}
          detail="OpenAI Responses API"
        />
        <MetricCard
          label="AI cycles"
          value={snapshot.ai.cycles}
          detail={`${snapshot.ai.failedOrSkippedCycles} failed/skipped`}
        />
        <MetricCard
          label="Sandbox runs"
          value={snapshot.sandbox.runs}
          detail="sandbox only"
        />
        <MetricCard
          label="Sandbox learnings"
          value={snapshot.sandbox.proposedLearnings}
          detail="review before import"
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-4">
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">AI Review Surface</h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
            <HealthRow label="completed" value={snapshot.ai.cyclesByStatus.completed} />
            <HealthRow label="skipped" value={snapshot.ai.cyclesByStatus.skipped} />
            <HealthRow label="failed" value={snapshot.ai.cyclesByStatus.failed} />
            <HealthRow label="invalid" value={snapshot.ai.invalidDecisions} />
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
            <HealthRow label="open suggestions" value={snapshot.ai.suggestionsByStatus.open} />
            <HealthRow label="reviewed" value={snapshot.ai.suggestionsByStatus.reviewed} />
            <HealthRow label="accepted" value={snapshot.ai.suggestionsByStatus.accepted} />
            <HealthRow label="rejected" value={snapshot.ai.suggestionsByStatus.rejected} />
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Sandbox Health</h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <HealthRow label="Fugue" value={snapshot.sandbox.byMode.FUGUE} />
            <HealthRow label="Sonata" value={snapshot.sandbox.byMode.SONATA} />
            <HealthRow label="Symphony" value={snapshot.sandbox.byMode.SYMPHONY} />
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <HealthRow label="completed" value={snapshot.sandbox.completedRuns} />
            <HealthRow label="archived" value={snapshot.sandbox.archivedRuns} />
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Ecosystem Intake</h2>
              <p className="mt-1 text-sm text-stone-500">
                JiEvents are reviewable signals, not canonical mutations.
              </p>
            </div>
            <Link
              href="/ecosystem"
              className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Open
            </Link>
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <HealthRow label="pending" value={snapshot.ecosystem.pending} />
            <HealthRow label="imported" value={snapshot.ecosystem.byStatus.imported} />
            <HealthRow label="sandboxed" value={snapshot.ecosystem.byStatus.sandboxed} />
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <HealthRow label="inbox lines" value={snapshot.ecosystem.inbox.lines} />
            <HealthRow label="inbox errors" value={snapshot.ecosystem.inbox.errors} />
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Autonomy Daemon</h2>
          <p className="mt-1 text-sm text-stone-500">
            Long CLI cycles observe and propose, never promote canonical state.
          </p>
          <div className="mt-3 grid gap-2 text-sm">
            <HealthRow
              label="latest run"
              value={snapshot.ecosystemDaemon.latestRunId ?? "none"}
            />
            <HealthRow label="observations" value={snapshot.ecosystemDaemon.observations} />
            <HealthRow label="proposals" value={snapshot.ecosystemDaemon.proposals} />
            <HealthRow
              label="AI mainline"
              value={`${snapshot.ai.maturity.status} ${snapshot.ai.maturity.totalScore}/100`}
            />
          </div>
        </div>

        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-cyan-950">
                AI Research Lane
              </h2>
              <p className="mt-1 text-sm text-cyan-900/75">
                Hourly source search forms a local chain and JiEvent review queue.
              </p>
            </div>
            <Hash size={18} aria-hidden className="mt-1 text-cyan-700" />
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            <HealthRow
              label="latest run"
              value={snapshot.networkSkill.latestRunId ?? "none"}
            />
            <HealthRow label="candidates" value={snapshot.networkSkill.candidates} />
            <HealthRow label="chained" value={snapshot.networkSkill.chained} />
            <HealthRow
              label="JiEvents"
              value={snapshot.networkSkill.jiEventsWritten}
            />
            <HealthRow
              label="proposals"
              value={snapshot.networkSkill.reviewProposals}
            />
          </div>
          <div className="mt-3 rounded-md bg-white/80 p-2 text-xs leading-5 text-cyan-950">
            <p>npm run skill:crystallize:watch -- --interval-ms 3600000</p>
            <p className="break-all text-cyan-700">
              latestHash: {snapshot.networkSkill.latestHash ?? "none"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-violet-950">
                Coding Intelligence Lane
              </h2>
              <p className="mt-1 text-sm text-violet-900/75">
                AI coding, repo architecture, paradigms, and design patterns
                become reviewable JiEvents and sandbox rehearsals.
              </p>
            </div>
            <Code2 size={18} aria-hidden className="mt-1 text-violet-700" />
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            <HealthRow
              label="latest run"
              value={snapshot.codingSkill.latestRunId ?? "none"}
            />
            <HealthRow label="candidates" value={snapshot.codingSkill.candidates} />
            <HealthRow label="repo scans" value={snapshot.codingSkill.repoScans} />
            <HealthRow
              label="auto sandboxes"
              value={snapshot.codingSkill.sandboxRunsCreated}
            />
            <HealthRow
              label="proposals"
              value={snapshot.codingSkill.reviewProposals}
            />
          </div>
          <div className="mt-3 rounded-md bg-white/80 p-2 text-xs leading-5 text-violet-950">
            <p>npm run skill:crystallize:watch -- --domain coding --interval-ms 3600000</p>
            <p>npm run coding:repo-scan -- --repo openai/codex</p>
            <p className="break-all text-violet-700">
              latestHash: {snapshot.codingSkill.latestHash ?? "none"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-fuchsia-950">
                Philosophy / Aesthetics Lane
              </h2>
              <p className="mt-1 text-sm text-fuchsia-900/75">
                Hopepunk ethics, humanism, soulful data, interface beauty, and
                worldline essays become reviewable JiEvents and sandbox prompts.
              </p>
            </div>
            <Palette size={18} aria-hidden className="mt-1 text-fuchsia-700" />
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            <HealthRow
              label="latest run"
              value={snapshot.philosophySkill.latestRunId ?? "none"}
            />
            <HealthRow
              label="candidates"
              value={snapshot.philosophySkill.candidates}
            />
            <HealthRow
              label="JiEvents"
              value={snapshot.philosophySkill.jiEventsWritten}
            />
            <HealthRow
              label="auto sandboxes"
              value={snapshot.philosophySkill.sandboxRunsCreated}
            />
            <HealthRow
              label="proposals"
              value={snapshot.philosophySkill.reviewProposals}
            />
          </div>
          <div className="mt-3 rounded-md bg-white/80 p-2 text-xs leading-5 text-fuchsia-950">
            <p>
              npm run skill:crystallize:watch -- --domain philosophy
              --interval-ms 3600000
            </p>
            <p className="break-all text-fuchsia-700">
              latestHash: {snapshot.philosophySkill.latestHash ?? "none"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-fuchsia-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-fuchsia-700">
              <Compass size={16} aria-hidden />
              Philosophy / Aesthetics Gap Audit
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-950">
              Long Goal Compass
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              The pool audits its own hopepunk, humanist, AI non-sovereignty,
              soulful data, reliability, fork, worldline, and aesthetic
              ambitions. Findings become reviewable tasks, RFCs, essay notes,
              design proposals, JiEvents, or sandbox rehearsals; never canonical
              mutations.
            </p>
          </div>
          <div className="grid min-w-56 grid-cols-2 gap-2 text-sm">
            <HealthRow
              label="coverage"
              value={`${snapshot.philosophyGoal.coverageScore}/100`}
            />
            <HealthRow label="open" value={snapshot.philosophyGoal.openItems.length} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <ProofStat label="covered" value={snapshot.philosophyGoal.covered} />
          <ProofStat label="partial" value={snapshot.philosophyGoal.partial} />
          <ProofStat label="gaps" value={snapshot.philosophyGoal.gaps} />
          <ProofStat
            label="critical open"
            value={snapshot.philosophyGoal.criticalOpen}
          />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {snapshot.philosophyGoal.topItems.map((item) => (
            <article
              key={item.id}
              className="rounded-md border border-fuchsia-100 bg-fuchsia-50 p-4 text-sm text-fuchsia-950"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {item.id} · {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-fuchsia-900/75">
                    {item.pillar} · {item.category} · {item.proposalKind}
                  </p>
                </div>
                <GapStatusPill status={item.status} />
              </div>
              <p className="mt-3 leading-6">{item.missingIfAbsent}</p>
              <p className="mt-3 rounded bg-white/80 p-2 text-xs leading-5 text-fuchsia-900">
                {item.acceptanceCheck}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <code className="rounded bg-stone-100 px-2 py-1">
            npm run philosophy:gap-audit
          </code>
          <code className="rounded bg-stone-100 px-2 py-1">
            npm run philosophy:gap-audit -- --create-sandboxes
          </code>
          <span>observe + propose · no auto promote</span>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-sky-700">
              <ClipboardCheck size={16} aria-hidden />
              Long Goal Evidence
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-sky-950">
              Long Goal Evidence Bundle
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-900/75">
              The active philosophy and aesthetics objective is backed by a
              local evidence bundle: goal audit, constitution, worldline
              matrix, repair queue, fork compatibility, and screenshot smoke.
              It is proof for review, not a claim that exploration should stop.
            </p>
          </div>
          <span className={evidenceBundleStatusStyle(snapshot.longGoalEvidence.status)}>
            {snapshot.longGoalEvidence.status}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <HealthRow label="items" value={snapshot.longGoalEvidence.items} />
          <HealthRow label="pass" value={snapshot.longGoalEvidence.pass} />
          <HealthRow label="warn" value={snapshot.longGoalEvidence.warn} />
          <HealthRow label="fail" value={snapshot.longGoalEvidence.fail} />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-2 lg:grid-cols-2">
            {snapshot.longGoalEvidence.topItems.length ? (
              snapshot.longGoalEvidence.topItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-md border border-sky-100 bg-white/80 p-3 text-sm text-sky-950"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {item.id} · {item.title}
                    </p>
                    <span className="rounded bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-950">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-sky-900/75">
                    {item.command}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-md border border-sky-100 bg-white/80 p-3 text-sm text-sky-950">
                No long-goal evidence bundle run yet.
              </div>
            )}
          </div>
          <div className="rounded-md bg-white/80 p-3 text-xs leading-5 text-sky-950">
            <p>{snapshot.longGoalEvidence.latestRunId ?? "No evidence bundle yet"}</p>
            <p>npm run long-goal:evidence</p>
            <p>data/ecosystem/long-goal-evidence</p>
            <p className="text-sky-700">evidence only · goal remains active</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-violet-200 bg-violet-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-violet-700">
              <Compass size={16} aria-hidden />
              Next Horizon
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-violet-950">
              Long Goal Horizon
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-violet-900/75">
              When the evidence bundle is green, Crystal Pool should not fall
              asleep. This horizon cycle asks what the philosophy and aesthetic
              system still needs next, then emits review-gated JiEvents,
              sandbox rehearsals, RFC drafts, design proposals, and engineering
              tasks.
            </p>
          </div>
          <span className={horizonStatusStyle(snapshot.longGoalHorizon.status)}>
            {snapshot.longGoalHorizon.status}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <HealthRow label="proposals" value={snapshot.longGoalHorizon.proposals} />
          <HealthRow label="near" value={snapshot.longGoalHorizon.near} />
          <HealthRow label="JiEvents" value={snapshot.longGoalHorizon.jiEventsWritten} />
          <HealthRow
            label="sandboxes"
            value={snapshot.longGoalHorizon.sandboxRunsCreated}
          />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-2 lg:grid-cols-2">
            {snapshot.longGoalHorizon.topProposals.length ? (
              snapshot.longGoalHorizon.topProposals.map((proposal) => (
                <article
                  key={proposal.id}
                  className="rounded-md border border-violet-100 bg-white/80 p-3 text-sm text-violet-950"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {proposal.id} · {proposal.title}
                    </p>
                    <span className="rounded bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-950">
                      {proposal.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-violet-900/75">
                    {proposal.pillar} · {proposal.category} ·{" "}
                    {proposal.proposalKind}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-violet-900/70">
                    {proposal.nextQuestion}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-md border border-violet-100 bg-white/80 p-3 text-sm text-violet-950">
                No horizon run yet. The first cycle will turn the current
                green evidence floor into the next reviewable questions.
              </div>
            )}
          </div>
          <div className="rounded-md bg-white/80 p-3 text-xs leading-5 text-violet-950">
            <p>{snapshot.longGoalHorizon.latestRunId ?? "No horizon run yet"}</p>
            <p>npm run long-goal:horizon</p>
            <p>npm run long-goal:horizon -- --create-sandboxes</p>
            <p className="text-violet-700">
              next questions only · no canonical promotion
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-indigo-700">
              <Network size={16} aria-hidden />
              Worldline Sandbox
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-indigo-950">
              Worldline Coverage Matrix
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-indigo-900/75">
              Every worldline should be rehearsed through Fugue, Sonata, and
              Symphony. The matrix tracks actual sandbox runs and names missing
              combinations before lore hardens into untested doctrine.
            </p>
          </div>
          <span className={worldlineCoverageStatusStyle(snapshot.worldlineCoverage.status)}>
            {snapshot.worldlineCoverage.status}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <HealthRow
            label="coverage"
            value={`${snapshot.worldlineCoverage.coveragePercent}%`}
          />
          <HealthRow
            label="covered"
            value={`${snapshot.worldlineCoverage.coveredCells}/${snapshot.worldlineCoverage.totalCells}`}
          />
          <HealthRow label="missing" value={snapshot.worldlineCoverage.missingCells} />
          <HealthRow
            label="created"
            value={snapshot.worldlineCoverage.sandboxRunsCreated}
          />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-2">
            {snapshot.worldlineCoverage.missing.length ? (
              snapshot.worldlineCoverage.missing.map((cell) => (
                <article
                  key={`${cell.worldlineKey}:${cell.mode}`}
                  className="rounded-md border border-indigo-100 bg-white/80 p-3 text-sm text-indigo-950"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {cell.worldlineKey} + {cell.mode}
                    </p>
                    <span className="rounded bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-950">
                      missing
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-indigo-900/75">
                    {cell.worldlineLabel}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-md border border-indigo-100 bg-white/80 p-3 text-sm text-indigo-950">
                All worldline and mode combinations have completed sandbox
                rehearsal evidence.
              </div>
            )}
          </div>
          <div className="rounded-md bg-white/80 p-3 text-xs leading-5 text-indigo-950">
            <p>{snapshot.worldlineCoverage.latestRunId ?? "No matrix run yet"}</p>
            <p>npm run worldline:coverage</p>
            <p>npm run worldline:coverage -- --create-missing</p>
            <p className="text-indigo-700">
              sandbox evidence only · no learning promotion
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-emerald-700">
              <GitFork size={16} aria-hidden />
              Open Core / Closed Shell
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-emerald-950">
              Fork Compatibility Boundary
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-900/75">
              Forks may diverge, commercialize shells, and build their own
              worlds, but compatibility requires the auditable core to keep
              review gates, AI non-sovereignty, proof locality, repair, and
              fork drift rehearsal visible.
            </p>
          </div>
          <span className={forkCompatibilityStatusStyle(snapshot.forkCompatibility.status)}>
            {snapshot.forkCompatibility.compatibilityBadge}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <HealthRow label="pass" value={snapshot.forkCompatibility.pass} />
          <HealthRow label="warn" value={snapshot.forkCompatibility.warn} />
          <HealthRow label="fail" value={snapshot.forkCompatibility.fail} />
          <HealthRow
            label="status"
            value={snapshot.forkCompatibility.status}
          />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-2 lg:grid-cols-2">
            {snapshot.forkCompatibility.criteria.length ? (
              snapshot.forkCompatibility.criteria.map((criterion) => (
                <article
                  key={criterion.id}
                  className="rounded-md border border-emerald-100 bg-white/80 p-3 text-sm text-emerald-950"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {criterion.id} · {criterion.title}
                    </p>
                    <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-950">
                      {criterion.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-emerald-900/75">
                    {criterion.category}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-md border border-emerald-100 bg-white/80 p-3 text-sm text-emerald-950">
                No fork compatibility run yet.
              </div>
            )}
          </div>
          <div className="rounded-md bg-white/80 p-3 text-xs leading-5 text-emerald-950">
            <p>{snapshot.forkCompatibility.latestRunId ?? "No fork check yet"}</p>
            <p>npm run fork:compatibility</p>
            <p>docs/governance/fork-compatibility.md</p>
            <p className="text-emerald-700">
              evidence only · no automatic certification
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-amber-700">
              <Wrench size={16} aria-hidden />
              Hopepunk Repair
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-amber-950">
              Hopepunk Repair Queue
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900/75">
              Failures, warnings, weak intake signals, and unfinished sandbox
              lessons become repair proposals. The queue writes local JiEvents,
              RFC drafts, and optional sandbox rehearsals; it never repairs by
              secretly changing canonical truth.
            </p>
          </div>
          <span className={repairQueueStatusStyle(snapshot.repairQueue.status)}>
            {snapshot.repairQueue.status}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <HealthRow label="items" value={snapshot.repairQueue.items} />
          <HealthRow label="critical" value={snapshot.repairQueue.critical} />
          <HealthRow label="JiEvents" value={snapshot.repairQueue.jiEventsWritten} />
          <HealthRow
            label="sandboxes"
            value={snapshot.repairQueue.sandboxRunsCreated}
          />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-2">
            {snapshot.repairQueue.topItems.length ? (
              snapshot.repairQueue.topItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-md border border-amber-100 bg-white/80 p-3 text-sm text-amber-950"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{item.title}</p>
                    <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-950">
                      {item.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-amber-900/75">
                    {item.sourceKind} · {item.proposalKind}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-md border border-amber-100 bg-white/80 p-3 text-sm text-amber-950">
                No active repair items. The queue is still running as a
                readiness mechanism.
              </div>
            )}
          </div>
          <div className="rounded-md bg-white/80 p-3 text-xs leading-5 text-amber-950">
            <p>{snapshot.repairQueue.latestRunId ?? "No repair queue run yet"}</p>
            <p>npm run repair:queue</p>
            <p>npm run repair:queue -- --create-sandboxes</p>
            <p className="text-amber-700">observe + propose · no auto promote</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-cyan-700">
              Aesthetic Evidence
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-cyan-950">
              Screenshot Smoke
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-900/75">
              Core operation surfaces are captured as local desktop and mobile
              screenshots. The run checks required domain text, HTTP status,
              blank-page risk, and horizontal overflow; it is evidence for
              review, not an automatic judgment of beauty.
            </p>
          </div>
          <span className={aestheticSmokeStatusStyle(snapshot.aestheticSmoke.status)}>
            {snapshot.aestheticSmoke.status}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <HealthRow label="checks" value={snapshot.aestheticSmoke.checks} />
          <HealthRow label="passed" value={snapshot.aestheticSmoke.passed} />
          <HealthRow label="failed" value={snapshot.aestheticSmoke.failed} />
          <HealthRow label="screenshots" value={snapshot.aestheticSmoke.screenshots} />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-md bg-white/80 p-3 text-sm text-cyan-950">
            <p className="font-semibold">
              {snapshot.aestheticSmoke.latestRunId ?? "No local screenshot run yet"}
            </p>
            <p className="mt-2 text-xs leading-5 text-cyan-900/75">
              Routes:{" "}
              {snapshot.aestheticSmoke.routes.length
                ? snapshot.aestheticSmoke.routes.join(", ")
                : "run the local smoke command"}
            </p>
          </div>
          <div className="rounded-md bg-white/80 p-3 text-xs leading-5 text-cyan-950">
            <p>npm run ui:aesthetic-smoke</p>
            <p>npm run philosophy:gap-audit -- --dry-run</p>
            <p className="text-cyan-700">local artifacts only · no upload</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-stone-900 bg-stone-950 p-5 text-stone-50 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-lime-300">
              Ethical Kernel
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Constitution Status</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-300">
              Philosophy is enforced as local guardrails: AI mainline stays
              review-only, proof-chain remains manual, JiEvents enter through
              review, and fork drift is rehearsed before legitimacy claims.
            </p>
          </div>
          <span
            className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold ${constitutionStatusStyle(
              snapshot.ethics.status,
            )}`}
          >
            {snapshot.ethics.status === "fail" ? (
              <ShieldAlert size={16} aria-hidden />
            ) : (
              <ShieldCheck size={16} aria-hidden />
            )}
            {snapshot.ethics.status}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ProofStat label="pass" value={snapshot.ethics.summary.pass} />
          <ProofStat label="warn" value={snapshot.ethics.summary.warn} />
          <ProofStat label="fail" value={snapshot.ethics.summary.fail} />
        </div>
        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {snapshot.ethics.results.slice(0, 6).map((result) => (
            <div
              key={result.invariantId}
              className="rounded-md border border-white/10 bg-white/5 p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">
                    {result.invariantId} · {result.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-300">
                    {result.detail}
                  </p>
                </div>
                <span className={constitutionPillStyle(result.status)}>
                  {result.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-400">
          <code className="rounded bg-white/10 px-2 py-1">
            npm run constitution:check
          </code>
          <span>no wallet · no token · no RPC · no automatic upload · no auto-unlock</span>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Signals</h2>
              <p className="mt-1 text-sm text-stone-600">
                Generated at {formatDate(snapshot.generatedAt)}
              </p>
            </div>
            <code className="w-fit rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-700">
              npm run corpus:watch
            </code>
          </div>
          <div className="mt-4 grid gap-3">
            {snapshot.signals.map((signal) => {
              const Icon = signalIcons[signal.level];
              return (
                <article
                  key={`${signal.level}:${signal.title}`}
                  className={`rounded-lg border p-4 ${signalStyles[signal.level]}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon size={19} aria-hidden className="mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold">{signal.title}</h3>
                      <p className="mt-1 text-sm leading-6">{signal.detail}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Pool Health</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <HealthRow label="Active nodes" value={snapshot.pool.activeNodes} />
            <HealthRow label="Archived nodes" value={snapshot.pool.archivedNodes} />
            <HealthRow label="Active edges" value={snapshot.pool.edges} />
            <HealthRow label="Low-ha crystals" value={snapshot.pool.lowHaCrystals} />
            <HealthRow label="Isolated nodes" value={snapshot.pool.isolatedNodes} />
            <HealthRow label="7d phase events" value={snapshot.pool.recentPhaseEvents} />
          </div>
          <div className="mt-5 grid gap-2">
            {phases.map((phase) => (
              <div
                key={phase}
                className="flex items-center justify-between rounded-md bg-stone-50 p-3"
              >
                <PhaseBadge phase={phase} />
                <span className="text-sm font-semibold">
                  {snapshot.pool.phaseCounts[phase] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Corpus Runs</h2>
            <span className="text-sm text-stone-500">
              {snapshot.processedFiles} processed files
            </span>
          </div>
          {snapshot.runs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
              No completed corpus runs are visible yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {snapshot.runs.map((run) => (
                <article
                  key={run.runId}
                  className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{run.runId}</h3>
                      <p className="mt-1 text-sm text-stone-600">
                        {formatDate(run.createdAt)} · {run.workerTarget}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-72">
                      <RunPill label="items" value={run.inputItems} />
                      <RunPill label="marks" value={run.marks} />
                      <RunPill label="warnings" value={run.warnings} />
                    </div>
                  </div>
                  {run.notableMarks.length > 0 ? (
                    <div className="mt-4 grid gap-2">
                      {run.notableMarks.map((mark) => (
                        <div
                          key={`${run.runId}:${mark.title}`}
                          className="rounded-md bg-stone-50 p-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <PhaseBadge phase={mark.phase as Phase} />
                            <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-stone-700">
                              {mark.relation}
                            </span>
                            <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-stone-700">
                              ha {mark.emotionHa}
                            </span>
                          </div>
                          <p className="mt-2 leading-6 text-stone-700">
                            {mark.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Queue</h2>
          <div className="mt-4 grid gap-3">
            <HealthRow label="Inbox files" value={snapshot.inbox.files} />
            <HealthRow label="Inbox items" value={snapshot.inbox.items} />
            <HealthRow label="Inbox bytes" value={formatBytes(snapshot.inbox.bytes)} />
            <HealthRow label="Parse errors" value={snapshot.inbox.errors} />
            <HealthRow label="Processed files" value={snapshot.processedFiles} />
          </div>
          <div className="mt-5 rounded-md bg-stone-950 p-3 text-xs leading-6 text-stone-50">
            <p>data/corpus/inbox/*.jsonl</p>
            <p>data/corpus/runs/&lt;run-id&gt;/</p>
            <p>data/corpus/processed/&lt;run-id&gt;/</p>
          </div>
          {latestRun ? (
            <div className="mt-5 rounded-md bg-cyan-50 p-4 text-sm text-cyan-950">
              Latest: {latestRun.marks} marks, {latestRun.trajectoryEvents} trajectory events.
            </div>
          ) : null}
        </aside>
      </section>

      <ProofChainExplorer market={snapshot.market} />

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Market Watcher</h2>
              <p className="mt-1 text-sm text-stone-600">
                Contribution chain, simulated depth, and local anchor status.
              </p>
            </div>
            <code className="w-fit rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-700">
              npm run market:watch
            </code>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <HealthRow label="Signal price" value={snapshot.market.depth.signalPrice} />
            <HealthRow label="Buy pressure" value={snapshot.market.depth.buyPressure} />
            <HealthRow label="Challenge pressure" value={snapshot.market.depth.challengePressure} />
            <HealthRow label="Verification depth" value={snapshot.market.depth.verificationDepth} />
          </div>
          <div className="mt-5 grid gap-3">
            {snapshot.market.recentContributions.slice(0, 5).map((event) => (
              <Link
                key={event.id}
                href={event.href}
                className="rounded-md bg-stone-50 p-3 text-sm transition hover:bg-stone-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{event.kind}</span>
                  <span className="text-xs text-stone-500">
                    {event.actorAlias} · w{event.weight}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-stone-600">
                  {event.nodeTitle}: {event.body}
                </p>
                <p className="mt-1 break-all text-xs text-stone-400">
                  {event.eventHash.slice(0, 24)}...
                </p>
              </Link>
            ))}
            {snapshot.market.recentContributions.length === 0 ? (
              <p className="rounded-md border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                No market contribution events yet.
              </p>
            ) : null}
          </div>
        </div>

        <aside
          id="anchors"
          className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-xl font-semibold">Anchor Bundles</h2>
          <p className="mt-1 text-sm text-stone-600">
            Local proof bundles only. IPFS and Arweave are manual handoff
            targets, not live uploads.
          </p>
          <div className="mt-4 grid gap-3">
            {snapshot.market.anchors.map((anchor) => {
              const provider = anchorProviderDetails[anchor.provider];
              return (
              <div key={anchor.id} className="rounded-md bg-stone-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{provider.label}</span>
                  <span className="text-stone-500">{anchor.status}</span>
                </div>
                <p className="mt-1 text-stone-600">{provider.description}</p>
                <p className="mt-1 text-stone-600">
                  {anchor.eventCount} events · {formatDate(anchor.createdAt)}
                </p>
                <p className="mt-1 break-all text-xs text-stone-400">
                  {anchor.bundleHash.slice(0, 32)}...
                </p>
                {anchor.externalRef ? (
                  <div className="mt-3 rounded-md bg-white p-3 text-xs text-stone-700">
                    <p className="font-semibold">
                      Manual external reference recorded
                    </p>
                    <p className="mt-1">
                      {anchor.externalProvider} ·{" "}
                      {anchor.externalRecordedAt
                        ? formatDate(anchor.externalRecordedAt)
                        : "recorded"}
                    </p>
                    <p className="mt-1 break-all text-stone-500">
                      {anchor.externalRef}
                    </p>
                    {anchor.externalNote ? (
                      <p className="mt-1 text-stone-500">{anchor.externalNote}</p>
                    ) : null}
                  </div>
                ) : (
                  <form
                    action={recordManualAnchorReferenceAction}
                    className="mt-3 grid gap-2 rounded-md bg-white p-3"
                  >
                    <input type="hidden" name="anchorId" value={anchor.id} />
                    <div className="grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)]">
                      <select
                        name="externalProvider"
                        defaultValue={anchor.provider}
                        className="h-9 rounded-md border border-stone-300 bg-white px-2 text-xs"
                        aria-label={`External provider for ${anchor.id}`}
                      >
                        <option value="local">local</option>
                        <option value="ipfs">ipfs</option>
                        <option value="arweave">arweave</option>
                      </select>
                      <input
                        name="externalRef"
                        required
                        placeholder="manual CID / tx id / local proof ref"
                        className="h-9 rounded-md border border-stone-300 px-2 text-xs"
                        aria-label={`External reference for ${anchor.id}`}
                      />
                    </div>
                    <input
                      name="externalNote"
                      placeholder="optional note"
                      className="h-9 rounded-md border border-stone-300 px-2 text-xs"
                      aria-label={`External reference note for ${anchor.id}`}
                    />
                    <button className="inline-flex h-8 w-fit items-center rounded-md border border-stone-300 px-2 text-xs font-semibold text-stone-700">
                      Record Manual Reference
                    </button>
                  </form>
                )}
              </div>
              );
            })}
            {snapshot.market.anchors.length === 0 ? (
              <p className="rounded-md border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                No anchor bundles exported yet.
              </p>
            ) : null}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function ProofChainExplorer({ market }: { market: MarketSnapshot }) {
  const proof = market.chain;
  const StatusIcon = proof.ok ? ShieldCheck : ShieldAlert;
  const statusTone = proof.ok
    ? "border-lime-300 bg-lime-200 text-lime-950"
    : "border-rose-300 bg-rose-100 text-rose-950";
  const recentEvents = proof.events.slice(0, 10);

  return (
    <section
      id="proof-chain"
      className="mt-6 overflow-hidden rounded-lg border border-stone-900 bg-stone-950 text-stone-50 shadow-sm"
    >
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="border-b border-stone-800 p-5 xl:border-b-0 xl:border-r">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-stone-500">
                Local Proof Layer
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Proof Chain Explorer</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">
                Deterministic contribution hashes, previousHash links, local anchor bundles, and manual external references in one readable spine.
              </p>
            </div>
            <span
              className={`inline-flex h-10 w-fit items-center gap-2 rounded-md border px-3 text-sm font-black uppercase ${statusTone}`}
            >
              <StatusIcon size={16} aria-hidden />
              {proof.ok ? "chain ok" : "inspect chain"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <ProofStat label="events" value={proof.eventCount} />
            <ProofStat label="anchored" value={proof.anchoredEvents} />
            <ProofStat label="unanchored" value={proof.unanchoredEvents} />
            <ProofStat label="coverage" value={`${proof.coveragePercent}%`} />
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <HashPanel label="genesis hash" value={proof.genesisHash} />
            <HashPanel label="latest hash" value={proof.latestHash} />
          </div>

          {!proof.ok ? (
            <div className="mt-4 rounded-md border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">
              {proof.issues[0] ?? "Contribution hash chain requires review."}
            </div>
          ) : null}

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-normal text-stone-100">
                Event hash spine
              </h3>
              <span className="text-xs text-stone-500">newest first</span>
            </div>
            <div className="relative grid gap-3">
              {recentEvents.length === 0 ? (
                <div className="rounded-md border border-dashed border-stone-700 p-5 text-sm text-stone-400">
                  No contribution events yet. The proof spine appears after local contributions are recorded.
                </div>
              ) : (
                recentEvents.map((event, index) => (
                  <ProofEventRow
                    key={event.id}
                    event={event}
                    isLatest={index === 0}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-normal text-stone-100">
                Anchor timeline
              </h3>
              <p className="mt-1 text-sm text-stone-500">
                Exported bundles and optional manual CID / tx references.
              </p>
            </div>
            <span className="rounded-md bg-stone-900 px-2 py-1 text-xs font-semibold text-stone-400">
              no auto upload
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {market.anchors.length === 0 ? (
              <div className="rounded-md border border-dashed border-stone-700 p-4 text-sm text-stone-400">
                No anchor bundle has been exported yet. Run the local market anchor flow when contribution events are ready.
              </div>
            ) : (
              market.anchors.map((anchor) => (
                <AnchorTimelineCard key={anchor.id} anchor={anchor} />
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function ProofStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-stone-800 bg-stone-900 p-3">
      <p className="text-xs uppercase text-stone-500">{label}</p>
      <p className="mt-1 font-mono text-2xl font-black text-stone-50">
        {value}
      </p>
    </div>
  );
}

function HashPanel({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-md border border-stone-800 bg-stone-900 p-3">
      <p className="inline-flex items-center gap-2 text-xs uppercase text-stone-500">
        <Hash size={13} aria-hidden />
        {label}
      </p>
      <p className="mt-2 break-all font-mono text-xs leading-5 text-cyan-200">
        {value ?? "none"}
      </p>
    </div>
  );
}

function ProofEventRow({
  event,
  isLatest,
}: {
  event: MarketContribution;
  isLatest: boolean;
}) {
  const anchored = Boolean(event.anchorId);
  return (
    <Link
      href={event.href}
      className="grid gap-3 rounded-md border border-stone-800 bg-stone-900 p-3 text-sm transition hover:bg-stone-800 md:grid-cols-[34px_minmax(0,1fr)_120px]"
    >
      <div className="flex items-start justify-center">
        <span
          className={`mt-1 grid size-6 place-items-center rounded-full ${
            anchored ? "bg-lime-300 text-lime-950" : "bg-amber-200 text-amber-950"
          }`}
        >
          <GitCommitHorizontal size={14} aria-hidden />
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-stone-100">
            {event.kind} · {event.nodeTitle}
          </span>
          {isLatest ? (
            <span className="rounded bg-cyan-200 px-2 py-0.5 text-xs font-black uppercase text-cyan-950">
              head
            </span>
          ) : null}
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${
              anchored
                ? "bg-lime-300/15 text-lime-200"
                : "bg-amber-300/15 text-amber-100"
            }`}
          >
            {anchored ? "anchored" : "open"}
          </span>
        </div>
        <p className="mt-1 text-xs text-stone-500">
          {event.actorAlias} · w{event.weight} · {formatDate(event.createdAt)}
        </p>
        <div className="mt-2 grid gap-1 font-mono text-[11px] leading-5">
          <p className="break-all text-cyan-200">
            eventHash {shortHash(event.eventHash)}
          </p>
          <p className="break-all text-stone-500">
            previousHash {shortHash(event.previousHash)}
          </p>
        </div>
      </div>
      <div className="flex items-start justify-start md:justify-end">
        <span className="rounded bg-stone-950 px-2 py-1 font-mono text-xs text-stone-300">
          {shortHash(event.anchorId)}
        </span>
      </div>
    </Link>
  );
}

function AnchorTimelineCard({ anchor }: { anchor: MarketAnchor }) {
  const provider = anchorProviderDetails[anchor.provider];
  return (
    <div className="rounded-md border border-stone-800 bg-stone-900 p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 font-semibold text-stone-100">
          <Anchor size={15} aria-hidden />
          {provider.label}
        </span>
        <span className="rounded bg-stone-950 px-2 py-1 text-xs text-stone-400">
          {anchor.status}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-stone-500">
        {anchor.eventCount} events · {formatDate(anchor.createdAt)}
      </p>
      <div className="mt-3 grid gap-2 rounded bg-stone-950 p-3 font-mono text-[11px] leading-5">
        <p className="break-all text-cyan-200">
          bundle {shortHash(anchor.bundleHash)}
        </p>
        <p className="break-all text-stone-500">
          from {shortHash(anchor.fromEventHash)}
        </p>
        <p className="break-all text-stone-500">
          to {shortHash(anchor.toEventHash)}
        </p>
      </div>
      {anchor.externalRef ? (
        <div className="mt-3 rounded bg-lime-300/10 p-3 text-xs text-lime-100">
          <p className="inline-flex items-center gap-2 font-semibold">
            <Link2 size={13} aria-hidden />
            Manual external reference
          </p>
          <p className="mt-1 break-all text-lime-200">
            {anchor.externalProvider}: {anchor.externalRef}
          </p>
        </div>
      ) : null}
    </div>
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
      <p className="text-sm text-stone-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{detail}</p>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-stone-50 p-3">
      <span className="text-stone-600">{label}</span>
      <span className="break-words text-right font-semibold">{value}</span>
    </div>
  );
}

function RunPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-stone-50 px-3 py-2">
      <p className="font-semibold text-stone-950">{value}</p>
      <p className="text-stone-500">{label}</p>
    </div>
  );
}

function constitutionStatusStyle(status: "pass" | "warn" | "fail") {
  if (status === "fail") return "bg-rose-100 text-rose-950";
  if (status === "warn") return "bg-amber-100 text-amber-950";
  return "bg-lime-300 text-lime-950";
}

function constitutionPillStyle(status: "pass" | "warn" | "fail") {
  const base = "rounded px-2 py-1 text-xs font-semibold";
  if (status === "fail") return `${base} bg-rose-300 text-rose-950`;
  if (status === "warn") return `${base} bg-amber-300 text-amber-950`;
  return `${base} bg-lime-300 text-lime-950`;
}

function GapStatusPill({ status }: { status: "covered" | "partial" | "gap" }) {
  const styles = {
    covered: "bg-lime-100 text-lime-900",
    partial: "bg-amber-100 text-amber-900",
    gap: "bg-rose-100 text-rose-900",
  };
  return (
    <span className={`rounded px-2 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function aestheticSmokeStatusStyle(status: "pass" | "fail" | "missing") {
  const base = "inline-flex h-9 w-fit items-center rounded-md px-3 text-sm font-semibold";
  if (status === "pass") return `${base} bg-lime-100 text-lime-950`;
  if (status === "fail") return `${base} bg-rose-100 text-rose-950`;
  return `${base} bg-amber-100 text-amber-950`;
}

function repairQueueStatusStyle(status: string) {
  const base = "inline-flex h-9 w-fit items-center rounded-md px-3 text-sm font-semibold";
  if (status === "pass") return `${base} bg-lime-100 text-lime-950`;
  if (status === "fail") return `${base} bg-rose-100 text-rose-950`;
  return `${base} bg-amber-100 text-amber-950`;
}

function worldlineCoverageStatusStyle(status: string) {
  const base = "inline-flex h-9 w-fit items-center rounded-md px-3 text-sm font-semibold";
  if (status === "pass") return `${base} bg-lime-100 text-lime-950`;
  return `${base} bg-amber-100 text-amber-950`;
}

function forkCompatibilityStatusStyle(status: string) {
  const base = "inline-flex h-9 w-fit items-center rounded-md px-3 text-sm font-semibold";
  if (status === "pass") return `${base} bg-lime-100 text-lime-950`;
  if (status === "fail") return `${base} bg-rose-100 text-rose-950`;
  return `${base} bg-amber-100 text-amber-950`;
}

function evidenceBundleStatusStyle(status: string) {
  const base = "inline-flex h-9 w-fit items-center rounded-md px-3 text-sm font-semibold";
  if (status === "pass") return `${base} bg-lime-100 text-lime-950`;
  if (status === "fail") return `${base} bg-rose-100 text-rose-950`;
  return `${base} bg-amber-100 text-amber-950`;
}

function horizonStatusStyle(status: string) {
  const base = "inline-flex h-9 w-fit items-center rounded-md px-3 text-sm font-semibold";
  if (status === "pass") return `${base} bg-lime-100 text-lime-950`;
  if (status === "watch") return `${base} bg-violet-100 text-violet-950`;
  return `${base} bg-amber-100 text-amber-950`;
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

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 102.4) / 10} KB`;
  return `${Math.round(value / 1024 / 102.4) / 10} MB`;
}

function shortHash(value: string | null | undefined) {
  if (!value) return "none";
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-6)}` : value;
}
