import { describe, expect, it } from "vitest";
import {
  defaultPoolIdForSlug,
  defaultPoolIds,
  defaultPoolSpaces,
  normalizePoolSlug,
} from "@/lib/pools";
import { sourceTypes } from "@/lib/domain";

describe("pool spaces", () => {
  it("defines the canonical, AI-directed, and Fugue pools", () => {
    expect(defaultPoolSpaces.map((pool) => pool.id)).toEqual([
      defaultPoolIds.canonical,
      defaultPoolIds.ai,
      defaultPoolIds.fugue,
    ]);
  });

  it("normalizes public pool slugs to fixed pool ids", () => {
    expect(normalizePoolSlug("AI-Pool")).toBe("ai");
    expect(normalizePoolSlug("crystal-fugue")).toBe("fugue");
    expect(normalizePoolSlug("something-else")).toBe("canonical");
    expect(defaultPoolIdForSlug("ai_directed")).toBe(defaultPoolIds.ai);
    expect(defaultPoolIdForSlug("fugue")).toBe(defaultPoolIds.fugue);
  });

  it("keeps AI and Fugue imports explicit in source types", () => {
    expect(sourceTypes).toContain("ai");
    expect(sourceTypes).toContain("fugue");
    expect(sourceTypes).toContain("ecosystem");
  });
});
