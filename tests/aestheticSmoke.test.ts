import { describe, expect, it } from "vitest";
import {
  aestheticSmokeRoutes,
  aestheticSmokeViewports,
  createAestheticSmokeManifest,
  evaluateAestheticSmokeChecks,
  generateAestheticSmokeReport,
  type AestheticSmokeRouteCheck,
} from "@/lib/aestheticSmoke";

function check(overrides: Partial<AestheticSmokeRouteCheck> = {}): AestheticSmokeRouteCheck {
  return {
    path: "/flow",
    label: "Meaning order flow",
    viewport: "desktop",
    statusCode: 200,
    screenshotPath: "screenshots/flow-desktop.png",
    screenshotBytes: 42_000,
    expectedText: ["Meaning Tape"],
    missingText: [],
    scrollWidth: 1440,
    viewportWidth: 1440,
    horizontalOverflow: false,
    bodyTextLength: 2_000,
    passed: true,
    ...overrides,
  };
}

describe("aesthetic screenshot smoke", () => {
  it("defines route and viewport coverage for the core operation surfaces", () => {
    expect(aestheticSmokeRoutes.map((route) => route.path)).toEqual([
      "/flow",
      "/observe",
      "/ecosystem",
      "/sandbox",
    ]);
    expect(aestheticSmokeViewports.map((viewport) => viewport.label)).toEqual([
      "desktop",
      "mobile",
    ]);
  });

  it("summarizes pass/fail checks without promoting canonical state", () => {
    const checks = [
      check(),
      check({
        path: "/observe",
        label: "Long-run observe surface",
        viewport: "mobile",
        missingText: ["Long Goal Compass"],
        passed: false,
      }),
    ];
    const manifest = createAestheticSmokeManifest({
      runId: "aesthetic-smoke-test",
      baseUrl: "http://localhost:3000",
      createdAt: "2026-05-16T10:00:00.000Z",
      completedAt: "2026-05-16T10:01:00.000Z",
      checks,
    });

    expect(evaluateAestheticSmokeChecks(checks)).toEqual({ passed: 1, failed: 1 });
    expect(manifest).toMatchObject({
      mode: "aesthetic_screenshot_smoke",
      passed: 1,
      failed: 1,
      canonicalMutationAllowed: false,
    });
  });

  it("generates a report with local-only boundaries", () => {
    const checks = [check()];
    const manifest = createAestheticSmokeManifest({
      runId: "aesthetic-smoke-test",
      baseUrl: "http://localhost:3000",
      createdAt: "2026-05-16T10:00:00.000Z",
      completedAt: "2026-05-16T10:01:00.000Z",
      checks,
    });
    const report = generateAestheticSmokeReport({ manifest, checks });

    expect(report).toContain("# Crystal Pool Aesthetic Screenshot Smoke");
    expect(report).toContain("PASS /flow desktop");
    expect(report).toContain("does not promote canonical pool state");
  });
});
