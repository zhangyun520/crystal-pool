import { Save } from "lucide-react";
import {
  edgeRelations,
  phases,
  sourceTypes,
  type Phase,
  type SourceType,
} from "@/lib/domain";
import { EmotionVectorEditor } from "./EmotionVectorEditor";

type NodeFormNode = {
  title: string;
  body: string;
  phase: Phase;
  entropyResistance: number;
  publicness: number;
  privateIntensity: number;
  emotionFear: number;
  emotionCuriosity: number;
  emotionJoy: number;
  emotionBoredom: number;
  emotionHa: number;
  sourceType: SourceType;
  sourceRef?: string | null;
  tags?: { tag: { name: string } }[];
};

export function NodeForm({
  action,
  node,
  submitLabel = "Save Fragment",
}: {
  action: (formData: FormData) => Promise<void>;
  node?: NodeFormNode;
  submitLabel?: string;
}) {
  const tagValue = node?.tags?.map((item) => item.tag.name).join(", ") ?? "";

  return (
    <form action={action} className="grid gap-6">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-stone-700" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={node?.title}
          className="h-11 rounded-md border border-stone-300 bg-white px-3 outline-none ring-lime-300 transition focus:ring-2"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-stone-700" htmlFor="body">
          Body
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={8}
          defaultValue={node?.body}
          className="rounded-md border border-stone-300 bg-white px-3 py-3 outline-none ring-lime-300 transition focus:ring-2"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">Phase</span>
          <select
            name="phase"
            defaultValue={node?.phase ?? "gas"}
            className="h-11 rounded-md border border-stone-300 bg-white px-3"
          >
            {phases.map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">Source</span>
          <select
            name="sourceType"
            defaultValue={node?.sourceType ?? "manual"}
            className="h-11 rounded-md border border-stone-300 bg-white px-3"
          >
            {sourceTypes.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">Source ref</span>
          <input
            name="sourceRef"
            defaultValue={node?.sourceRef ?? ""}
            className="h-11 rounded-md border border-stone-300 bg-white px-3"
          />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-stone-700">Tags</span>
        <input
          name="tags"
          defaultValue={tagValue}
          placeholder="机, 相变, ha"
          className="h-11 rounded-md border border-stone-300 bg-white px-3"
        />
      </label>
      <EmotionVectorEditor defaults={node} />
      <button
        type="submit"
        className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800"
      >
        <Save size={16} aria-hidden />
        {submitLabel}
      </button>
    </form>
  );
}

export function EdgeRelationSelect({
  defaultValue = "resonates_with",
}: {
  defaultValue?: (typeof edgeRelations)[number];
}) {
  return (
    <select
      name="relation"
      defaultValue={defaultValue}
      className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"
    >
      {edgeRelations.map((relation) => (
        <option key={relation} value={relation}>
          {relation}
        </option>
      ))}
    </select>
  );
}
