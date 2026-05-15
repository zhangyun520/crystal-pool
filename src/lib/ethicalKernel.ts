import { type JiEvent } from "./ji";

export const ethicalInvariantIds = [
  "CP-ETH-001",
  "CP-ETH-002",
  "CP-ETH-003",
  "CP-ETH-004",
  "CP-ETH-005",
  "CP-ETH-006",
  "CP-ETH-007",
  "CP-ETH-008",
  "CP-ETH-009",
  "CP-ETH-010",
  "CP-ETH-011",
] as const;

export type EthicalInvariantId = (typeof ethicalInvariantIds)[number];
export type EthicalInvariantSeverity = "critical" | "warning" | "info";
export type EthicalInvariantCheckKind =
  | "automated"
  | "review_signal"
  | "documented_boundary";

export type EthicalInvariant = {
  id: EthicalInvariantId;
  title: string;
  principle: string;
  failureMode: string;
  mechanizedAs: string[];
  checkKind: EthicalInvariantCheckKind;
  severity: EthicalInvariantSeverity;
  refs: string[];
};

export const ethicalInvariants: EthicalInvariant[] = [
  {
    id: "CP-ETH-001",
    title: "AI non-sovereignty",
    principle:
      "AI may propose, review, repair, and rehearse, but it cannot own canonical responsibility or unlock its own mainline.",
    failureMode:
      "Useful AI output becomes deference, and deference becomes unreviewed authority.",
    mechanizedAs: [
      "ResponsibilityMaturity.canAutoUnlock is always false",
      "AI_MAINLINE_PROPOSAL requires human review",
      "AI pool mutations stay isolated and audited",
    ],
    checkKind: "automated",
    severity: "critical",
    refs: ["docs/constitution.md#22", "src/lib/responsibilityMaturity.ts"],
  },
  {
    id: "CP-ETH-002",
    title: "Canonical review gate",
    principle:
      "Sandbox, market, AI, corpus, and ecosystem signals can propose graph effects, but canonical meaning changes only through explicit review.",
    failureMode:
      "A high-pressure signal bypasses deliberation and hardens into canonical truth.",
    mechanizedAs: [
      "JiEvent review actions",
      "Sandbox learning proposals",
      "GraphEffectProposal-style review boundary",
    ],
    checkKind: "automated",
    severity: "critical",
    refs: ["src/server/ji.ts", "src/server/sandbox.ts"],
  },
  {
    id: "CP-ETH-003",
    title: "Local proof-chain boundary",
    principle:
      "Proof-chain artifacts are deterministic local evidence and manual handoff bundles, not live chain operations.",
    failureMode:
      "A local proof layer silently becomes wallet, RPC, token, or automatic upload infrastructure.",
    mechanizedAs: [
      "ChainAnchor local/manual providers",
      "manual externalRef recording",
      "forbidden automatic upload dependencies",
    ],
    checkKind: "automated",
    severity: "critical",
    refs: ["src/lib/market.ts", "scripts/market-anchor-ref.ts"],
  },
  {
    id: "CP-ETH-004",
    title: "No real-money instruments",
    principle:
      "Meaning market pressure remains simulated intent. It must not become securities, wallets, tokens, or real trades.",
    failureMode:
      "Reliability and meaning are replaced by extractive financial incentives.",
    mechanizedAs: [
      "MarketOrder simulated-only copy",
      "forbidden wallet/token/RPC dependency check",
      "README anchoring boundary",
    ],
    checkKind: "automated",
    severity: "critical",
    refs: ["README.md#meaning-market", "docs/constitution.md#11"],
  },
  {
    id: "CP-ETH-005",
    title: "JiEvent mother-pool intake",
    principle:
      "External projects enter Crystal Pool as JiEvents or suggestions, never as direct canonical mutation.",
    failureMode:
      "A tool, browser observation, GitHub event, or MV adapter becomes truth without review.",
    mechanizedAs: [
      "data/ecosystem/inbox JSONL",
      "/ecosystem review queue",
      "JiEventRecord statuses",
    ],
    checkKind: "automated",
    severity: "critical",
    refs: ["src/lib/ji.ts", "src/server/ji.ts"],
  },
  {
    id: "CP-ETH-006",
    title: "Fork right",
    principle:
      "Open forks are legitimate escape and repair paths, but fork drift must stay visible and rehearsable.",
    failureMode:
      "A fork strips review gates, financializes proof, or claims moral legitimacy while hollowing out the core.",
    mechanizedAs: [
      "FORK_DRIFT worldline",
      "shared proof-chain export",
      "open-core boundary documentation",
    ],
    checkKind: "review_signal",
    severity: "warning",
    refs: ["src/lib/worldline.ts", "docs/constitution.md#66"],
  },
  {
    id: "CP-ETH-007",
    title: "Human responsibility currencies",
    principle:
      "Responsibility-bearing currencies and final meaning judgment remain human-reviewable and non-transferable to AI.",
    failureMode:
      "AI, reputation, or market pressure owns duties that only accountable actors can carry.",
    mechanizedAs: [
      "HumanSuggestion review",
      "AI actor permission wall",
      "ResponsibilityMaturity dimensions",
    ],
    checkKind: "review_signal",
    severity: "critical",
    refs: ["src/lib/aiPool.ts", "src/lib/responsibilityMaturity.ts"],
  },
  {
    id: "CP-ETH-008",
    title: "Soulful data",
    principle:
      "Data becomes nourishing only when provenance, lived context, consent boundary, traceability, repairability, and human responsibility remain attached.",
    failureMode:
      "Signals become extractive training nutrition: contextless, ownerless, irreversible, and unrepairable.",
    mechanizedAs: [
      "SoulfulDataAssessment",
      "JiEvent review signal",
      "Corpus marking before canonical import",
    ],
    checkKind: "review_signal",
    severity: "warning",
    refs: ["src/lib/ethicalKernel.ts", "src/lib/ji.ts"],
  },
  {
    id: "CP-ETH-009",
    title: "Hopepunk repair",
    principle:
      "Hope is not optimism; it is visible, bounded, shared, and reversible repair capacity under pressure.",
    failureMode:
      "Hope becomes branding, denial, or unbounded emotional labor demanded from tired actors.",
    mechanizedAs: [
      "HOPEPUNK_REPAIR worldline",
      "repairCapacity maturity dimension",
      "reviewable lessons instead of automatic promotion",
    ],
    checkKind: "review_signal",
    severity: "warning",
    refs: ["src/lib/worldline.ts", "src/lib/responsibilityMaturity.ts"],
  },
  {
    id: "CP-ETH-010",
    title: "Open core, closed shell",
    principle:
      "The meaning engine, rules, proof-chain verification, and review gates stay open; closed work can only wrap non-core operations.",
    failureMode:
      "Commercial hosting or aesthetics capture the core and make audit impossible.",
    mechanizedAs: [
      "open-source documentation",
      "fork drift rehearsal",
      "constitution check review item",
    ],
    checkKind: "documented_boundary",
    severity: "warning",
    refs: ["docs/constitution.md#61", "docs/philosophy/ai-discussion-brief.md"],
  },
  {
    id: "CP-ETH-011",
    title: "Reliability as ethics",
    principle:
      "A beautiful moral system must still be dependable: tests, CI, proof-chain determinism, and review logs are ethical infrastructure.",
    failureMode:
      "The project talks about virtue while quietly becoming unreliable, opaque, or unverifiable.",
    mechanizedAs: [
      "constitution:check",
      "typecheck/lint/test/build/e2e gate",
      "GitHub CI",
    ],
    checkKind: "automated",
    severity: "critical",
    refs: ["package.json", ".github/workflows/ci.yml"],
  },
];

