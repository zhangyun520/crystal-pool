import { describe, expect, it } from "vitest";
import { findResonanceMatches, tokenizeMeaning } from "@/lib/resonance";

describe("resonance", () => {
  it("tokenizes Chinese and latin fragments deterministically", () => {
    expect(tokenizeMeaning("意义生长 SuperCache")).toEqual(
      expect.arrayContaining(["意义", "义生", "supercache"]),
    );
  });

  it("finds possible duplicate and resonance matches", () => {
    const matches = findResonanceMatches(
      {
        title: "意义是对抗时间的最小单位",
        body: "意义是对抗时间的最小单位。",
        phase: "seed",
        emotionHa: 0,
        tags: ["意义", "时间"],
      },
      [
        {
          id: "duplicate",
          title: "意义是对抗时间的最小单位",
          body: "意义是对抗时间的最小单位。它抵抗消散。",
          phase: "crystal",
          tags: ["意义", "时间"],
        },
        {
          id: "resonance",
          title: "诗歌是语义晶体",
          body: "诗歌让意义形成高压缩晶体。",
          phase: "seed",
          tags: ["意义"],
        },
      ],
    );

    expect(matches[0]).toMatchObject({
      nodeId: "duplicate",
      kind: "duplicate",
    });
    expect(matches.some((match) => match.nodeId === "resonance")).toBe(true);
  });
});
