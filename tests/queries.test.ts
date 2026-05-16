import { describe, expect, it } from "vitest";
import { parseGraphQueryFilters, parseNodeQueryFilters } from "@/server/queries";

describe("parseNodeQueryFilters", () => {
  it("normalizes supported node search params", () => {
    expect(
      parseNodeQueryFilters({
        q: "  时间  ",
        phase: "seed",
        tag: "  ha  ",
        status: "archived",
        sort: "createdAt",
        dir: "asc",
      }),
    ).toEqual({
      q: "时间",
      phase: "seed",
      tag: "ha",
      status: "archived",
      sort: "createdAt",
      dir: "asc",
    });
  });

  it("defaults to active score-desc filtering when params are invalid", () => {
    expect(
      parseNodeQueryFilters({
        q: "",
        phase: "plasma",
        status: "gone",
        sort: "weird",
        dir: "sideways",
      }),
    ).toEqual({
      q: undefined,
      phase: undefined,
      tag: undefined,
      status: "active",
      sort: "score",
      dir: "desc",
    });
  });
});

describe("parseGraphQueryFilters", () => {
  it("normalizes supported graph filter params", () => {
    expect(
      parseGraphQueryFilters({
        phase: "crystal",
        relation: "ha_softens",
        tag: "  ha  ",
        selected: " node-id ",
      }),
    ).toEqual({
      phase: "crystal",
      relation: "ha_softens",
      tag: "ha",
      selected: "node-id",
    });
  });

  it("drops unsupported graph filter params", () => {
    expect(
      parseGraphQueryFilters({
        phase: "plasma",
        relation: "teleports",
        tag: "",
        selected: "",
      }),
    ).toEqual({
      phase: undefined,
      relation: undefined,
      tag: undefined,
      selected: undefined,
    });
  });
});
