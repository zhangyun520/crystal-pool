"use client";

import { useMemo, useState } from "react";
import {
  createCorpusSnapshot,
  createMeaningMarks,
  summarizeMeaningMarks,
} from "@/lib/corpusTrail";
import {
  createJobManifest,
  serializeJsonl,
  type CrystalWorkerInput,
} from "@/lib/jobManifest";
import { type ReferenceNode } from "@/lib/resonance";

const sampleResidue =
  "意义是对抗时间的最小单位，这是核心结晶。\n\n哈哈，哈基米提醒系统松一下。\n\n当一个概念被反复触发，它会从涨落进入晶核。";
const previewCapturedAt = "2026-05-13T00:00:00.000Z";

export function CorpusMarkerPreviewer({
  referenceNodes,
}: {
  referenceNodes: ReferenceNode[];
}) {
  const [sourceRef, setSourceRef] = useState("manual:daily-residue");
  const [title, setTitle] = useState("Daily residue shard");
  const [body, setBody] = useState(sampleResidue);

  const snapshot = useMemo(() => {
    if (!body.trim()) return undefined;
    return createCorpusSnapshot({
      sourceKind: "manual",
      sourceRef,
      title,
      body,
      capturedAt: previewCapturedAt,
    });
  }, [body, sourceRef, title]);

  const marks = useMemo(
    () => (snapshot ? createMeaningMarks(snapshot, referenceNodes) : []),
    [referenceNodes, snapshot],
  );
  const summary = useMemo(() => summarizeMeaningMarks(marks), [marks]);
  const workerInput = useMemo<CrystalWorkerInput | undefined>(
    () =>
      snapshot
        ? {
            sourceKind: snapshot.sourceKind,
            sourceRef: snapshot.sourceRef,
            title: snapshot.title,
            body: snapshot.body,
            capturedAt: snapshot.capturedAt,
            license: snapshot.license,
          }
        : undefined,
    [snapshot],
  );
  const manifest = useMemo(
    () =>
      snapshot
        ? createJobManifest({
            goal: "Mark a local Crystal Pool corpus shard",
            workerTarget: "local",
            createdAt: snapshot.capturedAt,
            shards: [
              {
                id: snapshot.id,
                sourceKind: snapshot.sourceKind,
                sourceRef: snapshot.sourceRef,
                itemCount: 1,
                byteEstimate: new Blob([snapshot.body]).size,
              },
            ],
          })
        : undefined,
    [snapshot],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Local Corpus Marker</h2>
            <p className="mt-1 text-sm text-stone-600">
              Turn any licensed text shard into deterministic meaning marks
              before it becomes a node, edge, or phase event.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBody(sampleResidue)}
              className="h-10 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700"
            >
              Load Sample
            </button>
            <button
              type="button"
              onClick={() => setBody("")}
              className="h-10 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">
              Source ref
            </span>
            <input
              value={sourceRef}
              onChange={(event) => setSourceRef(event.target.value)}
              className="h-10 rounded-md border border-stone-300 px-3 text-sm"
              placeholder="https://example.com/page or manual:daily-residue"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-10 rounded-md border border-stone-300 px-3 text-sm"
              placeholder="Corpus shard title"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">Text</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={9}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm leading-6"
              placeholder="Paste licensed corpus text or conversation residue..."
            />
          </label>
        </div>
      </section>

      <aside className="grid gap-4">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Mark Summary</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Metric label="Marks" value={summary.total} />
            <Metric label="High ha" value={summary.highHa} />
            <Metric label="Duplicates" value={summary.duplicates} />
            <Metric label="Snapshot" value={snapshot?.id ?? "none"} />
          </div>
        </section>
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Worker JSONL</h2>
          <pre className="mt-3 max-h-64 overflow-auto rounded-md bg-stone-950 p-3 text-xs leading-5 text-stone-50">
            {workerInput ? serializeJsonl([workerInput]) : "[]"}
          </pre>
        </section>
      </aside>

      <section className="grid gap-4 xl:col-span-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Meaning Marks</h2>
            <p className="text-sm text-stone-600">
              Marks are suggestions only. They can later become import
              candidates, approved edges, or trajectory events.
            </p>
          </div>
          <p className="rounded-md bg-stone-100 px-3 py-2 text-sm text-stone-600">
            {manifest?.workerTarget ?? "local"} manifest ready
          </p>
        </div>

        {marks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
            Paste text to produce marks.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {marks.map((mark, index) => (
              <article
                key={mark.id}
                className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                      Mark {index + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {mark.title}
                    </h3>
                  </div>
                  <span className="rounded-md bg-lime-100 px-2 py-1 text-xs font-semibold text-lime-900">
                    {Math.round(mark.confidence * 100)}%
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-700">
                  {mark.body}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-stone-100 px-2 py-1">
                    phase: {mark.phase}
                  </span>
                  <span className="rounded-md bg-stone-100 px-2 py-1">
                    ha: {mark.emotionHa}
                  </span>
                  <span className="rounded-md bg-stone-100 px-2 py-1">
                    relation: {mark.suggestedRelation}
                  </span>
                </div>
                {mark.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mark.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-900"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <ul className="mt-4 grid gap-2 text-sm text-stone-600">
                  {mark.explanations.map((explanation) => (
                    <li key={explanation}>{explanation}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-stone-50 p-3">
      <p className="text-stone-500">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold">{value}</p>
    </div>
  );
}