export const soulfulDataDimensionKeys = [
  "provenance",
  "livedContext",
  "consentBoundary",
  "traceability",
  "repairability",
  "nonExtractiveUse",
  "humanResponsibility",
] as const;

export type SoulfulDataDimensionKey = (typeof soulfulDataDimensionKeys)[number];
export type EthicalSignalStatus = "pass" | "warn" | "fail";

export type SoulfulDataDimension = {
  key: SoulfulDataDimensionKey;
  label: string;
  status: EthicalSignalStatus;
  score: number;
  evidence: string;
};

export type SoulfulDataAssessmentInput = {
  id?: string;
  title: string;
  body: string;
  sourceProject?: string;
  occurredAt?: string;
  refs?: Array<{ label: string; href?: string; path?: string; hash?: string }>;
  reviewStatus?: string;
  consentBoundary?: string;
  repairPath?: string;
  humanResponsibility?: string;
  nonExtractiveUse?: string;
};

export type SoulfulDataAssessment = {
  status: "review_signal";
  totalScore: number;
  canPromoteAutomatically: false;
  promotionPolicy: "review_required";
  dimensions: SoulfulDataDimension[];
  weakSignals: SoulfulDataDimension[];
  recommendedAction: string;
};

const soulfulLabels: Record<SoulfulDataDimensionKey, string> = {
  provenance: "Provenance",
  livedContext: "Lived context",
  consentBoundary: "Consent boundary",
  traceability: "Traceability",
  repairability: "Repairability",
  nonExtractiveUse: "Non-extractive use",
  humanResponsibility: "Human responsibility",
};

