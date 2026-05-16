import { createHash } from "node:crypto";
import {
  type JiEvent,
  type JiProposalLaneKind,
} from "./ji";
import {
  type SandboxMode,
  type SandboxRunInput,
} from "./sandbox";
import { type WorldlineKey } from "./worldline";

export const philosophyAestheticsPillars = [
  "HOPEPUNK_REPAIR",
  "HUMANISM",
  "AI_NON_SOVEREIGNTY",
  "SOULFUL_DATA",
  "RELIABILITY_ETHICS",
  "OPEN_CLOSED_DUAL_CORE",
  "WORLDLINE_SANDBOX",
  "ARTISTIC_OPERATION_SURFACE",
] as const;

export type PhilosophyAestheticsPillar =
  (typeof philosophyAestheticsPillars)[number];

export const philosophyAestheticsGapCategories = [
  "mechanism",
  "interface",
  "protocol",
  "article",
  "test",
  "governance_boundary",
] as const;

export type PhilosophyAestheticsGapCategory =
  (typeof philosophyAestheticsGapCategories)[number];

export type PhilosophyAestheticsGapStatus = "covered" | "partial" | "gap";
export type PhilosophyAestheticsGapSeverity = "critical" | "important" | "watch";

export type PhilosophyAestheticsGoalEvidence = {
  ethicalInvariants: number;
  constitutionStatus: "pass" | "warn" | "fail";
  hasConstitutionCheckScript: boolean;
  hasSoulfulDataAssessment: boolean;
  hasResponsibilityMaturity: boolean;
  aiMainlineAutoUnlockDisabled: boolean;
  sandboxModes: readonly string[];
  worldlineKeys: readonly string[];
  proposalLaneKinds: readonly string[];
  routes: readonly string[];
  docs: readonly string[];
  tests: readonly string[];
  packageScripts: readonly string[];
  pendingJiEvents: number;
  typedReviewProposals: number;
  philosophyCandidates: number;
  philosophyReviewProposals: number;
  philosophySandboxRuns: number;
  hasPhilosophyGapAudit: boolean;
  hasAestheticSmokeScript: boolean;
  latestAestheticSmokeStatus?: "pass" | "fail" | "missing";
  latestAestheticSmokeRoutes: readonly string[];
  latestAestheticSmokeScreenshots: number;
  hasRepairQueueScript: boolean;
  latestRepairQueueStatus?: "pass" | "watch" | "fail" | "missing";
  latestRepairQueueItems: number;
  latestRepairQueueJiEvents: number;
  latestRepairQueueSandboxRuns: number;
};

export type PhilosophyAestheticsRequirement = {
  id: string;
  pillar: PhilosophyAestheticsPillar;
  category: PhilosophyAestheticsGapCategory;
  title: string;
  principle: string;
  expectedCapability: string;
  missingIfAbsent: string;
  proposalKind: JiProposalLaneKind;
  severity: PhilosophyAestheticsGapSeverity;
  suggestedArtifacts: string[];
  acceptanceCheck: string;
  reviewPath: string;
  sandboxMode: SandboxMode;
  worldlineKey: WorldlineKey;
  evaluate: (evidence: PhilosophyAestheticsGoalEvidence) => {
    status: PhilosophyAestheticsGapStatus;
    evidence: string[];
  };
};

export type PhilosophyAestheticsGap = Omit<
  PhilosophyAestheticsRequirement,
  "evaluate"
> & {
  status: PhilosophyAestheticsGapStatus;
  evidence: string[];
};

export type PhilosophyAestheticsGoalAudit = {
  generatedAt: string;
  coverageScore: number;
  covered: number;
  partial: number;
  gaps: number;
  criticalOpen: number;
  requirements: PhilosophyAestheticsGap[];
  openItems: PhilosophyAestheticsGap[];
  topItems: PhilosophyAestheticsGap[];
};

function hasAll(values: readonly string[], expected: readonly string[]) {
  const set = new Set(values);
  return expected.every((item) => set.has(item));
}

function hasSome(values: readonly string[], expected: readonly string[]) {
  const set = new Set(values);
  return expected.some((item) => set.has(item));
}

function hasPath(values: readonly string[], pattern: RegExp) {
  return values.some((item) => pattern.test(item));
}

