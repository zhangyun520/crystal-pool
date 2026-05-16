import {
  type PhaseSuggestion,
  type ScoreExplanation,
  type ScoreNowExplanation,
  type TimelineEvent,
} from "@/lib/meaningEngine";

function toneClass(tone: ScoreExplanation["tone"]) {
  if (tone === "positive") return "bg-lime-100 text-lime-950";
  if (tone === "negative") return "bg-rose-100 text-rose-950";
  return "bg-stone-100 text-stone-700";
}

export function ScoreBreakdownPanel({
  total,
  explanations,
  drivers,
}: {
  total: number;
  explanations: ScoreExplanation[];
  drivers: string[];
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Score Breakdown</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Deterministic reasons behind the current score.
          </p>
        </div>
        <span className="rounded-md bg-stone-950 px-3 py-2 text-sm font-semibold text-white">
          {Math.round(total)}
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {explanations.map((item) => (
          <div
            key={item.label}
            className="grid gap-2 rounded-md border border-stone-200 p-3 sm:grid-cols-[140px_72px_minmax(0,1fr)] sm:items-start"
          >
            <p className="font-medium text-stone-950">{item.label}</p>
            <span
              className={`w-fit rounded-md px-2 py-1 text-xs font-semibold ${toneClass(
                item.tone,
              )}`}
            >
              {item.value > 0 ? "+" : ""}
              {Math.round(item.value)}
            </span>
            <p className="text-sm leading-6 text-stone-600">{item.reason}</p>
          </div>
        ))}
      </div>
      {drivers.length ? (
        <div className="mt-4 rounded-md bg-stone-50 p-3 text-sm leading-6 text-stone-700">
          <p className="font-medium text-stone-950">Main drivers</p>
          <ul className="mt-2 grid gap-1">
            {drivers.map((driver) => (
              <li key={driver}>{driver}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function ScoreNowPanel({
  explanation,
}: {
  explanation: ScoreNowExplanation;
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Why This Score Now</h2>
      <p className="mt-2 text-sm leading-6 text-stone-700">
        {explanation.headline}
      </p>
      <p className="mt-2 rounded-md bg-stone-50 p-3 text-sm leading-6 text-stone-600">
        {explanation.phaseFit}
      </p>
      {explanation.lastChange ? (
        <div className="mt-4 rounded-md border border-stone-200 p-3 text-sm">
          <p className="font-medium text-stone-950">Last meaningful change</p>
          <p className="mt-1 leading-6 text-stone-600">
            {explanation.lastChange.label}: {explanation.lastChange.detail}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {new Date(explanation.lastChange.at).toLocaleString()}
          </p>
        </div>
      ) : null}
      <div className="mt-4 grid gap-2">
        {explanation.drivers.map((driver) => (
          <div
            key={driver.id}
            className="grid gap-2 rounded-md border border-stone-200 p-3 text-sm sm:grid-cols-[minmax(0,150px)_70px_minmax(0,1fr)]"
          >
            <div>
              <p className="font-medium text-stone-950">{driver.label}</p>
              <p className="mt-1 text-xs text-stone-500">{driver.kind}</p>
            </div>
            <span
              className={`h-fit w-fit rounded-md px-2 py-1 text-xs font-semibold ${toneClass(
                driver.tone,
              )}`}
            >
              {driver.value > 0 ? "+" : ""}
              {Math.round(driver.value)}
            </span>
            <p className="leading-6 text-stone-600">{driver.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PhaseSuggestionPanel({
  suggestions,
}: {
  suggestions: PhaseSuggestion[];
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Phase Suggestions</h2>
      <p className="mt-1 text-sm leading-6 text-stone-600">
        Suggestions only. The pool never changes phase without a user action.
      </p>
      <div className="mt-4 grid gap-3">
        {suggestions.length === 0 ? (
          <p className="rounded-md bg-stone-50 p-3 text-sm text-stone-500">
            No phase intervention is currently suggested.
          </p>
        ) : (
          suggestions.map((item) => (
            <div
              key={`${item.title}-${item.targetPhase}`}
              className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-stone-950">{item.title}</p>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-stone-600">
                  {item.severity}
                </span>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-stone-600">
                  {item.targetPhase}
                </span>
              </div>
              <p className="mt-2 leading-6 text-stone-700">{item.reason}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function MeaningTimelinePanel({
  events,
}: {
  events: TimelineEvent[];
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Why This Crystallized</h2>
      <div className="mt-4 grid gap-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-md border border-stone-200 p-3 text-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600">
                {event.kind}
              </span>
              <p className="font-medium text-stone-950">{event.title}</p>
            </div>
            <p className="mt-2 leading-6 text-stone-600">{event.detail}</p>
            <p className="mt-1 text-xs text-stone-500">
              {new Date(event.at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
