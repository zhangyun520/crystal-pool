import { describe, expect, it } from "vitest";
import { parseImportFragments } from "@/lib/importFragments";

describe("parseImportFragments", () => {
  it("splits pasted residue into candidates", () => {
    const result = parseImportFragments("意义是对抗时间的最小单位。\n\n哈是反执着信号。");
    expect(result).toHaveLength(2);
    expect(result[0].title).toContain("意义");
  });

  it("promotes strong markers to seed", () => {
    const [candidate] = parseImportFragments("这是整个池子的核心结晶。");
    expect(candidate.phase).toBe("seed");
  });

  it("raises ha when ha markers appear", () => {
    const [candidate] = parseImportFragments("哈哈，哈基米提醒系统松一下。");
    expect(candidate.emotionHa).toBeGreaterThanOrEqual(6);
    expect(candidate.tags).toContain("ha");
  });
});