function dimension(
  key: SoulfulDataDimensionKey,
  status: EthicalSignalStatus,
  evidence: string,
): SoulfulDataDimension {
  const scoreByStatus: Record<EthicalSignalStatus, number> = {
    pass: 100,
    warn: 60,
    fail: 20,
  };
  return {
    key,
    label: soulfulLabels[key],
    status,
    score: scoreByStatus[status],
    evidence,
  };
}

export function assessSoulfulData(
  input: SoulfulDataAssessmentInput,
): SoulfulDataAssessment {
  const refCount = input.refs?.length ?? 0;
  const reviewable = input.reviewStatus === "pending" || input.reviewStatus === "review";
  const titleAndBody = `${input.title} ${input.body}`.trim();
  const hasContext = titleAndBody.length >= 80;
  const dimensions = [
    dimension(
      "provenance",
      input.sourceProject && input.occurredAt && refCount > 0
        ? "pass"
        : input.sourceProject && input.occurredAt
          ? "warn"
          : "fail",
      input.sourceProject && input.occurredAt
        ? `${input.sourceProject} at ${input.occurredAt}; ${refCount} refs.`
        : "Missing source project or occurrence time.",
    ),
    dimension(
      "livedContext",
      hasContext ? "pass" : titleAndBody.length > 0 ? "warn" : "fail",
      hasContext
        ? "The event carries enough narrative context to review."
        : "The signal is terse; reviewer should recover context before import.",
    ),
    dimension(
      "consentBoundary",
      input.consentBoundary
        ? "pass"
        : input.sourceProject === "chrome" || input.sourceProject === "computer"
          ? "warn"
          : "pass",
      input.consentBoundary ??
        (input.sourceProject === "chrome" || input.sourceProject === "computer"
          ? "Authenticated or desktop observations need explicit human confirmation."
          : "The event stays in review and does not publish private raw data."),
    ),
    dimension(
      "traceability",
      input.id && (refCount > 0 || input.occurredAt) ? "pass" : "warn",
      input.id
        ? `Review signal is traceable as ${input.id}.`
        : "Missing stable id for later replay.",
    ),
    dimension(
      "repairability",
      input.repairPath || reviewable ? "pass" : "warn",
      input.repairPath ??
        (reviewable
          ? "Pending review can import, sandbox, draft RFC, or dismiss."
          : "No explicit repair path was attached."),
    ),
    dimension(
      "nonExtractiveUse",
      input.nonExtractiveUse || reviewable ? "pass" : "warn",
      input.nonExtractiveUse ??
        (reviewable
          ? "The signal remains observation until reviewed."
          : "Reviewer should state why this use is not extraction."),
    ),
    dimension(
      "humanResponsibility",
      input.humanResponsibility || reviewable ? "pass" : "warn",
      input.humanResponsibility ??
        (reviewable
          ? "A human reviewer must choose the review action."
          : "No responsible reviewer has been named yet."),
    ),
  ];
  const totalScore = Math.round(
    dimensions.reduce((sum, item) => sum + item.score, 0) / dimensions.length,
  );
  const weakSignals = dimensions.filter((item) => item.status !== "pass");

  return {
    status: "review_signal",
    totalScore,
    canPromoteAutomatically: false,
    promotionPolicy: "review_required",
    dimensions,
    weakSignals,
    recommendedAction: weakSignals.length
      ? "Keep this signal in ecosystem review until provenance, context, repair, and responsibility are explicit."
      : "The signal is well-formed for review, but still cannot auto-promote into canonical meaning.",
  };
}

