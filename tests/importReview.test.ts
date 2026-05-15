import { describe, expect, it } from "vitest";
import { parseImportFragments } from "@/lib/importFragments";
import {
  buildImportReviewItems,
  summarizeReviewCommitItems,
} from "@/lib/importReview";

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

describe("import review queue", () => {
  it("preserves seed and ha detection while explaining duplicate matches", () => {
    const candidates = parseImportFragments(
      "意义是对抗时间的最小单位，这是核心结晶。\n\n哈哈，哈基米提醒系统松一下。",
    );
    const reviewItems = buildImportReviewItems(candidates, referenceNodes);

    expect(reviewItems[0].candidate.phase).toBe("seed");
    expect(reviewItems[0].action).toBe("merge");
    expect(reviewItems[0].targetNodeId).toBe("meaning");
    expect(reviewItems[0].explanations.join(" ")).toContain("Seed markers");
    expect(reviewItems[0].explanations.join(" ")).toContain(
      "Possible duplicate",
    );

    expect(reviewItems[1].candidate.emotionHa).toBeGreaterThanOrEqual(6);
    expect(reviewItems[1].explanations.join(" ")).toContain("Ha markers");
  });

  it("summarizes create, merge, edge, dismiss, and skipped actions", () => {
    const [candidate] = parseImportFragments("新的日常残差进入池面。");
    const summary = summarizeReviewCommitItems([
      { action: "create", candidate },
      { action: "merge", candidate, targetNodeId: "meaning" },
      {
        action: "edge",
        candidate,
        targetNodeId: "meaning",
        edgeToNodeId: "ha",
        relation: "resonates_with",
        weight: 2,
      },
      { action: "edge", candidate, targetNodeId: "meaning" },
      { action: "dismiss", candidate },
    ]);

    expect(summary).toEqual({
      created: 1,
      merged: 1,
      edges: 1,
      dismissed: 1,
      skipped: 1,
    });
  });
});
