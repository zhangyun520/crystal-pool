import Link from "next/link";
import { Sparkles } from "lucide-react";
import { type HakimiSuggestion } from "@/lib/hakimi";
import { haSoftenAction } from "@/server/actions";

export function HakimiPanel({
  suggestions,
}: {
  suggestions: HakimiSuggestion[];
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles size={18} aria-hidden />
        <h2 className="text-lg font-semibold">Hakimi Watch</h2>
      </div>
      <div className="mt-4 grid gap-3">
        {suggestions.length === 0 ? (
          <p className="text-sm leading-6 text-stone-600">
            Pool looks pliable. No urgent anti-fossilization nudges right now.
          </p>
        ) : (
          suggestions.map((suggestion) => (
            <div
              key={suggestion.nodeId}
              className="rounded-md border border-amber-200 bg-amber-50 p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link
                    href={`/nodes/${suggestion.nodeId}`}
                    className="font-medium text-stone-950 hover:underline"
                  >
                    {suggestion.title}
                  </Link>
                  <p className="mt-1 text-sm text-stone-700">
                    {suggestion.reason}
                  </p>
                </div>
                <form action={haSoftenAction.bind(null, suggestion.nodeId)}>
                  <button
                    type="submit"
                    className="h-9 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white hover:bg-stone-800"
                  >
                    Ha Soften
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
