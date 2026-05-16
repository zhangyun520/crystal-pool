import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { NodeForm } from "@/components/NodeForm";
import { updateNodeAction } from "@/server/actions";
import { getNode } from "@/server/queries";

export default async function EditNodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const node = await getNode(id);
  if (!node) notFound();

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Edit Fragment</h1>
        <div className="mt-6">
          <NodeForm
            action={updateNodeAction.bind(null, node.id)}
            node={node}
            submitLabel="Update Fragment"
          />
        </div>
      </div>
    </AppShell>
  );
}