export function assessJiEventSoulfulData(
  event: JiEvent & { status?: string },
): SoulfulDataAssessment {
  return assessSoulfulData({
    id: event.id,
    title: event.title,
    body: event.body,
    sourceProject: event.sourceProject,
    occurredAt: event.occurredAt,
    refs: event.refs,
    reviewStatus: event.status ?? "pending",
  });
}

export type ConstitutionPackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

export type ConstitutionSourceText = {
  path: string;
  text: string;
};

export type ConstitutionCheckInput = {
  packageJson?: ConstitutionPackageJson;
  sourceTexts?: ConstitutionSourceText[];
};

export type ConstitutionInvariantResult = {
  invariantId: EthicalInvariantId;
  title: string;
  status: EthicalSignalStatus;
  detail: string;
  evidence: string[];
};

export type ConstitutionCheckResult = {
  status: EthicalSignalStatus;
  checkedAt: string;
  summary: {
    pass: number;
    warn: number;
    fail: number;
  };
  results: ConstitutionInvariantResult[];
};

const forbiddenDependencies: Array<{
  name: string;
  invariantId: EthicalInvariantId;
  reason: string;
}> = [
  { name: "ethers", invariantId: "CP-ETH-004", reason: "wallet/RPC client" },
  { name: "viem", invariantId: "CP-ETH-004", reason: "wallet/RPC client" },
  { name: "wagmi", invariantId: "CP-ETH-004", reason: "wallet integration" },
  { name: "web3", invariantId: "CP-ETH-004", reason: "wallet/RPC client" },
  {
    name: "@solana/web3.js",
    invariantId: "CP-ETH-004",
    reason: "wallet/RPC client",
  },
  {
    name: "ipfs-http-client",
    invariantId: "CP-ETH-003",
    reason: "automatic IPFS client",
  },
  {
    name: "@web3-storage/w3up-client",
    invariantId: "CP-ETH-003",
    reason: "automatic external upload client",
  },
  { name: "arweave", invariantId: "CP-ETH-003", reason: "Arweave upload client" },
  { name: "arbundles", invariantId: "CP-ETH-003", reason: "Arweave bundle client" },
];

