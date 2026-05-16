import { describe, expect, it } from "vitest";
import {
  buildCorpusTrailBundle,
  canonicalizeCorpusRef,
  createCorpusSnapshot,
  createMeaningMarks,
  diffMeaningMarks,
  stableTextHash,
  summarizeMeaningMarks,
} from "@/lib/corpusTrail";

const referenceNodes = [
  {
    id: "meaning",
    title: "意义是对抗时间的最小单位",
    body: "意义是对抗时间的最小单位。它抵抗消散。",
    phase: "crystal",
    tags: ["meaning", "time"],
  },
  {
    id: "ha",
    title: "哈是结晶后的反执着信号",
    body: "哈会给过硬的结晶重新打开状态空间。",
    phase: "seed",
    tags: ["ha"],
  },
];

describe("corpus trail marking", () => {
  it("canonicalizes URLs and hashes text deterministically", () => {
    expect(
      canonicalizeCorpusRef("HTTPS://Example.com:443/path?b=2&a=1#frag"),
    ).toBe("https://example.com/path?a=1&b=2");
    expect(stableTextHash("意义")).toBe(stableTextHash("意义"));
  });

  it("creates meaning marks with seed and ha markers preserved", () => {
    const snapshot = createCorpusSnapshot({
      sourceKind: "manual",
      sourceRef: "manual:test",
      title: "Test shard",
      body: "意义是对抗时间的最小单位，这是核心结晶。\n\n哈哈，哈基米提醒系统松一下。",
      capturedAt: "2026-05-13T00:00:00.000Z",
    });
    const marks = createMeaningMarks(snapshot, referenceNodes);
    const summary = summarizeMeaningMarks(marks);

    expect(snapshot.id).toMatch(/^snap_/);
    expect(marks).toHaveLength(2);
    expect(marks[0].phase).toBe("seed");
    expect(marks[0].suggestedRelation).toBe("hardens_into");
    expect(marks[0].matches[0].kind).toBe("duplicate");
    expect(marks[1].emotionHa).toBeGreaterThanOrEqual(6);
    expect(marks[1].suggestedRelation).toBe("ha_softens");
    expect(summary.highHa).toBe(1);
    expect(summary.duplicates).toBeGreaterThanOrEqual(1);
  });

  it("diffs meaning marks into trajectory events", () => {
    const first = createCorpusSnapshot({
      sourceRef: "manual:timeline",
      title: "Timeline",
      body: "一个普通残差进入池面。",
      capturedAt: "2026-05-13T00:00:00.000Z",
    });
    const second = createCorpusSnapshot({
      sourceRef: "manual:timeline",
      title: "Timeline",
      body: "一个普通残差进入池面，这是核心结晶。哈哈。",
      capturedAt: "2026-05-14T00:00:00.000Z",
    });
    const previous = createMeaningMarks(first);
    const next = createMeaningMarks(second);
    const events = diffMeaningMarks(previous, next, second.canonicalRef);

    expect(events.some((event) => event.eventType === "phase_shifted")).toBe(
      true,
    );
    expect(events.some((event) => event.eventType === "ha_changed")).toBe(true);
  });

  it("builds a bundle with appeared events for the first snapshot", () => {
    const snapshot = createCorpusSnapshot({
      sourceRef: "manual:bundle",
      body: "池子需要长期标记。",
      capturedAt: "2026-05-13T00:00:00.000Z",
    });
    const marks = createMeaningMarks(snapshot);
    const bundle = buildCorpusTrailBundle([{ snapshot, marks }]);

    expect(bundle.schemaVersion).toBe("crystal-pool.corpus-trail.v1");
    expect(bundle.snapshots).toHaveLength(1);
    expect(bundle.trajectoryEvents[0].eventType).toBe("appeared");
  });

  it("does not diff unrelated corpus sources against each other", () => {
    const first = createCorpusSnapshot({
      sourceRef: "manual:first",
      body: "第一条语料出现。",
      capturedAt: "2026-05-13T00:00:00.000Z",
    });
    const second = createCorpusSnapshot({
      sourceRef: "manual:second",
      body: "第二条语料出现。",
      capturedAt: "2026-05-14T00:00:00.000Z",
    });
    const bundle = buildCorpusTrailBundle([
      { snapshot: first, marks: createMeaningMarks(first) },
      { snapshot: second, marks: createMeaningMarks(second) },
    ]);

    expect(
      bundle.trajectoryEvents.some(
        (event) => event.eventType === "disappeared",
      ),
    ).toBe(false);
  });
});