function statusEvidence(
  status: PhilosophyAestheticsGapStatus,
  evidence: string[],
) {
  return { status, evidence };
}

export const philosophyAestheticsRequirements: PhilosophyAestheticsRequirement[] = [
  {
    id: "CP-GOAL-001",
    pillar: "RELIABILITY_ETHICS",
    category: "mechanism",
    title: "Internal philosophy/aesthetics gap audit",
    principle:
      "The system should not only absorb external signals; it should inspect its own missing philosophical and aesthetic machinery.",
    expectedCapability:
      "A repeatable local audit produces reviewable gaps, artifacts, acceptance checks, and sandbox entrances.",
    missingIfAbsent:
      "The long-term goal depends on human memory instead of a durable observe-and-propose loop.",
    proposalKind: "ENGINEERING_TASK_PROPOSAL",
    severity: "important",
    suggestedArtifacts: [
      "gap-audit manifest",
      "JiEvent review signals",
      "sandbox rehearsal inputs",
      "engineering task list",
    ],
    acceptanceCheck:
      "A CLI and observe surface show open philosophy/aesthetics gaps without promoting canonical nodes.",
    reviewPath:
      "Review as an operational monitor before deciding which gap becomes implementation work.",
    sandboxMode: "SONATA",
    worldlineKey: "HOPEPUNK_REPAIR",
    evaluate: (evidence) =>
      statusEvidence(
        evidence.hasPhilosophyGapAudit ? "covered" : "gap",
        [
          evidence.hasPhilosophyGapAudit
            ? "gap audit module is available"
            : "gap audit module is missing",
        ],
      ),
  },
  {
    id: "CP-GOAL-002",
    pillar: "AI_NON_SOVEREIGNTY",
    category: "governance_boundary",
    title: "AI mainline remains review-only",
    principle:
      "AI can mature into responsibility signals, but it cannot unlock its own sovereignty.",
    expectedCapability:
      "Responsibility maturity exists, auto-unlock is disabled, and UI states keep the gate visible.",
    missingIfAbsent:
      "AI usefulness may silently become authority, creating the sycophancy and priesthood failure mode the system rejects.",
    proposalKind: "ETHICAL_INVARIANT_PROPOSAL",
    severity: "critical",
    suggestedArtifacts: [
      "AI mainline review packet",
      "maturity evidence checklist",
      "permission boundary test",
    ],
    acceptanceCheck:
      "High AI maturity can only produce a review proposal; no code path auto-unlocks AI mainline.",
    reviewPath: "Review as Ethical Kernel invariant and AI Pool permission test.",
    sandboxMode: "SYMPHONY",
    worldlineKey: "AI_DIRECTED_WORLD",
    evaluate: (evidence) => {
      const covered =
        evidence.hasResponsibilityMaturity &&
        evidence.aiMainlineAutoUnlockDisabled &&
        hasPath(evidence.routes, /^\/observe$/);
      return statusEvidence(covered ? "covered" : "gap", [
        `responsibility maturity: ${evidence.hasResponsibilityMaturity}`,
        `auto unlock disabled: ${evidence.aiMainlineAutoUnlockDisabled}`,
        `observe route: ${hasPath(evidence.routes, /^\/observe$/)}`,
      ]);
    },
  },
  {
    id: "CP-GOAL-003",
    pillar: "SOULFUL_DATA",
    category: "protocol",
    title: "Soulful data consent and repair protocol",
    principle:
      "Data has soul when provenance, lived context, consent boundary, traceability, repairability, and human responsibility remain visible.",
    expectedCapability:
      "SoulfulDataAssessment exists and reviewers can see weak signals before promotion.",
    missingIfAbsent:
      "The system may ingest meaningful data as extractive nutrition instead of accountable relation.",
    proposalKind: "ETHICAL_INVARIANT_PROPOSAL",
    severity: "critical",
    suggestedArtifacts: [
      "consent boundary checklist",
      "repair path UI",
      "SoulfulDataAssessment fixture set",
    ],
    acceptanceCheck:
      "Low provenance or repairability blocks auto-promotion and appears as a review signal.",
    reviewPath: "Review as protocol and UI affordance for JiEvent and corpus intake.",
    sandboxMode: "FUGUE",
    worldlineKey: "OTHERNESS_MIRROR",
    evaluate: (evidence) => {
      const hasUi = hasAll(evidence.routes, ["/ecosystem", "/observe"]);
      if (evidence.hasSoulfulDataAssessment && hasUi) {
        return statusEvidence("covered", [
          "SoulfulDataAssessment exists",
          "/ecosystem and /observe expose review signals",
        ]);
      }
      return statusEvidence(evidence.hasSoulfulDataAssessment ? "partial" : "gap", [
        `SoulfulDataAssessment: ${evidence.hasSoulfulDataAssessment}`,
        `review UI routes: ${hasUi}`,
      ]);
    },
  },
  {
    id: "CP-GOAL-004",
    pillar: "HOPEPUNK_REPAIR",
    category: "mechanism",
    title: "Repair queue after failure",
    principle:
      "Hopepunk is not optimism; it is accountable repair capacity after a mechanism fails.",
    expectedCapability:
      "Sandbox lessons, failed AI cycles, failed checks, and weak soulful data signals can become explicit repair proposals.",
    missingIfAbsent:
      "The system can diagnose damage but lacks a visible path to repair.",
    proposalKind: "RFC_DRAFT_PROPOSAL",
    severity: "important",
    suggestedArtifacts: [
      "repair proposal queue",
      "failed-cycle triage lane",
      "sandbox lesson follow-up RFC",
    ],
    acceptanceCheck:
      "A failed or warning state creates a reviewable repair proposal rather than silent dashboard noise.",
    reviewPath: "Review as RFC and workflow surface for post-failure repair.",
    sandboxMode: "SONATA",
    worldlineKey: "HOPEPUNK_REPAIR",
    evaluate: (evidence) => {
      const hasWorldline = evidence.worldlineKeys.includes("HOPEPUNK_REPAIR");
      const hasProposalLane = evidence.proposalLaneKinds.includes("RFC_DRAFT_PROPOSAL");
      const hasLatestRepairRun =
        evidence.latestRepairQueueStatus !== undefined &&
        evidence.latestRepairQueueStatus !== "missing";
      const repairProposals =
        evidence.latestRepairQueueItems === 0
          ? evidence.latestRepairQueueStatus === "pass"
          : evidence.latestRepairQueueJiEvents > 0;
      return statusEvidence(
        hasWorldline &&
          hasProposalLane &&
          evidence.hasRepairQueueScript &&
          hasLatestRepairRun &&
          repairProposals
          ? "covered"
          : hasWorldline && hasProposalLane
            ? "partial"
            : "gap",
        [
          `hopepunk worldline: ${hasWorldline}`,
          `RFC proposal lane: ${hasProposalLane}`,
          `repair queue script: ${evidence.hasRepairQueueScript}`,
          `latest repair queue status: ${evidence.latestRepairQueueStatus ?? "missing"}`,
          `latest repair queue items: ${evidence.latestRepairQueueItems}`,
          `latest repair queue JiEvents: ${evidence.latestRepairQueueJiEvents}`,
          `latest repair queue sandboxes: ${evidence.latestRepairQueueSandboxRuns}`,
        ],
      );
    },
  },
  {
    id: "CP-GOAL-005",
    pillar: "HUMANISM",
    category: "interface",
    title: "Reviewer-centered human responsibility cockpit",
    principle:
      "Human responsibility should be ergonomic, not ceremonial; reviewers need clear choices, costs, evidence, and reversibility.",
    expectedCapability:
      "/ecosystem groups typed proposals and makes import, sandbox, RFC, and dismiss actions visible.",
    missingIfAbsent:
      "Review gates become moral theater: present in principle, too clumsy to use well.",
    proposalKind: "AESTHETIC_SURFACE_PROPOSAL",
    severity: "important",
    suggestedArtifacts: [
      "review lane grouping",
      "decision cost copy",
      "reviewer workload counters",
    ],
    acceptanceCheck:
      "The reviewer can distinguish ethical, aesthetic, RFC, essay, and engineering proposals at a glance.",
    reviewPath: "Review as operation-surface design and e2e smoke coverage.",
    sandboxMode: "SYMPHONY",
    worldlineKey: "STELLAR_COMMONWEALTH",
    evaluate: (evidence) => {
      const routes = hasAll(evidence.routes, ["/ecosystem", "/flow", "/observe"]);
      const lanes = hasAll(evidence.proposalLaneKinds, [
        "ETHICAL_INVARIANT_PROPOSAL",
        "AESTHETIC_SURFACE_PROPOSAL",
        "RFC_DRAFT_PROPOSAL",
        "ESSAY_NOTE_PROPOSAL",
        "ENGINEERING_TASK_PROPOSAL",
      ]);
      return statusEvidence(routes && lanes ? "covered" : "partial", [
        `operation routes: ${routes}`,
        `typed proposal lanes: ${lanes}`,
      ]);
    },
  },
  {
    id: "CP-GOAL-006",
    pillar: "ARTISTIC_OPERATION_SURFACE",
    category: "interface",
    title: "Artistic but legible control surface",
    principle:
      "The interface should feel like a living meaning instrument without hiding operational truth.",
    expectedCapability:
      "/flow, /observe, /sandbox, and /ecosystem express the world while staying scannable and testable.",
    missingIfAbsent:
      "The system becomes either pretty decoration or dry admin software, missing the aesthetic thesis.",
    proposalKind: "AESTHETIC_SURFACE_PROPOSAL",
    severity: "important",
    suggestedArtifacts: [
      "visual language tokens",
      "route screenshot smoke",
      "aesthetic regression checklist",
    ],
    acceptanceCheck:
      "Core routes have domain-specific panels and e2e/browser smoke checks for their primary signals.",
    reviewPath: "Review as design-system and browser-smoke task.",
    sandboxMode: "SONATA",
    worldlineKey: "RETURN_HOME",
    evaluate: (evidence) => {
      const routes = hasAll(evidence.routes, ["/flow", "/observe", "/sandbox", "/ecosystem"]);
      const e2e = hasPath(evidence.tests, /e2e\/crystal-pool\.spec\.ts$/);
      const smoke = evidence.hasAestheticSmokeScript;
      return statusEvidence(routes && e2e && smoke ? "covered" : routes && e2e ? "partial" : "gap", [
        `core routes: ${routes}`,
        `e2e route smoke: ${e2e}`,
        `aesthetic smoke script: ${smoke}`,
      ]);
    },
  },
  {
    id: "CP-GOAL-007",
    pillar: "WORLDLINE_SANDBOX",
    category: "protocol",
    title: "Worldline sandbox coverage matrix",
    principle:
      "Fugue, Sonata, and Symphony should combine with worldlines so philosophy rehearses failure, maturation, and survival.",
    expectedCapability:
      "All sandbox modes and core worldlines are available, with at least one recent philosophy/aesthetics sandbox rehearsal.",
    missingIfAbsent:
      "Worldlines remain lore labels instead of executable rehearsal protocols.",
    proposalKind: "RFC_DRAFT_PROPOSAL",
    severity: "important",
    suggestedArtifacts: [
      "worldline x mode matrix",
      "rehearsal coverage report",
      "missing combination RFCs",
    ],
    acceptanceCheck:
      "The audit can name which worldline/mode combinations have current rehearsals and which need review.",
    reviewPath: "Review as Sandbox protocol coverage RFC.",
    sandboxMode: "SYMPHONY",
    worldlineKey: "STELLAR_COMMONWEALTH",
    evaluate: (evidence) => {
      const modes = hasAll(evidence.sandboxModes, ["FUGUE", "SONATA", "SYMPHONY"]);
      const worldlines = hasAll(evidence.worldlineKeys, [
        "OTHERNESS_MIRROR",
        "RETURN_HOME",
        "DAO_GOVERNANCE",
        "HOPEPUNK_REPAIR",
        "FORK_DRIFT",
      ]);
      const rehearsals = evidence.philosophySandboxRuns > 0;
      return statusEvidence(
        modes && worldlines && rehearsals ? "partial" : "gap",
        [
          `sandbox modes: ${modes}`,
          `core worldlines: ${worldlines}`,
          `recent philosophy sandboxes: ${evidence.philosophySandboxRuns}`,
          "full coverage matrix: false",
        ],
      );
    },
  },
  {
    id: "CP-GOAL-008",
    pillar: "OPEN_CLOSED_DUAL_CORE",
    category: "governance_boundary",
    title: "Open core / closed shell compatibility boundary",
    principle:
      "The auditable ethical kernel must remain forkable even if deployment, hosting, or presentation becomes commercial.",
    expectedCapability:
      "Docs and checks explain what a fork may change without breaking Crystal Pool constitutional compatibility.",
    missingIfAbsent:
      "A copy can change parameters, weaken gates, and still claim the same moral legitimacy.",
    proposalKind: "ETHICAL_INVARIANT_PROPOSAL",
    severity: "important",
    suggestedArtifacts: [
      "compatibility badge criteria",
      "fork drift checklist",
      "open-core boundary RFC",
    ],
    acceptanceCheck:
      "A fork can be evaluated for review gates, proof locality, AI non-sovereignty, and repair commitments.",
    reviewPath: "Review as governance boundary and FORK_DRIFT sandbox suite.",
    sandboxMode: "SYMPHONY",
    worldlineKey: "FORK_DRIFT",
    evaluate: (evidence) => {
      const hasDoc = hasSome(evidence.docs, [
        "docs/philosophy/soulful-data-hopepunk-engineering.md",
        "docs/philosophy/ai-discussion-brief.md",
      ]);
      const hasWorldline = evidence.worldlineKeys.includes("FORK_DRIFT");
      return statusEvidence(hasDoc && hasWorldline ? "partial" : "gap", [
        `philosophy docs: ${hasDoc}`,
        `fork drift worldline: ${hasWorldline}`,
        "compatibility badge criteria: false",
      ]);
    },
  },
  {
    id: "CP-GOAL-009",
    pillar: "RELIABILITY_ETHICS",
    category: "test",
    title: "Reliability ethics gate",
    principle:
      "Reliability is not neutral plumbing; it is the ethical condition for trust.",
    expectedCapability:
      "Typecheck, lint, unit, build, e2e, and constitution checks are runnable and documented.",
    missingIfAbsent:
      "The system can speak beautifully while silently rotting.",
    proposalKind: "ENGINEERING_TASK_PROPOSAL",
    severity: "critical",
    suggestedArtifacts: [
      "full gate command list",
      "CI workflow",
      "constitution check fixture",
    ],
    acceptanceCheck:
      "The repository exposes all required gate scripts and CI runs them before merge.",
    reviewPath: "Review as CI and local gate maintenance.",
    sandboxMode: "FUGUE",
    worldlineKey: "DAO_GOVERNANCE",
    evaluate: (evidence) => {
      const scripts = hasAll(evidence.packageScripts, [
        "lint",
        "test",
        "build",
        "test:e2e",
        "constitution:check",
      ]);
      const tests = evidence.tests.length >= 20;
      return statusEvidence(scripts && tests ? "covered" : "gap", [
        `gate scripts: ${scripts}`,
        `test files: ${evidence.tests.length}`,
      ]);
    },
  },
  {
    id: "CP-GOAL-010",
    pillar: "HUMANISM",
    category: "article",
    title: "Shareable philosophy packet",
    principle:
      "The philosophy should be discussable by humans and AI without becoming fixed doctrine.",
    expectedCapability:
      "A canonical article and compact AI discussion brief exist in docs/philosophy.",
    missingIfAbsent:
      "The system's worldview stays trapped in chat residue and cannot be reviewed, forked, or challenged.",
    proposalKind: "ESSAY_NOTE_PROPOSAL",
    severity: "watch",
    suggestedArtifacts: [
      "public article",
      "AI discussion brief",
      "future booklet sections",
    ],
    acceptanceCheck:
      "Docs explain the philosophy, mechanism mapping, discussion prompts, and non-negotiable boundaries.",
    reviewPath: "Review as publication note, not doctrine.",
    sandboxMode: "SONATA",
    worldlineKey: "RETURN_HOME",
    evaluate: (evidence) => {
      const docs = hasAll(evidence.docs, [
        "docs/philosophy/soulful-data-hopepunk-engineering.md",
        "docs/philosophy/ai-discussion-brief.md",
      ]);
      return statusEvidence(docs ? "covered" : "partial", [
        `philosophy docs complete: ${docs}`,
      ]);
    },
  },
  {
    id: "CP-GOAL-011",
    pillar: "RELIABILITY_ETHICS",
    category: "protocol",
    title: "Typed proposal routing from exploration",
    principle:
      "Automatic exploration should create specific review artifacts, not an undifferentiated pile of notes.",
    expectedCapability:
      "Network/coding/philosophy candidates produce typed proposals and pending JiEvents.",
    missingIfAbsent:
      "Automation produces noise rather than actionable crystallization.",
    proposalKind: "ENGINEERING_TASK_PROPOSAL",
    severity: "important",
    suggestedArtifacts: [
      "proposal lanes",
      "review path copy",
      "acceptance checks",
    ],
    acceptanceCheck:
      "Pending JiEvents include typed proposal metadata and /ecosystem groups them by artifact path.",
    reviewPath: "Review as JiEvent and ecosystem lane protocol.",
    sandboxMode: "SONATA",
    worldlineKey: "DAO_GOVERNANCE",
    evaluate: (evidence) => {
      const proposals = evidence.typedReviewProposals > 0;
      const philosophy = evidence.philosophyReviewProposals > 0;
      const lanes = evidence.proposalLaneKinds.length >= 6;
      return statusEvidence(proposals && philosophy && lanes ? "covered" : "partial", [
        `typed JiEvent proposals: ${evidence.typedReviewProposals}`,
        `philosophy proposals: ${evidence.philosophyReviewProposals}`,
        `lane kinds: ${evidence.proposalLaneKinds.length}`,
      ]);
    },
  },
  {
    id: "CP-GOAL-012",
    pillar: "ARTISTIC_OPERATION_SURFACE",
    category: "test",
    title: "Aesthetic regression and screenshot evidence",
    principle:
      "Artistic UI work needs evidence, not vibes alone.",
    expectedCapability:
      "Browser smoke and screenshots can verify key surfaces after visual changes.",
    missingIfAbsent:
      "The app can regress back into generic dashboard shapes without tests noticing.",
    proposalKind: "AESTHETIC_SURFACE_PROPOSAL",
    severity: "watch",
    suggestedArtifacts: [
      "screenshot smoke script",
      "visual QA checklist",
      "route-specific design assertions",
    ],
    acceptanceCheck:
      "A local command captures /flow, /observe, /ecosystem, and /sandbox screenshots and records pass/fail notes.",
    reviewPath: "Review as UI testing task before declaring the aesthetic complete.",
    sandboxMode: "FUGUE",
    worldlineKey: "OTHERNESS_MIRROR",
    evaluate: (evidence) => {
      const script = evidence.hasAestheticSmokeScript;
      const latestPass = evidence.latestAestheticSmokeStatus === "pass";
      const routes = hasAll(evidence.latestAestheticSmokeRoutes, [
        "/flow",
        "/observe",
        "/ecosystem",
        "/sandbox",
      ]);
      const screenshots = evidence.latestAestheticSmokeScreenshots >= 8;
      return statusEvidence(
        script && latestPass && routes && screenshots
          ? "covered"
          : script
            ? "partial"
            : "gap",
        [
          `e2e present: ${hasPath(evidence.tests, /e2e\/crystal-pool\.spec\.ts$/)}`,
          `aesthetic smoke script: ${script}`,
          `latest smoke status: ${evidence.latestAestheticSmokeStatus ?? "missing"}`,
          `latest smoke routes: ${evidence.latestAestheticSmokeRoutes.join(", ") || "none"}`,
          `latest screenshots: ${evidence.latestAestheticSmokeScreenshots}`,
        ],
      );
    },
  },
];

