"use client";

import { useMemo, useState } from "react";
import { GitMerge, Link2, Sparkles, Upload, X } from "lucide-react";
import { edgeRelations, phases, type EdgeRelation, type Phase } from "@/lib/domain";
import { parseImportFragments, type ImportCandidate } from "@/lib/importFragments";
import {
  buildImportReviewItems,
  type ImportReviewAction,
} from "@/lib/importReview";
import { type ReferenceNode } from "@/lib/resonance";
import { commitImportCandidatesAction } from "@/server/actions";

type CandidateDraft = {
  title: string;
  body: string;
  phase: Phase;
  emotionHa: number;
  tags: string;
  action: ImportReviewAction;
  targetNodeId: string;
  edgeToNodeId: string;
  relation: EdgeRelation;
  weight: number;
};

type DraftOverride = Partial<CandidateDraft>;

const actionLabels: Record<ImportReviewAction, string> = {
  create: "Create selected",
  merge: "Merge into existing",
  edge: "Create edge only",
  dismiss: "Dismiss selected",
};

function tagsFromText(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

function payloadFromDraft(draft: CandidateDraft) {
  return {
    action: draft.action,
    candidate: {
      title: draft.title,
      body: draft.body,
      phase: draft.phase,
      emotionHa: draft.emotionHa,
      tags: tagsFromText(draft.tags),
    } satisfies ImportCandidate,
    targetNodeId: draft.targetNodeId || undefined,
    edgeToNodeId: draft.edgeToNodeId || undefined,
    relation: draft.relation,
    weight: draft.weight,
  };
}

export function ImportPreviewer({
  referenceNodes,
}: {
  referenceNodes: ReferenceNode[];
}) {
  const [text, setText] = useState("");
  const [overrides, setOverrides] = useState<Record<number, DraftOverride>>({});
  const candidates = useMemo(() => parseImportFragments(text), [text]);
  const reviewItems = useMemo(
    () => buildImportReviewItems(candidates, referenceNodes),
    [candidates, referenceNodes],
  );

  function updateDraft(index: number, patch: DraftOverride) {
    setOverrides((current) => ({
      ...current,
      [index]: { ...current[index], ...patch },
    }));
  }

  function draftFor(index: number): CandidateDraft {
    const item = reviewItems[index];
    const override = overrides[index] ?? {};
    const targetNodeId =
      override.targetNodeId ??
      item.targetNodeId ??
      item.matches[0]?.nodeId ??
      "";
    const edgeToNodeId =
      override.edgeToNodeId ??
      item.edgeToNodeId ??
      item.matches.find((match) => match.nodeId !== targetNodeId)?.nodeId ??
      "";

    return {
      title: override.title ?? item.candidate.title,
      body: override.body ?? item.candidate.body,
      phase: override.phase ?? item.candidate.phase,
      emotionHa: override.emotionHa ?? item.candidate.emotionHa,
      tags: override.tags ?? item.candidate.tags.join(", "),
      action: override.action ?? item.action,
      targetNodeId,
      edgeToNodeId,
      relation: override.relation ?? item.relation,
      weight: override.weight ?? item.weight,
    };
  }

  const counts = reviewItems.reduce(
    (summary, _, index) => {
      summary[draftFor(index).action] += 1;
      return summary;
    },
    { create: 0, merge: 0, edge: 0, dismiss: 0 } as Record<
      ImportReviewAction,
      number
    >,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setOverrides({});
        }}
        rows={18}
        placeholder="Paste conversation residue here..."
        className="min-h-[420px] rounded-lg border border-stone-300 bg-white p-4 leading-7 outline-none ring-lime-300 transition focus:ring-2"
      />
      <form
        action={commitImportCandidatesAction}
        className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Review queue</h2>
            <p className="mt-1 text-sm text-stone-600">
              Edit candidates, choose their fate, then commit the batch.
            </p>
          </div>
          <span className="rounded-md bg-stone-100 px-2 py-1 text-sm text-stone-700">
            {reviewItems.length} candidates
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <span className="rounded-md bg-lime-100 px-2 py-1 text-lime-950">
            create {counts.create}
          </span>
          <span className="rounded-md bg-cyan-100 px-2 py-1 text-cyan-950">
            merge {counts.merge}
          </span>
          <span className="rounded-md bg-amber-100 px-2 py-1 text-amber-950">
            edge {counts.edge}
          </span>
          <span className="rounded-md bg-stone-100 px-2 py-1 text-stone-700">
            dismiss {counts.dismiss}
          </span>
        </div>

        <div className="mt-4 grid max-h-[620px] gap-3 overflow-auto pr-1">
          {reviewItems.length === 0 ? (
            <p className="rounded-md bg-stone-50 p-4 text-sm text-stone-600">
              Paste text to generate an editable import review queue.
            </p>
          ) : (
            reviewItems.map((item, index) => {
              const draft = draftFor(index);
              const payload = payloadFromDraft(draft);
              return (
                <section
                  key={item.id}
                  className="grid gap-3 rounded-md border border-stone-200 p-3"
                >
                  <input
                    type="hidden"
                    name="reviewItem"
                    value={JSON.stringify(payload)}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                      <Sparkles size={14} aria-hidden />
                      Candidate {index + 1}
                    </span>
                    <select
                      aria-label={`Action for candidate ${index + 1}`}
                      value={draft.action}
                      onChange={(event) =>
                        updateDraft(index, {
                          action: event.target.value as ImportReviewAction,
                        })
                      }
                      className="h-9 rounded-md border border-stone-300 bg-white px-2 text-sm"
                    >
                      {Object.entries(actionLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="grid gap-1 text-sm font-medium">
                    Title
                    <input
                      aria-label={`Title for candidate ${index + 1}`}
                      value={draft.title}
                      onChange={(event) =>
                        updateDraft(index, { title: event.target.value })
                      }
                      className="h-10 rounded-md border border-stone-300 px-3 font-normal"
                    />
                  </label>

                  <label className="grid gap-1 text-sm font-medium">
                    Body
                    <textarea
                      aria-label={`Body for candidate ${index + 1}`}
                      value={draft.body}
                      onChange={(event) =>
                        updateDraft(index, { body: event.target.value })
                      }
                      rows={4}
                      className="rounded-md border border-stone-300 px-3 py-2 font-normal leading-6"
                    />
                  </label>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="grid gap-1 text-sm font-medium">
                      Phase
                      <select
                        aria-label={`Phase for candidate ${index + 1}`}
                        value={draft.phase}
                        onChange={(event) =>
                          updateDraft(index, {
                            phase: event.target.value as Phase,
                          })
                        }
                        className="h-10 rounded-md border border-stone-300 bg-white px-2 font-normal"
                      >
                        {phases.map((phase) => (
                          <option key={phase} value={phase}>
                            {phase}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-medium">
                      Ha
                      <input
                        aria-label={`Ha for candidate ${index + 1}`}
                        type="number"
                        min={0}
                        max={10}
                        step={1}
                        value={draft.emotionHa}
                        onChange={(event) =>
                          updateDraft(index, {
                            emotionHa: Number(event.target.value),
                          })
                        }
                        className="h-10 rounded-md border border-stone-300 px-3 font-normal"
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium">
                      Tags
                      <input
                        aria-label={`Tags for candidate ${index + 1}`}
                        value={draft.tags}
                        onChange={(event) =>
                          updateDraft(index, { tags: event.target.value })
                        }
                        className="h-10 rounded-md border border-stone-300 px-3 font-normal"
                      />
                    </label>
                  </div>

                  {draft.action === "merge" || draft.action === "edge" ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="grid gap-1 text-sm font-medium">
                        {draft.action === "edge" ? "From node" : "Merge into"}
                        <select
                          aria-label={`Target node for candidate ${index + 1}`}
                          value={draft.targetNodeId}
                          onChange={(event) =>
                            updateDraft(index, {
                              targetNodeId: event.target.value,
                            })
                          }
                          className="h-10 rounded-md border border-stone-300 bg-white px-2 font-normal"
                        >
                          <option value="">Choose node</option>
                          {referenceNodes.map((node) => (
                            <option key={node.id} value={node.id}>
                              {node.title}
                            </option>
                          ))}
                        </select>
                      </label>

                      {draft.action === "edge" ? (
                        <label className="grid gap-1 text-sm font-medium">
                          To node
                          <select
                            aria-label={`Edge target for candidate ${index + 1}`}
                            value={draft.edgeToNodeId}
                            onChange={(event) =>
                              updateDraft(index, {
                                edgeToNodeId: event.target.value,
                              })
                            }
                            className="h-10 rounded-md border border-stone-300 bg-white px-2 font-normal"
                          >
                            <option value="">Choose node</option>
                            {referenceNodes.map((node) => (
                              <option key={node.id} value={node.id}>
                                {node.title}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </div>
                  ) : null}

                  {draft.action === "edge" ? (
                    <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                      <label className="grid gap-1 text-sm font-medium">
                        Relation
                        <select
                          aria-label={`Relation for candidate ${index + 1}`}
                          value={draft.relation}
                          onChange={(event) =>
                            updateDraft(index, {
                              relation: event.target.value as EdgeRelation,
                            })
                          }
                          className="h-10 rounded-md border border-stone-300 bg-white px-2 font-normal"
                        >
                          {edgeRelations.map((relation) => (
                            <option key={relation} value={relation}>
                              {relation}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm font-medium">
                        Weight
                        <input
                          aria-label={`Weight for candidate ${index + 1}`}
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={draft.weight}
                          onChange={(event) =>
                            updateDraft(index, {
                              weight: Number(event.target.value),
                            })
                          }
                          className="h-10 rounded-md border border-stone-300 px-3 font-normal"
                        />
                      </label>
                    </div>
                  ) : null}

                  {item.matches.length ? (
                    <div className="grid gap-2">
                      {item.matches.map((match) => (
                        <div
                          key={match.nodeId}
                          className="rounded-md border border-cyan-200 bg-cyan-50 p-2 text-xs leading-5 text-cyan-950"
                        >
                          <span className="font-semibold">
                            {match.kind === "duplicate"
                              ? "Possible duplicate"
                              : "Resonates"}
                          </span>
                          {": "}
                          {match.title} · {Math.round(match.score * 100)}%
                          {match.sharedTerms.length
                            ? ` · ${match.sharedTerms.join(", ")}`
                            : ""}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="grid gap-1 rounded-md bg-stone-50 p-3 text-xs leading-5 text-stone-600">
                    {item.explanations.map((explanation) => (
                      <span key={explanation}>{explanation}</span>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={reviewItems.length === 0}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            <Upload size={16} aria-hidden />
            Commit Review Actions
          </button>
          {reviewItems.length ? (
            <button
              type="button"
              onClick={() => {
                const next: Record<number, DraftOverride> = {};
                reviewItems.forEach((_, index) => {
                  next[index] = { ...overrides[index], action: "dismiss" };
                });
                setOverrides(next);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-700"
            >
              <X size={16} aria-hidden />
              Dismiss All
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1">
            <GitMerge size={14} aria-hidden />
            Merge keeps phase history on the target node.
          </span>
          <span className="inline-flex items-center gap-1">
            <Link2 size={14} aria-hidden />
            Edge-only actions create relations without adding a node.
          </span>
        </div>
      </form>
    </div>
  );
}
