"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { AlertTriangle, CheckCircle2, FileJson, RotateCcw } from "lucide-react";
import {
  inspectCrystalPoolBackupText,
  type BackupInspectionResult,
} from "@/lib/backup";

function PreviewCounts({ result }: { result: BackupInspectionResult }) {
  const report = result.report;
  const counts = [
    { label: "nodes", value: report.counts.nodes },
    { label: "active", value: report.activeNodes },
    { label: "archived", value: report.archivedNodes },
    { label: "edges", value: report.counts.edges },
    { label: "tags", value: report.counts.tags },
    { label: "events", value: report.counts.phaseEvents },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {counts.map((item) => (
        <div key={item.label} className="rounded-md bg-white p-3">
          <p className="text-xl font-semibold text-stone-950">{item.value}</p>
          <p className="mt-1 text-xs text-stone-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function IssueList({
  title,
  issues,
  tone,
}: {
  title: string;
  issues: BackupInspectionResult["report"]["errors"];
  tone: "error" | "warning";
}) {
  if (issues.length === 0) return null;
  const toneClass =
    tone === "error" ? "bg-rose-50 text-rose-950" : "bg-amber-50 text-amber-950";
  return (
    <div className={`rounded-md p-3 text-sm ${toneClass}`}>
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 grid gap-2">
        {issues.slice(0, 5).map((issue) => (
          <li key={`${issue.table}-${issue.id ?? issue.message}`}>
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BackupRestorePanel({
  restoreAction,
}: {
  restoreAction: (formData: FormData) => void | Promise<void>;
}) {
  const [backupJson, setBackupJson] = useState("");
  const [fileName, setFileName] = useState("");
  const [confirmRestore, setConfirmRestore] = useState(false);
  const preview = useMemo(() => {
    const trimmed = backupJson.trim();
    return trimmed ? inspectCrystalPoolBackupText(trimmed) : null;
  }, [backupJson]);
  const canRestore = Boolean(preview?.report.restorable && confirmRestore);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setBackupJson(await file.text());
    setConfirmRestore(false);
  }

  return (
    <section className="mt-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-normal text-stone-500">
        Local Restore
      </p>
      <h2 className="mt-3 text-2xl font-semibold">Restore From JSON</h2>
      <p className="mt-2 max-w-3xl leading-7 text-stone-600">
        Paste or choose a Crystal Pool backup JSON. The dry-run preview checks
        table counts, broken references, and warnings before the restore button
        can replace the local database.
      </p>

      <form action={restoreAction} className="mt-5 grid gap-4">
        <label className="grid gap-2 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-stone-950">
            <FileJson size={16} aria-hidden />
            Choose backup JSON file
          </span>
          <input
            aria-label="Choose backup JSON file"
            type="file"
            accept=".json,application/json"
            onChange={handleFile}
            className="text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-stone-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          {fileName ? (
            <span className="text-xs text-stone-500">Loaded {fileName}</span>
          ) : null}
        </label>

        <textarea
          name="backupJson"
          required
          rows={10}
          value={backupJson}
          onChange={(event) => {
            setBackupJson(event.target.value);
            setConfirmRestore(false);
          }}
          placeholder="Paste crystal-pool.backup.v1 JSON here..."
          className="rounded-md border border-stone-300 bg-white p-3 font-mono text-sm leading-6 outline-none ring-lime-300 transition focus:ring-2"
        />

        {preview ? (
          <div
            className={`grid gap-4 rounded-lg border p-4 ${
              preview.report.restorable
                ? "border-lime-200 bg-lime-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {preview.report.restorable ? (
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-lime-700"
                  size={18}
                  aria-hidden
                />
              ) : (
                <AlertTriangle
                  className="mt-0.5 shrink-0 text-rose-700"
                  size={18}
                  aria-hidden
                />
              )}
              <div>
                <h3 className="font-semibold text-stone-950">
                  Dry-run preview
                </h3>
                <p className="mt-1 text-sm leading-6 text-stone-700">
                  {preview.ok
                    ? "This backup is restorable. Confirm below before writing to the database."
                    : `Dry-run failed: ${preview.message}`}
                </p>
              </div>
            </div>
            <PreviewCounts result={preview} />
            <IssueList
              title="Blocking errors"
              issues={preview.report.errors}
              tone="error"
            />
            <IssueList
              title="Warnings"
              issues={preview.report.warnings}
              tone="warning"
            />
          </div>
        ) : (
          <p className="rounded-md bg-stone-50 p-3 text-sm text-stone-600">
            Paste or choose a JSON file to see the dry-run preview.
          </p>
        )}

        <label className="flex items-start gap-3 rounded-md bg-rose-50 p-3 text-sm leading-6 text-rose-950">
          <input
            name="confirmRestore"
            type="checkbox"
            required
            checked={confirmRestore}
            onChange={(event) => setConfirmRestore(event.target.checked)}
            className="mt-1 accent-rose-700"
          />
          <span>
            Replace the current local pool with this backup. Existing local
            nodes, edges, tags, and phase events will be removed before the
            backup is inserted.
          </span>
        </label>

        <button
          type="submit"
          disabled={!canRestore}
          className="inline-flex h-11 w-fit items-center gap-2 rounded-md border border-rose-300 px-4 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400 disabled:hover:bg-transparent"
        >
          <RotateCcw size={16} aria-hidden />
          Restore Backup
        </button>
      </form>
    </section>
  );
}
