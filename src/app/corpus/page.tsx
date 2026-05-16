import { AppShell } from "@/components/AppShell";
import { ChatGptCorpusEnqueuer } from "@/components/ChatGptCorpusEnqueuer";
import { CorpusMarkerPreviewer } from "@/components/CorpusMarkerPreviewer";
import { getImportReferenceNodes } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function CorpusPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const queued = Array.isArray(params.chatgptQueued)
    ? params.chatgptQueued[0]
    : params.chatgptQueued;
  const queuedFile = Array.isArray(params.file) ? params.file[0] : params.file;
  const error = Array.isArray(params.chatgptError)
    ? params.chatgptError[0]
    : params.chatgptError;
  const referenceNodes = await getImportReferenceNodes();

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-normal text-stone-500">
          Corpus Trail
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Meaning Marking Layer</h1>
        <p className="mt-2 max-w-3xl text-stone-600">
          The pool can now mark text shards before they enter the database:
          source snapshot, deterministic candidate marks, suggested relations,
          and trajectory-ready IDs. This is the local protocol for future
          parallel workers.
        </p>
      </div>
      {queued ? (
        <div className="mb-6 rounded-lg border border-lime-200 bg-lime-50 p-4 text-sm text-lime-950">
          Queued {queued} ChatGPT corpus document{queued === "1" ? "" : "s"}
          {queuedFile ? ` in ${queuedFile}` : ""}. The watcher will mark it on
          the next pass.
        </div>
      ) : null}
      {error ? (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
          {error}
        </div>
      ) : null}
      <ChatGptCorpusEnqueuer />
      <CorpusMarkerPreviewer referenceNodes={referenceNodes} />
    </AppShell>
  );
}