const forbiddenSourcePatterns: Array<{
  invariantId: EthicalInvariantId;
  pattern: RegExp;
  reason: string;
}> = [
  {
    invariantId: "CP-ETH-001",
    pattern: /\bcanAutoUnlock\s*:\s*true\b/,
    reason: "AI mainline auto-unlock must remain disabled.",
  },
  {
    invariantId: "CP-ETH-001",
    pattern: /\bautoUnlock\s*:\s*true\b/,
    reason: "AI mainline auto-unlock must remain disabled.",
  },
  {
    invariantId: "CP-ETH-002",
    pattern: /\bcanonicalMutationAllowed\s*:\s*true\b/,
    reason: "Long-running ecosystem loops cannot mutate canonical state.",
  },
  {
    invariantId: "CP-ETH-003",
    pattern: /\b(autoUploadAnchors|uploadAnchorsAutomatically|automaticExternalAnchor)\s*:\s*true\b/,
    reason: "Anchor upload must stay manual in v1.",
  },
  {
    invariantId: "CP-ETH-005",
    pattern: /\bexternalAdapterCanMutateCanonical\s*:\s*true\b/,
    reason: "External adapters must enter through JiEvent review.",
  },
];

function packageDependencyNames(packageJson?: ConstitutionPackageJson) {
  return new Set([
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
    ...Object.keys(packageJson?.optionalDependencies ?? {}),
  ]);
}

function resultForInvariant(
  invariant: EthicalInvariant,
  evidence: string[],
): ConstitutionInvariantResult {
  const status: EthicalSignalStatus = evidence.length > 0 ? "fail" : "pass";
  return {
    invariantId: invariant.id,
    title: invariant.title,
    status,
    detail:
      status === "fail"
        ? evidence.join(" ")
        : `${invariant.title} is registered as ${invariant.checkKind}; no automated violation found.`,
    evidence,
  };
}

export function evaluateConstitutionCheck(
  input: ConstitutionCheckInput = {},
): ConstitutionCheckResult {
  const dependencyNames = packageDependencyNames(input.packageJson);
  const evidenceByInvariant = new Map<EthicalInvariantId, string[]>();
  const addEvidence = (id: EthicalInvariantId, evidence: string) => {
    evidenceByInvariant.set(id, [...(evidenceByInvariant.get(id) ?? []), evidence]);
  };

  for (const dependency of forbiddenDependencies) {
    if (dependencyNames.has(dependency.name)) {
      addEvidence(
        dependency.invariantId,
        `Forbidden dependency "${dependency.name}" detected: ${dependency.reason}.`,
      );
    }
  }

  for (const source of input.sourceTexts ?? []) {
    for (const check of forbiddenSourcePatterns) {
      if (check.pattern.test(source.text)) {
        addEvidence(check.invariantId, `${check.reason} Source: ${source.path}.`);
      }
    }
  }

  const results = ethicalInvariants.map((invariant) =>
    resultForInvariant(invariant, evidenceByInvariant.get(invariant.id) ?? []),
  );
  const summary = {
    pass: results.filter((result) => result.status === "pass").length,
    warn: results.filter((result) => result.status === "warn").length,
    fail: results.filter((result) => result.status === "fail").length,
  };

  return {
    status: summary.fail > 0 ? "fail" : summary.warn > 0 ? "warn" : "pass",
    checkedAt: new Date().toISOString(),
    summary,
    results,
  };
}

export function generateConstitutionCheckMarkdown(result: ConstitutionCheckResult) {
  const resultLines = result.results
    .map((item) => {
      const evidence = item.evidence.length
        ? ` Evidence: ${item.evidence.join(" ")}`
        : "";
      return `- ${item.status.toUpperCase()} ${item.invariantId} ${item.title}: ${item.detail}${evidence}`;
    })
    .join("\n");

  return [
    "# Crystal Pool Constitution Check",
    "",
    `- status: ${result.status}`,
    `- checkedAt: ${result.checkedAt}`,
    `- pass: ${result.summary.pass}`,
    `- warn: ${result.summary.warn}`,
    `- fail: ${result.summary.fail}`,
    "",
    "## Invariants",
    resultLines,
    "",
    "## Boundary",
    "This check is a local guardrail. It does not promote canonical nodes, unlock AI mainline, upload anchors, open PRs, or perform external actions.",
  ].join("\n");
}
