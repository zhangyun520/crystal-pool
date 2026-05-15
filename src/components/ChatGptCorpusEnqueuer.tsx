import { Upload } from "lucide-react";
import { enqueueChatGptCorpusAction } from "@/server/actions";

export function ChatGptCorpusEnqueuer() {
  return (
    <section className="mb-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">ChatGPT Conversation Intake</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Paste a web transcript or ChatGPT export JSON. The text is queued
            locally as corpus JSONL; the watcher marks it before anything enters
            the pool database.
          </p>
        </div>
        <span className="w-fit rounded-md bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-950">
          local inbox
        </span>
      </div>
      <form action={enqueueChatGptCorpusAction} className="mt-5 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">Title</span>
            <input
              name="title"
              className="h-10 rounded-md border border-stone-300 px-3 text-sm"
              placeholder="ChatGPT conversation title"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">
              Source ref
            </span>
            <input
              name="sourceRef"
              className="h-10 rounded-md border border-stone-300 px-3 text-sm"
              placeholder="chatgpt:web or export filename"
            />
          </label>
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">
            Transcript or export JSON
          </span>
          <textarea
            name="transcript"
            rows={8}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm leading-6"
            placeholder={"User:\n我们做结晶池。\n\nAssistant:\n可以，把这段作为意义残差进入候选队列。\n\nOr paste conversations.json content here."}
            required
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-500">
            Private by default: queued files under data/corpus/inbox are ignored
            by git.
          </p>
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white"
          >
            <Upload size={16} aria-hidden />
            Queue ChatGPT Corpus
          </button>
        </div>
      </form>
    </section>
  );
}
