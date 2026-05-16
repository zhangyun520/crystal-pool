import { describe, expect, it } from "vitest";
import { createWorkerResult } from "@/lib/jobManifest";
import {
  buildCorpusRunReport,
  createCorpusRunManifest,
  planCorpusRun,
  summarizeCorpusRun,
} from "@/lib/corpusRun";

describe("corpus long-run planning", () => {
  it("selects sorted JSONL files and skips overflow", () => {
    const plan = planCorpusRun({
      now: new Date("2026-05-13T00:00:00.000Z"),
      maxFiles: 2,
      files: [
        { path: "/tmp/b.jsonl", name: "b.jsonl", byteEstimate: 10, itemCount: 1 },
        { path: "/tmp/readme.md", name: "readme.md", byteEstimate: 10, itemCount: 1 },
        { path: "/tmp/a.jsonl", name: "a.jsonl", byteEstimate: 10, itemCount: 1 },
        { path: "/tmp/c.jsonl", name: "c.jsonl", byteEstimate: 10, itemCount: 1 },
      ],
    });

    expect(plan.runId).toBe("corpus_20260513-000000");
    expect(plan.selectedFiles.map((file) => file.name)).toEqual([
      "a.jsonl",
      "b.jsonl",
    ]);
    expect(plan.skippedFiles.map((file) => file.name)).toEqual(["c.jsonl"]);
  });

  it("builds manifest, summary, and report for worker results", () => {
    const plan = planCorpusRun({
      now: new Date("2026-05-13T00:00:00.000Z"),
      files: [
        {
          path: "/tmp/shard.jsonl",
          name: "shard.jsonl",
          byteEstimate: 120,
          itemCount: 2,
        },
      ],
    });
    const manifest = createCorpusRunManifest({ plan });
    const results = [
      createWorkerResult({
        sourceKind: "manual",
        sourceRef: "manual:one",
        title: "One",
        body: "这是一个核心结晶。哈哈。",
        capturedAt: "2026-05-13T00:00:00.000Z",
      }),
      createWorkerResult({
        sourceKind: "manual",
        sourceRef: "manual:two",
        title: "Two",
        body: "普通残差进入池面。",
        capturedAt: "2026-05-13T00:00:00.000Z",
        license: "user-provided",
      }),
    ];
    const summary = summarizeCorpusRun({ plan, results });
    const report = buildCorpusRunReport({ summary, manifest, results });

    expect(manifest.shards[0].itemCount).toBe(2);
    expect(summary.inputFiles).toBe(1);
    expect(summary.inputItems).toBe(2);
    expect(summary.marks).toBeGreaterThanOrEqual(2);
    expect(summary.warnings).toBe(1);
    expect(report).toContain("Corpus Long Run corpus_20260513-000000");
    expect(report).toContain("Meaning marks");
  });
});
