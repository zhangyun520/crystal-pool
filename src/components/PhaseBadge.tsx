import { type Phase } from "@/lib/domain";

const phaseClasses: Record<Phase, string> = {
  gas: "border-sky-200 bg-sky-50 text-sky-800",
  liquid: "border-teal-200 bg-teal-50 text-teal-800",
  seed: "border-lime-300 bg-lime-100 text-lime-900",
  crystal: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
  fossil: "border-stone-300 bg-stone-200 text-stone-800",
  dissolved: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

export function PhaseBadge({ phase }: { phase: Phase }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold uppercase ${phaseClasses[phase]}`}
    >
      {phase}
    </span>
  );
}
