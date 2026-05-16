export const aestheticSmokeRoutes = [
  {
    path: "/flow",
    label: "Meaning order flow",
    expectedText: [
      "Crystallization Tape",
      "Meaning Tape",
      "Market Depth",
      "Parallel Lanes",
    ],
  },
  {
    path: "/observe",
    label: "Long-run observe surface",
    expectedText: [
      "Long-Run Monitor",
      "Long Goal Compass",
      "Long Goal Evidence Bundle",
      "Long Goal Horizon",
      "Worldline Coverage Matrix",
      "Fork Compatibility Boundary",
      "Hopepunk Repair Queue",
      "Constitution Status",
      "Proof Chain Explorer",
    ],
  },
  {
    path: "/ecosystem",
    label: "Jellyfish ecosystem review",
    expectedText: [
      "JiEvent Review Queue",
      "Humane Review Triage",
      "Typed Proposal Lanes",
      "Project Organs",
      "Pending Trigger Points",
    ],
  },
  {
    path: "/sandbox",
    label: "Sandbox replay studio",
    expectedText: [
      "Fugue, Sonata, and Symphony rehearsals.",
      "Sandbox Protocols",
      "Scenario Gallery",
      "Run List",
    ],
  },
] as const;

export type AestheticSmokeRoutePath = (typeof aestheticSmokeRoutes)[number]["path"];

export type AestheticSmokeViewport = {
  label: "desktop" | "mobile";
  width: number;
  height: number;
};

export const aestheticSmokeViewports: AestheticSmokeViewport[] = [
  { label: "desktop", width: 1440, height: 1200 },
  { label: "mobile", width: 390, height: 844 },
];

export type AestheticSmokeRouteCheck = {
  path: AestheticSmokeRoutePath;
  label: string;
  viewport: AestheticSmokeViewport["label"];
  statusCode: number | null;
  screenshotPath: string;
  screenshotBytes: number;
  expectedText: string[];
  missingText: string[];
  scrollWidth: number;
  viewportWidth: number;
  horizontalOverflow: boolean;
  bodyTextLength: number;
  passed: boolean;
};

export type AestheticSmokeManifest = {
  runId: string;
  mode: "aesthetic_screenshot_smoke";
  baseUrl: string;
  createdAt: string;
  completedAt: string;
  routes: number;
  viewports: number;
  checks: number;
  passed: number;
  failed: number;
  screenshots: number;
  canonicalMutationAllowed: false;
};

export type AestheticSmokeRunSummary = {
  manifest: AestheticSmokeManifest;
  checks: AestheticSmokeRouteCheck[];
  reportMarkdown: string;
  runDir?: string;
};

export function evaluateAestheticSmokeChecks(
  checks: AestheticSmokeRouteCheck[],
) {
  const passed = checks.filter((check) => check.passed).length;
  const failed = checks.length - passed;
  return { passed, failed };
}

export function createAestheticSmokeManifest({
  runId,
  baseUrl,
  createdAt,
  completedAt,
  checks,
}: {
  runId: string;
  baseUrl: string;
  createdAt: string;
  completedAt: string;
  checks: AestheticSmokeRouteCheck[];
}): AestheticSmokeManifest {
  const { passed, failed } = evaluateAestheticSmokeChecks(checks);
  return {
    runId,
    mode: "aesthetic_screenshot_smoke",
    baseUrl,
    createdAt,
    completedAt,
    routes: aestheticSmokeRoutes.length,
    viewports: aestheticSmokeViewports.length,
    checks: checks.length,
    passed,
    failed,
    screenshots: checks.filter((check) => check.screenshotBytes > 0).length,
    canonicalMutationAllowed: false,
  };
}

export function generateAestheticSmokeReport({
  manifest,
  checks,
}: {
  manifest: AestheticSmokeManifest;
  checks: AestheticSmokeRouteCheck[];
}) {
  const lines = checks.map((check) => {
    const status = check.passed ? "PASS" : "FAIL";
    const issues = [
      check.statusCode === 200 ? undefined : `status=${check.statusCode ?? "none"}`,
      check.missingText.length
        ? `missing=${check.missingText.join(", ")}`
        : undefined,
      check.horizontalOverflow ? "horizontal-overflow" : undefined,
      check.screenshotBytes > 0 ? undefined : "empty-screenshot",
    ].filter(Boolean);
    return `- ${status} ${check.path} ${check.viewport} screenshot=${check.screenshotPath} ${issues.join(" ")}`.trim();
  });

  return [
    "# Crystal Pool Aesthetic Screenshot Smoke",
    "",
    `- runId: ${manifest.runId}`,
    `- baseUrl: ${manifest.baseUrl}`,
    `- completedAt: ${manifest.completedAt}`,
    `- checks: ${manifest.checks}`,
    `- passed: ${manifest.passed}`,
    `- failed: ${manifest.failed}`,
    `- screenshots: ${manifest.screenshots}`,
    `- canonicalMutationAllowed: ${manifest.canonicalMutationAllowed}`,
    "",
    "## Route Checks",
    ...lines,
    "",
    "## Boundary",
    "This smoke run captures local UI evidence only. It does not promote canonical pool state, upload screenshots, open PRs, publish releases, or decide aesthetic truth by itself.",
  ].join("\n");
}
