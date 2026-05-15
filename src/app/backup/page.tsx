import Link from "next/link";
import { AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BackupRestorePanel } from "@/components/BackupRestorePanel";
import { backupSchemaVersion, inspectCrystalPoolBackup } from "@/lib/backup";
import { restoreBackupAction } from "@/server/actions";
import { buildBackupData } from "@/server/backup";

export default async function BackupPage({
  searchParams,
}: {
  searchParams: Promise<{
    restored?: string;
    nodes?: string;
    restoreError?: string;
  }>;
}) {
  const params = await searchParams;
  const currentBackup = await buildBackupData();
  const currentInspection = inspectCrystalPoolBackup(currentBackup);
  const currentReport = currentInspection.report;
  const restored = params.restored === "1";
  const restoreError = params.restoreError;
  const countItems = [
    { label: "nodes", value: currentReport.counts.nodes },
    { label: "active", value: currentReport.activeNodes },
    { label: "archived", value: currentReport.archivedNodes },
    { label: "edges", value: currentReport.counts.edges },
    { label: "tags", value: currentReport.counts.tags },
    { label: "events", value: currentReport.counts.phaseEvents },
  ];

  return (
    <AppShell>
      {restored ? (
        <div className="mb-6 rounded-lg border border-lime-200 bg-lime-50 p-4 text-sm font-medium text-lime-950">
          Backup restored. {params.nodes ?? "0"} nodes are back in the pool.
        </div>
      ) : null}
      {restoreError ? (
        <div className="mb-6 flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-950">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} aria-hidden />
          <span>Restore failed: {restoreError}</span>
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-normal text-stone-500">
            Local JSON Export
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Backup Crystal Pool</h1>
          <p className="mt-3 max-w-2xl leading-7 text-stone-600">
            Export the complete local pool as JSON, including active and
            archived nodes, edges, tags, node-tag assignments, and phase
            history. Restore replaces the local pool only after explicit
            confirmation.
          </p>
          <Link
            href="/backup/export.json"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800"
          >
            <Download size={16} aria-hidden />
            Export JSON
          </Link>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {countItems.map((item) => (
              <div key={item.label} className="rounded-md bg-stone-50 p-3">
                <div className="text-2xl font-semibold text-stone-950">
                  {item.value}
                </div>
                <div className="mt-1 text-sm text-stone-500">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Backup Integrity</h2>
            {currentReport.restorable ? (
              <CheckCircle2 className="text-lime-700" size={20} aria-hidden />
            ) : (
              <AlertTriangle className="text-rose-700" size={20} aria-hidden />
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {currentReport.restorable
              ? "Current export has no broken references."
              : "Current export needs attention before restore."}
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="rounded-md bg-stone-50 p-3">
              <dt className="font-medium text-stone-950">schemaVersion</dt>
              <dd className="mt-1 text-stone-600">{backupSchemaVersion}</dd>
            </div>
            {["nodes", "edges", "tags", "nodeTags", "phaseEvents"].map(
              (item) => (
                <div key={item} className="rounded-md bg-stone-50 p-3">
                  <dt className="font-medium text-stone-950">{item}</dt>
                  <dd className="mt-1 text-stone-600">
                    Exported as complete table rows.
                  </dd>
                </div>
              ),
            )}
          </dl>
          {currentReport.errors.length > 0 ? (
            <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-950">
              <p className="font-semibold">Blocking issues</p>
              <ul className="mt-2 grid gap-2">
                {currentReport.errors.slice(0, 3).map((issue) => (
                  <li key={`${issue.table}-${issue.id ?? issue.message}`}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {currentReport.warnings.length > 0 ? (
            <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-950">
              <p className="font-semibold">Warnings</p>
              <ul className="mt-2 grid gap-2">
                {currentReport.warnings.slice(0, 3).map((issue) => (
                  <li key={`${issue.table}-${issue.id ?? issue.message}`}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      <BackupRestorePanel restoreAction={restoreBackupAction} />
    </AppShell>
  );
}
