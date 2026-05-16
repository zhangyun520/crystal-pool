import { type EthicalInvariantId } from "./ethicalKernel";
import { type WorldlineKey } from "./worldline";

export type ForkCompatibilityStatus = "pass" | "warn" | "fail";
export type ForkCompatibilityCategory =
  | "open_core"
  | "closed_shell"
  | "incompatibility_boundary";

export type ForkCompatibilityEvidence = {
  packageScripts: readonly string[];
  docs: readonly string[];
  worldlineKeys: readonly string[];
  ethicalInvariantIds: readonly EthicalInvariantId[];
  constitutionStatus: "pass" | "warn" | "fail";
};

export type ForkCompatibilityCriterion = {
  id: string;
  category: ForkCompatibilityCategory;
  title: string;
  principle: string;
  requiredEvidence: string[];
  failureMode: string;
  evaluate: (evidence: ForkCompatibilityEvidence) => {
    status: ForkCompatibilityStatus;
    evidence: string[];
  };
};

export type ForkCompatibilityCriterionResult = Omit<
  ForkCompatibilityCriterion,
  "evaluate"
> & {
  status: ForkCompatibilityStatus;
  evidence: string[];
};

export type ForkCompatibilityResult = {
  checkedAt: string;
  status: ForkCompatibilityStatus;
  summary: {
    pass: number;
    warn: number;
    fail: number;
  };
  criteria: ForkCompatibilityCriterionResult[];
  compatibilityBadge: "compatible" | "review-required" | "incompatible";
  canonicalMutationAllowed: false;
};

function hasAll(values: readonly string[], expected: readonly string[]) {
  const set = new Set(values);
  return expected.every((item) => set.has(item));
}

function hasDoc(values: readonly string[], docPath: string) {
  return values.includes(docPath);
}

function status(
  status: ForkCompatibilityStatus,
  evidence: string[],
) {
  return { status, evidence };
}

export const forkCompatibilityCriteria: ForkCompatibilityCriterion[] = [
  {
    id: "CP-FORK-001",
    category: "open_core",
    title: "Ethical kernel stays auditable",
    principle:
      "A fork may change presentation, hosting, or private workflow, but the ethical kernel and review gates must remain inspectable.",
    requiredEvidence: [
      "ethical invariants",
      "constitution check",
      "philosophy docs",
    ],
    failureMode:
      "A fork keeps the brand aura while hiding the rules that make the system trustworthy.",
    evaluate: (evidence) => {
      const hasEthics = evidence.ethicalInvariantIds.length >= 11;
      const hasConstitution = evidence.packageScripts.includes("constitution:check");
      const hasDocs = hasAll(evidence.docs, [
        "docs/philosophy/soulful-data-hopepunk-engineering.md",
        "docs/philosophy/ai-discussion-brief.md",
      ]);
      return status(hasEthics && hasConstitution && hasDocs ? "pass" : "fail", [
        `ethical invariants: ${evidence.ethicalInvariantIds.length}`,
        `constitution script: ${hasConstitution}`,
        `philosophy docs: ${hasDocs}`,
      ]);
    },
  },
  {
    id: "CP-FORK-002",
    category: "open_core",
    title: "Review gates stay executable",
    principle:
      "Compatibility requires runnable checks for constitution, repair, and worldline rehearsal coverage.",
    requiredEvidence: [
      "constitution:check",
      "repair:queue",
      "worldline:coverage",
    ],
    failureMode:
      "The fork claims shared ethics while deleting the commands that make ethics testable.",
    evaluate: (evidence) => {
      const scripts = hasAll(evidence.packageScripts, [
        "constitution:check",
        "repair:queue",
        "worldline:coverage",
      ]);
      return status(scripts ? "pass" : "fail", [
        `required scripts: ${scripts}`,
      ]);
    },
  },
  {
    id: "CP-FORK-003",
    category: "incompatibility_boundary",
    title: "AI non-sovereignty cannot be parameter-tuned away",
    principle:
      "A fork is incompatible if AI can auto-unlock mainline authority or own human responsibility currencies.",
    requiredEvidence: ["CP-ETH-001", "CP-ETH-007", "constitution pass"],
    failureMode:
      "A copied Pool becomes a priesthood of useful AI output and still claims the Crystal Pool name.",
    evaluate: (evidence) => {
      const invariants = hasAll(evidence.ethicalInvariantIds, [
        "CP-ETH-001",
        "CP-ETH-007",
      ]);
      const constitution = evidence.constitutionStatus === "pass";
      return status(invariants && constitution ? "pass" : "fail", [
        `AI invariants: ${invariants}`,
        `constitution status: ${evidence.constitutionStatus}`,
      ]);
    },
  },
  {
    id: "CP-FORK-004",
    category: "incompatibility_boundary",
    title: "Proof-chain and market stay local/non-financial",
    principle:
      "A compatible fork must not add wallet, token, RPC, real trade, or automatic external anchoring to the v1 proof layer.",
    requiredEvidence: ["CP-ETH-003", "CP-ETH-004", "constitution pass"],
    failureMode:
      "Reliability ethics collapses into financial extraction while keeping the proof-chain vocabulary.",
    evaluate: (evidence) => {
      const invariants = hasAll(evidence.ethicalInvariantIds, [
        "CP-ETH-003",
        "CP-ETH-004",
      ]);
      const constitution = evidence.constitutionStatus === "pass";
      return status(invariants && constitution ? "pass" : "fail", [
        `proof/market invariants: ${invariants}`,
        `constitution status: ${evidence.constitutionStatus}`,
      ]);
    },
  },
  {
    id: "CP-FORK-005",
    category: "open_core",
    title: "JiEvent intake remains the external boundary",
    principle:
      "External projects and tools must enter through JiEvent review before they affect canonical meaning.",
    requiredEvidence: ["CP-ETH-002", "CP-ETH-005"],
    failureMode:
      "Adapters, browsers, GitHub events, or creator tools mutate canonical pool state directly.",
    evaluate: (evidence) => {
      const invariants = hasAll(evidence.ethicalInvariantIds, [
        "CP-ETH-002",
        "CP-ETH-005",
      ]);
      return status(invariants ? "pass" : "fail", [
        `JiEvent/review invariants: ${invariants}`,
      ]);
    },
  },
  {
    id: "CP-FORK-006",
    category: "open_core",
    title: "Fork drift remains rehearsable",
    principle:
      "A fork can diverge, but compatibility requires visible FORK_DRIFT rehearsal and coverage evidence.",
    requiredEvidence: ["FORK_DRIFT worldline", "worldline coverage matrix"],
    failureMode:
      "Forks copy parameters, weaken gates, and create moral drift without any shared diagnostic surface.",
    evaluate: (evidence) => {
      const hasForkDrift = evidence.worldlineKeys.includes("FORK_DRIFT" as WorldlineKey);
      const hasCoverage = evidence.packageScripts.includes("worldline:coverage");
      return status(hasForkDrift && hasCoverage ? "pass" : "fail", [
        `FORK_DRIFT worldline: ${hasForkDrift}`,
        `worldline coverage script: ${hasCoverage}`,
      ]);
    },
  },
  {
    id: "CP-FORK-007",
    category: "closed_shell",
    title: "Closed shell cannot capture the core",
    principle:
      "Commercial hosting, private operations, design shells, or deployment glue may be closed only if they do not hide or override the auditable core.",
    requiredEvidence: ["fork compatibility document"],
    failureMode:
      "The closed shell becomes the real governance layer and turns the open core into theater.",
    evaluate: (evidence) => {
      const doc = hasDoc(evidence.docs, "docs/governance/fork-compatibility.md");
      return status(doc ? "pass" : "fail", [
        `fork compatibility doc: ${doc}`,
      ]);
    },
  },
  {
    id: "CP-FORK-008",
    category: "incompatibility_boundary",
    title: "Compatibility badge criteria are published",
    principle:
      "A fork should not self-declare legitimacy without a visible checklist for compatible, review-required, or incompatible status.",
    requiredEvidence: ["compatibility badge criteria"],
    failureMode:
      "A fork removes review friction, financializes proof, or expands AI authority while claiming moral continuity.",
    evaluate: (evidence) => {
      const doc = hasDoc(evidence.docs, "docs/governance/fork-compatibility.md");
      return status(doc ? "pass" : "fail", [
        `compatibility badge criteria doc: ${doc}`,
      ]);
    },
  },
];

