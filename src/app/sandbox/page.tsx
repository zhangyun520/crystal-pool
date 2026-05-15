import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  FileText,
  FlaskConical,
  GitPullRequest,
  ListChecks,
  Play,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  sandboxModeDetails,
  type SandboxMode,
  type SandboxOutput,
} from "@/lib/sandbox";
import { type SandboxRunRecord } from "@/lib/sandboxRun";
import { worldlineKeys } from "@/lib/worldline";
import {
  archiveSandboxRunAction,
  getSandboxDashboardFromSearchParams,
  promoteSandboxLearningAction,
  startFugueScenarioAction,
  startSandboxRunAction,
} from "@/server/sandboxDashboard";

export const dynamic = "force-dynamic";

function protocolEntries(
  modes: Awaited<ReturnType<typeof getSandboxDashboardFromSearchParams>>["modes"],
) {
  return Object.entries(modes) as Array<[SandboxMode, (typeof modes)[SandboxMode]]>;
}

function SandboxOutputCard({ output }: { output: SandboxOutput }) {
  if (output.kind === "failure_path") {
    return (
      <article className="rounded-md border border-stone-200 bg-stone-50 p-4">
        <h3 className="font-semibold">Fugue Failure Path</h3>
        <dl className="mt-3 grid gap-3 text-sm">
          <OutputItem label="Mechanism" value={output.mechanism} />
          <OutputItem label="Exploit Vector" value={output.exploitVector} />
          <OutputItem label="Observed Failure" value={output.observedFailure} />
          <OutputItem label="Proposed Patch" value={output.proposedPatch} />
        </dl>
      </article>
    );
  }

  if (output.kind === "development_arc") {
    return (
      <article className="rounded-md border border-stone-200 bg-stone-50 p-4">
        <h3 className="font-semibold">Sonata Development Arc</h3>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          <OutputBlock
            label="Exposition"
            value={`${output.sections.exposition.theme}${
              output.sections.exposition.counterTheme
                ? ` / ${output.sections.exposition.counterTheme}`
                : ""
            }`}
          />
          <OutputList
            label="Development"
            values={output.sections.development.tensions}
          />
          <OutputBlock
            label="Recapitulation"
            value={output.sections.recapitulation.transformedTheme}
          />
          <OutputBlock
            label="Coda"
            value={output.sections.coda.proposedRevision}
          />
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-md border border-stone-200 bg-stone-50 p-4">
      <h3 className="font-semibold">Symphony Systemic Diagnosis</h3>
      <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
        <OutputBlock label="Opening State" value={output.movements.openingState} />
        <OutputBlock label="First Shock" value={output.movements.firstShock} />
        <OutputBlock label="Escalation" value={output.movements.escalation} />
        <OutputBlock label="Counterpoint" value={output.movements.counterpoint} />
        <OutputBlock
          label="Collapse or Stabilization"
          value={output.movements.collapseOrStabilization}
        />
        <OutputList label="Lessons" values={output.movements.lessons} />
        <section className="md:col-span-2">
          <h4 className="font-medium text-stone-500">Constitutional Patch</h4>
          <p className="mt-1 text-stone-800">
            {output.movements.constitutionalPatch ?? "None recorded."}
          </p>
        </section>
      </div>
    </article>
  );
}

export default async function SandboxPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string | string[] }>;
}) {
  const dashboard = await getSandboxDashboardFromSearchParams(searchParams);
  const selectedRun = dashboard.selectedRun;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-stone-500">
            Crystal Sandbox
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Fugue, Sonata, and Symphony rehearsals.
          </h1>
          <p className="mt-2 max-w-3xl text-stone-600">
            Three first-class protocols: failure path, developmental arc, and
            systemic survival rehearsal.
          </p>
        </div>
        <Link
          href="/flow?pool=fugue"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 shadow-sm"
        >
          <FlaskConical size={16} aria-hidden />
          Sandbox Flow
        </Link>
      </div>

      <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} aria-hidden className="mt-0.5 shrink-0" />
          <p>
            Sandbox events are replayable rehearsals, not canonical truth. The
            bridge back to the real pool is an explicit learning proposal.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-4">
        <MetricCard label="Runs" value={dashboard.summary.totalRuns} detail="all sandbox protocols" />
        <MetricCard label="Fugue" value={dashboard.summary.byMode.FUGUE} detail="failure rehearsal" />
        <MetricCard label="Sonata" value={dashboard.summary.byMode.SONATA} detail="theme maturation" />
        <MetricCard label="Symphony" value={dashboard.summary.byMode.SYMPHONY} detail="world rehearsal" />
      </section>

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Sandbox Protocols</h2>
            <p className="mt-1 text-sm text-stone-600">
              Each mode carries its own validation, output kind, report
              template, replay shape, and learning policy.
            </p>
          </div>
          <span className="rounded-md bg-stone-950 px-2 py-1 text-xs font-semibold text-white">
            first-class modes
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {protocolEntries(dashboard.modes).map(([mode, detail]) => {
            const protocol = dashboard.protocols[mode];
            return (
              <article
                key={mode}
                className="rounded-md border border-stone-200 bg-stone-50 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">
                    {detail.label} / {detail.nativeLabel}
                  </h3>
                  <span className="rounded-md bg-white px-2 py-1 font-mono text-xs text-stone-600">
                    {mode}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-600">{detail.description}</p>
                <p className="mt-2 text-xs font-medium text-stone-500">
                  {protocol.outputKind} · {protocol.reportTemplate} report
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Worldline Protocols</h2>
            <p className="mt-1 text-sm text-stone-600">
              Worldlines are horizontal rehearsal archetypes. They combine with
              Fugue, Sonata, or Symphony without replacing mode semantics.
            </p>
          </div>
          <span className="rounded-md bg-lime-50 px-2 py-1 text-xs font-semibold text-lime-900">
            observe + propose
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {worldlineKeys.map((key) => {
            const detail = dashboard.worldlines[key];
            return (
              <article
                key={key}
                className="rounded-md border border-stone-200 bg-stone-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{detail.label}</h3>
                    <p className="text-xs text-stone-500">{detail.nativeLabel}</p>
                  </div>
                  <span className="rounded-md bg-white px-2 py-1 font-mono text-xs text-stone-600">
                    {dashboard.summary.byWorldline[key] ?? 0}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {detail.purpose}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <ProtocolForm
          mode="FUGUE"
          title="Fugue / 赋格"
          submitLabel="Run Fugue"
          fields={
            <>
              <input type="hidden" name="mode" value="FUGUE" />
              <TextInput name="title" label="Title" placeholder="Witness failure path" />
              <TextInput
                name="targetMechanism"
                label="Mechanism or node"
                required
                placeholder="Witness"
              />
              <TextArea
                name="exploitVector"
                label="Exploit vector"
                placeholder="Distorted incentives turn witness into surveillance."
              />
              <TextArea
                name="observedFailure"
                label="Observed failure"
                placeholder="Reviewers defer responsibility and the Pool becomes passive."
              />
              <TextArea
                name="proposedPatch"
                label="Proposed patch"
                placeholder="Cap review weight and require human traceability."
              />
            </>
          }
        />

        <ProtocolForm
          mode="SONATA"
          title="Sonata / 奏鸣"
          submitLabel="Run Sonata"
          fields={
            <>
              <input type="hidden" name="mode" value="SONATA" />
              <TextInput name="title" label="Title" placeholder="AI responsibility Sonata" />
              <TextArea
                name="theme"
                label="Theme"
                required
                placeholder="AI should participate in meaning crystallization."
              />
              <TextArea
                name="counterTheme"
                label="Counter-theme"
                placeholder="AI should not own human responsibility currencies."
              />
              <TextArea
                name="proposedRevision"
                label="Coda revision"
                placeholder="AI may propose edges, but cannot finalize edges."
              />
              <TextArea
                name="rfcDraft"
                label="RFC draft"
                placeholder="RFC: AI output remains traceable and capped."
              />
            </>
          }
        />

        <ProtocolForm
          mode="SYMPHONY"
          title="Symphony / 交响"
          submitLabel="Run Symphony"
          fields={
            <>
              <input type="hidden" name="mode" value="SYMPHONY" />
              <TextInput name="title" label="Title" placeholder="Reviewer cascade" />
              <TextArea
                name="inputMechanisms"
                label="Mechanisms"
                required
                placeholder={"AI Review\nWitness"}
              />
              <TextArea
                name="inputActors"
                label="Actors or groups"
                placeholder={"human reviewers\nAI reviewers"}
              />
              <TextArea
                name="firstShock"
                label="First shock"
                placeholder="AI reviewers become too trusted during a public controversy."
              />
              <TextArea
                name="constitutionalPatch"
                label="Constitutional patch"
                placeholder="Cross-mechanism cascades require constitutional review."
              />
            </>
          }
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ListChecks size={18} aria-hidden />
            <h2 className="text-xl font-semibold">Run List</h2>
          </div>
          <div className="mt-4 grid gap-2">
            {dashboard.runs.length === 0 ? (
              <p className="rounded-md border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                No sandbox runs yet.
              </p>
            ) : (
              dashboard.runs.map((run) => (
                <Link
                  key={run.id}
                  href={`/sandbox?run=${run.id}`}
                  className={`rounded-md border p-3 text-sm transition ${
                    selectedRun?.id === run.id
                      ? "border-stone-950 bg-stone-950 text-white"
                      : "border-stone-200 bg-stone-50 hover:bg-stone-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{run.title}</span>
                    <span className="font-mono text-xs">{run.mode}</span>
                  </div>
                  <p className="mt-1 text-xs opacity-75">
                    {run.status} · {run.events.length} events
                    {run.worldlineKey ? ` · ${run.worldlineKey}` : ""}
                  </p>
                </Link>
              ))
            )}
          </div>
        </aside>

        <RunDetail run={selectedRun} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Scenario Gallery</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {dashboard.scenarios.map((scenario) => (
              <article
                key={scenario.key}
                className="rounded-md border border-stone-200 bg-stone-50 p-4"
              >
                <h3 className="font-semibold">{scenario.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {scenario.premise}
                </p>
                <p className="mt-2 text-sm font-medium text-rose-800">
                  {scenario.danger}
                </p>
                <form action={startFugueScenarioAction} className="mt-4 flex gap-2">
                  <input type="hidden" name="scenarioKey" value={scenario.key} />
                  <input
                    name="seed"
                    type="number"
                    min={1}
                    max={999999}
                    defaultValue={42}
                    className="h-10 w-28 rounded-md border border-stone-300 px-3 text-sm"
                    aria-label={`${scenario.title} seed`}
                  />
                  <button className="inline-flex h-10 items-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white">
                    <Play size={15} aria-hidden />
                    Start
                  </button>
                </form>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Learning Proposals</h2>
          <div className="mt-4 grid gap-3">
            {dashboard.learnings.length === 0 ? (
              <p className="text-sm text-stone-500">No sandbox learnings yet.</p>
            ) : (
              dashboard.learnings.map((learning) => (
                <article key={learning.id} className="rounded-md bg-stone-50 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{learning.title}</h3>
                    <span className="rounded-md bg-white px-2 py-1 text-xs text-stone-600">
                      {learning.status}
                    </span>
                  </div>
                  <p className="mt-1 leading-6 text-stone-600">{learning.body}</p>
                  {learning.status === "proposed" ? (
                    <form action={promoteSandboxLearningAction} className="mt-3">
                      <input type="hidden" name="learningId" value={learning.id} />
                      <button className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700">
                        <GitPullRequest size={14} aria-hidden />
                        Promote Learning
                      </button>
                    </form>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function RunDetail({ run }: { run?: SandboxRunRecord }) {
  if (!run) {
    return (
      <section className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
        No run selected.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-stone-500">
            {sandboxModeDetails[run.mode].label} Run Detail
          </p>
          <h2 className="mt-1 text-xl font-semibold">{run.title}</h2>
          <p className="mt-1 text-sm text-stone-600">
            {run.description ?? sandboxModeDetails[run.mode].description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge run={run} />
          {run.status === "completed" ? (
            <span className="inline-flex h-8 items-center gap-1 rounded-md bg-lime-50 px-2 text-xs font-semibold text-lime-900">
              <CheckCircle2 size={13} aria-hidden />
              immutable
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <DetailPill label="Mode" value={`${run.mode} / ${sandboxModeDetails[run.mode].nativeLabel}`} />
        <DetailPill label="Current tick" value={run.currentTick} />
        <DetailPill label="Inputs" value={run.inputMechanisms?.length ?? 0} />
      </div>

      {run.worldlineKey ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <DetailPill label="Worldline" value={run.worldlineKey} />
          <DetailPill label="Source JiEvents" value={run.sourceJiEventIds.length} />
          <DetailPill label="Mainline gate" value="review only" />
        </div>
      ) : null}

      {run.worldlineHypothesis || run.responsibilityQuestion ? (
        <div className="mt-3 rounded-md border border-lime-100 bg-lime-50 p-3 text-sm text-lime-950">
          {run.worldlineHypothesis ? (
            <p>
              <span className="font-semibold">Hypothesis:</span>{" "}
              {run.worldlineHypothesis}
            </p>
          ) : null}
          {run.responsibilityQuestion ? (
            <p className="mt-2">
              <span className="font-semibold">Responsibility:</span>{" "}
              {run.responsibilityQuestion}
            </p>
          ) : null}
        </div>
      ) : null}

      {run.status !== "archived" ? (
        <form action={archiveSandboxRunAction} className="mt-4 flex flex-wrap gap-2">
          <input type="hidden" name="runId" value={run.id} />
          <input
            name="reason"
            placeholder="archive note"
            className="h-9 min-w-56 rounded-md border border-stone-300 px-3 text-sm"
          />
          <button className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700">
            <Archive size={14} aria-hidden />
            Archive
          </button>
        </form>
      ) : null}

      <div className="mt-6">
        <h3 className="font-semibold">Replay Timeline</h3>
        <div className="mt-3 grid gap-2">
          {run.events.length === 0 ? (
            <p className="rounded-md border border-dashed border-stone-300 p-4 text-sm text-stone-500">
              No replay events recorded.
            </p>
          ) : (
            run.events.map((event) => (
              <article
                key={event.id}
                className="grid gap-3 rounded-md bg-stone-50 p-3 text-sm md:grid-cols-[76px_180px_minmax(0,1fr)]"
              >
                <span className="font-mono text-stone-500">t{event.tick}</span>
                <span className="font-semibold">{event.title}</span>
                <span className="leading-6 text-stone-600">{event.detail}</span>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-start gap-3">
          <FileText size={18} aria-hidden className="mt-1 shrink-0 text-stone-500" />
          <div>
            <h3 className="font-semibold">Mode-Specific Output</h3>
            <p className="mt-1 text-sm text-stone-600">
              {sandboxModeDetails[run.mode].philosophy}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {run.outputs.length ? (
            run.outputs.map((output, index) => (
              <SandboxOutputCard key={`${output.kind}-${index}`} output={output} />
            ))
          ) : (
            <p className="rounded-md border border-dashed border-stone-300 p-5 text-sm text-stone-500">
              No structured sandbox output recorded.
            </p>
          )}
        </div>
        {run.diagnostics.length ? (
          <div className="mt-4 grid gap-2">
            {run.diagnostics.map((diagnostic) => (
              <p
                key={`${diagnostic.level}-${diagnostic.title}`}
                className="rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-700"
              >
                <span className="font-semibold">{diagnostic.title}:</span>{" "}
                {diagnostic.detail}
              </p>
            ))}
          </div>
        ) : null}
        {run.reportMarkdown ? (
          <pre className="mt-4 max-h-96 overflow-auto rounded-md bg-stone-950 p-4 text-xs leading-6 text-stone-100">
            {run.reportMarkdown}
          </pre>
        ) : null}
      </div>
    </section>
  );
}

function ProtocolForm({
  mode,
  title,
  submitLabel,
  fields,
}: {
  mode: SandboxMode;
  title: string;
  submitLabel: string;
  fields: React.ReactNode;
}) {
  return (
    <form
      action={startSandboxRunAction}
      className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-stone-600">
            {sandboxModeDetails[mode].description}
          </p>
        </div>
        <span className="rounded-md bg-stone-100 px-2 py-1 font-mono text-xs text-stone-600">
          {mode}
        </span>
      </div>
      <div className="mt-4 grid gap-3">{fields}</div>
      <WorldlineFields />
      <button className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white">
        <Play size={15} aria-hidden />
        {submitLabel}
      </button>
    </form>
  );
}

function WorldlineFields() {
  return (
    <div className="mt-4 grid gap-3 rounded-md border border-lime-100 bg-lime-50 p-3">
      <label className="grid gap-1 text-sm font-medium text-lime-950">
        Worldline
        <select
          name="worldlineKey"
          className="h-10 rounded-md border border-lime-200 bg-white px-3 text-sm text-stone-950"
          defaultValue=""
        >
          <option value="">No worldline</option>
          {worldlineKeys.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </label>
      <TextArea
        name="worldlineHypothesis"
        label="Worldline hypothesis"
        placeholder="Hope is operational repair capacity, not mood."
      />
      <TextArea
        name="responsibilityQuestion"
        label="Responsibility question"
        placeholder="What proof would justify review without automatic unlock?"
      />
      <TextInput
        name="sourceJiEventIds"
        label="Source JiEvent IDs"
        placeholder="ji-001, ji-002"
      />
    </div>
  );
}

function TextInput({
  name,
  label,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-stone-700">
      {label}
      <input
        name={name}
        required={required}
        className="h-10 rounded-md border border-stone-300 px-3 text-sm"
        placeholder={placeholder}
      />
    </label>
  );
}

function TextArea({
  name,
  label,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-stone-700">
      {label}
      <textarea
        name={name}
        required={required}
        className="min-h-20 rounded-md border border-stone-300 px-3 py-2 text-sm"
        placeholder={placeholder}
      />
    </label>
  );
}

function OutputItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="font-medium text-stone-500">{label}</dt>
      <dd className="mt-1 text-stone-800">{value ?? "None recorded."}</dd>
    </div>
  );
}

function OutputBlock({ label, value }: { label: string; value?: string }) {
  return (
    <section>
      <h4 className="font-medium text-stone-500">{label}</h4>
      <p className="mt-1 text-stone-800">{value ?? "None recorded."}</p>
    </section>
  );
}

function OutputList({ label, values }: { label: string; values: string[] }) {
  return (
    <section>
      <h4 className="font-medium text-stone-500">{label}</h4>
      <ul className="mt-1 grid gap-1 text-stone-800">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </section>
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

function DetailPill({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md bg-stone-50 p-3 text-sm">
      <p className="text-stone-500">{label}</p>
      <p className="mt-1 font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function StatusBadge({ run }: { run: SandboxRunRecord }) {
  const classes =
    run.status === "completed"
      ? "bg-lime-100 text-lime-950"
      : run.status === "archived"
        ? "bg-stone-200 text-stone-700"
        : run.status === "running"
          ? "bg-cyan-100 text-cyan-950"
          : "bg-amber-100 text-amber-950";
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${classes}`}>
      {run.status}
    </span>
  );
}
