import { AppShell } from "@/components/AppShell";
import { ImportPreviewer } from "@/components/ImportPreviewer";
import { getImportReferenceNodes } from "@/server/queries";

export default async function ImportPage({
  searchParams,
}: {
  searchParams?: Promise<{
    created?: string;
    merged?: string;
    edges?: string;
    dismissed?: string;
    skipped?: string;
  }>;
}) {
  const referenceNodes = await getImportReferenceNodes();
  const params = await searchParams;
  const committed =
    params?.created ||
    params?.merged ||
    params?.edges ||
    params?.dismissed ||
    params?.skipped;

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Import Conversation Residue</h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Paste a long conversation, review deterministic candidate fragments,
          and admit only the ones that should enter the pool.
        </p>
      </div>
      {committed ? (
        <div className="mb-6 rounded-lg border border-lime-200 bg-lime-50 p-4 text-sm text-lime-950">
          Import review committed: {params?.created ?? 0} created,{" "}
          {params?.merged ?? 0} merged, {params?.edges ?? 0} edges,{" "}
          {params?.dismissed ?? 0} dismissed, {params?.skipped ?? 0} skipped.
        </div>
      ) : null}
      <ImportPreviewer referenceNodes={referenceNodes} />
    </AppShell>
  );
}