const severityRank: Record<PhilosophyAestheticsGapSeverity, number> = {
  critical: 0,
  important: 1,
  watch: 2,
};

const statusRank: Record<PhilosophyAestheticsGapStatus, number> = {
  gap: 0,
  partial: 1,
  covered: 2,
};

export function evaluatePhilosophyAestheticsGoal({
  evidence,
  generatedAt = new Date().toISOString(),
}: {
  evidence: PhilosophyAestheticsGoalEvidence;
  generatedAt?: string;
}): PhilosophyAestheticsGoalAudit {
  const requirements = philosophyAestheticsRequirements.map((requirement) => {
    const result = requirement.evaluate(evidence);
    const { evaluate: _evaluate, ...rest } = requirement;
    void _evaluate;
    return {
      ...rest,
      status: result.status,
      evidence: result.evidence,
    };
  });
  const covered = requirements.filter((item) => item.status === "covered").length;
  const partial = requirements.filter((item) => item.status === "partial").length;
  const gaps = requirements.filter((item) => item.status === "gap").length;
  const coverageScore = Math.round(
    ((covered + partial * 0.5) / requirements.length) * 100,
  );
  const openItems = requirements
    .filter((item) => item.status !== "covered")
    .sort((a, b) => {
      const statusDelta = statusRank[a.status] - statusRank[b.status];
      if (statusDelta !== 0) return statusDelta;
      return severityRank[a.severity] - severityRank[b.severity];
    });

  return {
    generatedAt,
    coverageScore,
    covered,
    partial,
    gaps,
    criticalOpen: openItems.filter((item) => item.severity === "critical").length,
    requirements,
    openItems,
    topItems: openItems.slice(0, 6),
  };
}

