import { describe, expect, it } from "vitest";
import {
  createJobManifest,
  createWorkerResult,
  parseJsonl,
  serializeJsonl,
  validateWorkerResult,
} from "@/lib/jobManifest";

describe("crystal worker job manifests", () => {
  it("creates a deterministic long-run job manifest", () => {
    const manifest = createJobManifest({
      goal: "Mark a residue shard",
      workerTarget: "local",
      createdAt: "2026-05-13T00:00:00.000Z",
      shards: [
        {
          id: "shard-b",
          sourceKind: "manual",
          sourceRef: "manual:b",
          itemCount: 1,
          byteEstimate: 10,
        },
        {
          id: "shard-a",
          sourceKind: "manual",
          sourceRef: "manual:a",
          itemCount: 1,
          byteEstimate: 10,
        },
      ],
    });

    expect(manifest.schemaVersion).toBe("crystal-pool.job-manifest.v1");
    expect(manifest.shards.map((shard) => shard.id)).toEqual([
      "shard-a",
      "shard-b",
    ]);
    expect(manifest.constraints.join(" ")).toContain("Do not bypass");
  });

  it("serializes worker input and validates worker output", () => {
    const input = {
      sourceKind: "manual" as const,
      sourceRef: "manual:worker",
      title: "Worker shard",
      body: "这是一个核心结晶。哈哈。",
      capturedAt: "2026-05-13T00:00:00.000Z",
    };
    const jsonl = serializeJsonl([input]);
    const [parsed] = parseJsonl<typeof input>(jsonl);
    const result = createWorkerResult(parsed);
    const validation = validateWorkerResult(result);

    expect(result.schemaVersion).toBe("crystal-pool.worker-result.v1");
    expect(result.marks[0].phase).toBe("seed");
    expect(result.marks[0].emotionHa).toBeGreaterThanOrEqual(6);
    expect(validation.ok).toBe(true);
  });

  it("reports bad JSONL line numbers", () => {
    expect(() => parseJsonl("{bad json")).toThrow("Invalid JSONL at line 1.");
  });
});