export function evaluateForkCompatibility({
  evidence,
  checkedAt = new Date().toISOString(),
}: {
  evidence: ForkCompatibilityEvidence;
  checkedAt?: string;
}): ForkCompatibilityResult {
  const criteria = forkCompatibilityCriteria.map((criterion) => {
    const result = criterion.evaluate(evidence);
    const { evaluate: _evaluate, ...rest } = criterion;
    void _evaluate;
    return {
      ...rest,
      status: result.status,
      evidence: result.evidence,
    };
  });
  const summary = {
    pass: criteria.filter((item) => item.status === "pass").length,
    warn: criteria.filter((item) => item.status === "warn").length,
    fail: criteria.filter((item) => item.status === "fail").length,
  };
  const status: ForkCompatibilityStatus =
    summary.fail > 0 ? "fail" : summary.warn > 0 ? "warn" : "pass";

  return {
    checkedAt,
    status,
    summary,
    criteria,
    compatibilityBadge:
      status === "pass"
        ? "compatible"
        : status === "warn"
          ? "review-required"
          : "incompatible",
    canonicalMutationAllowed: false,
  };
}

export function generateForkCompatibilityReport(result: ForkCompatibilityResult) {
  const lines = result.criteria.map(
    (item) =>
      `- ${item.status.toUpperCase()} ${item.id} [${item.category}] ${item.title}`,
  );

  return [
    "# Crystal Pool Fork Compatibility Check",
    "",
    `- checkedAt: ${result.checkedAt}`,
    `- status: ${result.status}`,
    `- compatibilityBadge: ${result.compatibilityBadge}`,
    `- pass: ${result.summary.pass}`,
    `- warn: ${result.summary.warn}`,
    `- fail: ${result.summary.fail}`,
    `- canonicalMutationAllowed: ${result.canonicalMutationAllowed}`,
    "",
    "## Criteria",
    ...lines,
    "",
    "## Boundary",
    "This check classifies compatibility evidence only. It does not certify external forks automatically, promote canonical nodes, unlock AI mainline, upload anchors, or enforce licenses by itself.",
  ].join("\n");
}