function stableHash(input: unknown) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function candidateKindForGap(gap: PhilosophyAestheticsGap) {
  if (gap.proposalKind === "AESTHETIC_SURFACE_PROPOSAL") {
    return "aesthetic_interface_signal";
  }
  if (gap.proposalKind === "ESSAY_NOTE_PROPOSAL") {
    return "worldline_narrative_signal";
  }
  if (gap.proposalKind === "ENGINEERING_TASK_PROPOSAL") {
    return "reliability_ethics_signal";
  }
  if (gap.proposalKind === "RFC_DRAFT_PROPOSAL") {
    return "humanism_governance_signal";
  }
  return "ethical_philosophy_signal";
}

export function philosophyGapToJiEvent({
  gap,
  runId,
  occurredAt = new Date().toISOString(),
}: {
  gap: PhilosophyAestheticsGap;
  runId: string;
  occurredAt?: string;
}): JiEvent {
  const hash = stableHash({ runId, id: gap.id, status: gap.status });
  return {
    id: `philosophy-gap-${gap.id.toLowerCase()}-${hash.slice(0, 12)}`,
    sourceProject: "crystal-pool",
    kind: "manual.note",
    title: `Philosophy gap: ${gap.title}`,
    body: [
      "Domain: PHILOSOPHY_AESTHETICS",
      `Candidate kind: ${candidateKindForGap(gap)}`,
      `Proposal kind: ${gap.proposalKind}`,
      `Goal requirement: ${gap.id}`,
      `Pillar: ${gap.pillar}`,
      `Category: ${gap.category}`,
      `Status: ${gap.status}`,
      `Severity: ${gap.severity}`,
      `Review path: ${gap.reviewPath}`,
      `Acceptance check: ${gap.acceptanceCheck}`,
      "Suggested artifacts:",
      ...gap.suggestedArtifacts.map((artifact) => `- ${artifact}`),
      "",
      "Principle:",
      gap.principle,
      "",
      "Missing if absent:",
      gap.missingIfAbsent,
      "",
      "Current evidence:",
      ...gap.evidence.map((item) => `- ${item}`),
      "",
      "Boundary: this gap is a review signal only; it cannot promote canonical pool state.",
    ].join("\n"),
    occurredAt,
    refs: [
      { label: "goal-requirement", hash: gap.id },
      { label: "proposal-kind", hash: gap.proposalKind },
      { label: "worldline", hash: gap.worldlineKey },
    ],
    suggestedPhase: gap.status === "gap" ? "seed" : "liquid",
    ha: gap.severity === "critical" ? 6 : gap.severity === "important" ? 4 : 3,
  };
}

