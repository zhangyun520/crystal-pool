import { AppShell } from "@/components/AppShell";
import { NodeForm } from "@/components/NodeForm";
import { createNodeAction } from "@/server/actions";

export default function NewNodePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Add Fragment</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Capture the fragment before deciding what it means. Gas is a fine
          first phase.
        </p>
        <div className="mt-6">
          <NodeForm action={createNodeAction} />
        </div>
      </div>
    </AppShell>
  );
}