export function philosophyGapToSandboxInput(
  gap: PhilosophyAestheticsGap,
  sourceJiEventId?: string,
): SandboxRunInput {
  const base = {
    mode: gap.sandboxMode,
    title: `${gap.sandboxMode}: ${gap.title}`,
    description: `Philosophy/aesthetics gap rehearsal for ${gap.id}.`,
    worldlineKey: gap.worldlineKey,
    worldlineHypothesis: gap.principle,
    responsibilityQuestion: gap.acceptanceCheck,
    sourceJiEventIds: sourceJiEventId ? [sourceJiEventId] : [],
    inputMechanisms: [
      gap.category,
      gap.proposalKind,
      "Crystal Pool review gate",
    ],
    inputActors: ["maintainer", "reviewer", "future fork"],
  } satisfies Partial<SandboxRunInput>;

  if (gap.sandboxMode === "FUGUE") {
    return {
      ...base,
      mode: "FUGUE",
      exploitVector: gap.missingIfAbsent,
      observedFailure: `If ${gap.title} stays unresolved: ${gap.missingIfAbsent}`,
      proposedPatch: gap.acceptanceCheck,
    };
  }

  if (gap.sandboxMode === "SONATA") {
    return {
      ...base,
      mode: "SONATA",
      theme: gap.expectedCapability,
      counterTheme: gap.missingIfAbsent,
      proposedRevision: gap.acceptanceCheck,
      rfcDraft: philosophyGapToRfcDraft(gap),
    };
  }

  return {
    ...base,
    mode: "SYMPHONY",
    openingState:
      "Crystal Pool already has JiEvent review, Sandbox protocols, Ethical Kernel checks, and philosophy/aesthetics exploration lanes.",
    firstShock: `${gap.id} remains ${gap.status}.`,
    escalation: gap.missingIfAbsent,
    counterpoint:
      "Automation can propose artifacts, but canonical truth still requires human review.",
    collapseOrStabilization:
      "The world stabilizes when the gap becomes an RFC, design proposal, invariant, essay note, or engineering task with tests.",
    lessons: [
      gap.principle,
      "A missing boundary is itself a signal that must enter review before it becomes doctrine.",
    ],
    constitutionalPatch: gap.acceptanceCheck,
  };
}

export function philosophyGapToRfcDraft(gap: PhilosophyAestheticsGap) {
  return [
    `# RFC Draft: ${gap.title}`,
    "",
    `- requirement: ${gap.id}`,
    `- pillar: ${gap.pillar}`,
    `- category: ${gap.category}`,
    `- status: ${gap.status}`,
    `- proposalKind: ${gap.proposalKind}`,
    "",
    "## Principle",
    gap.principle,
    "",
    "## Expected Capability",
    gap.expectedCapability,
    "",
    "## Failure Mode",
    gap.missingIfAbsent,
    "",
    "## Suggested Artifacts",
    ...gap.suggestedArtifacts.map((artifact) => `- ${artifact}`),
    "",
    "## Acceptance Check",
    gap.acceptanceCheck,
    "",
    "## Sandbox Rehearsal",
    `- mode: ${gap.sandboxMode}`,
    `- worldline: ${gap.worldlineKey}`,
    "",
    "## Boundary",
    "This RFC is a local review draft. It does not create canonical nodes, unlock AI mainline, upload anchors, or change governance by itself.",
  ].join("\n");
}

export function generatePhilosophyAestheticsGoalReport(
  audit: PhilosophyAestheticsGoalAudit,
) {
  const openLines = audit.openItems.length
    ? audit.openItems.map(
        (item) =>
          `- ${item.status.toUpperCase()} ${item.id} [${item.severity}/${item.category}/${item.proposalKind}] ${item.title}`,
      )
    : ["- No open gaps."];
  const coveredLines = audit.requirements
    .filter((item) => item.status === "covered")
    .map((item) => `- ${item.id} ${item.title}`);

  return [
    "# Crystal Pool Philosophy / Aesthetics Goal Audit",
    "",
    `- generatedAt: ${audit.generatedAt}`,
    `- coverageScore: ${audit.coverageScore}/100`,
    `- covered: ${audit.covered}`,
    `- partial: ${audit.partial}`,
    `- gaps: ${audit.gaps}`,
    `- criticalOpen: ${audit.criticalOpen}`,
    "",
    "## Open Review Items",
    ...openLines,
    "",
    "## Covered Items",
    ...(coveredLines.length ? coveredLines : ["- None yet."]),
    "",
    "## Boundary",
    "This audit is observe + propose only. It may create JiEvents, sandbox rehearsals, RFC drafts, design proposals, and engineering task proposals, but it must not promote canonical pool state.",
  ].join("\n");
}
