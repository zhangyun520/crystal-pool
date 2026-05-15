import { z } from "zod";
import {
  cleanOptionalWorldlineKey,
  worldlineProtocols,
  type WorldlineKey,
} from "./worldline";

export const sandboxModes = ["FUGUE", "SONATA", "SYMPHONY"] as const;
export type SandboxMode = (typeof sandboxModes)[number];

export const sandboxStatuses = [
  "draft",
  "running",
  "completed",
  "archived",
] as const;
export type SandboxStatus = (typeof sandboxStatuses)[number];

export const sandboxModeSchema = z.enum(sandboxModes);

export const sandboxModeDetails: Record<
  SandboxMode,
  {
    label: string;
    nativeLabel: string;
    description: string;
    philosophy: string;
  }
> = {
  FUGUE: {
    label: "Fugue",
    nativeLabel: "赋格",
    description: "Mechanism failure rehearsal.",
    philosophy: "Fugue shows how the Pool fails.",
  },
  SONATA: {
    label: "Sonata",
    nativeLabel: "奏鸣",
    description: "Theme maturation through conflict.",
    philosophy: "Sonata shows how a theme matures.",
  },
  SYMPHONY: {
    label: "Symphony",
    nativeLabel: "交响",
    description: "System-level resonance and survival rehearsal.",
    philosophy: "Symphony shows how the Pool survives as a world.",
  },
};

export type SandboxLearningImportPolicy =
  | "explicit_learning_proposal"
  | "review_queue_required";

export const sandboxModeProtocols: Record<
  SandboxMode,
  {
    mode: SandboxMode;
    semantics: string;
    validation: string;
    outputKind: SandboxOutput["kind"];
    reportTemplate: "fugue" | "sonata" | "symphony";
    replayShape: readonly string[];
    learningImportPolicy: SandboxLearningImportPolicy;
  }
> = {
  FUGUE: {
    mode: "FUGUE",
    semantics:
      "Counterpoint, inversion, adversarial pressure, and distorted incentives expose how a mechanism fails.",
    validation: "Requires at least one target mechanism or node.",
    outputKind: "failure_path",
    reportTemplate: "fugue",
    replayShape: ["Target", "Exploit vector", "Observed failure", "Proposed patch"],
    learningImportPolicy: "explicit_learning_proposal",
  },
  SONATA: {
    mode: "SONATA",
    semantics:
      "A theme meets structured conflict, returns transformed, and crystallizes as a revision, RFC, or graph proposal.",
    validation: "Requires a theme; counter-theme is recommended.",
    outputKind: "development_arc",
    reportTemplate: "sonata",
    replayShape: ["Exposition", "Development", "Recapitulation", "Coda"],
    learningImportPolicy: "review_queue_required",
  },
  SYMPHONY: {
    mode: "SYMPHONY",
    semantics:
      "Multiple mechanisms, actors, pools, and shocks rehearse resonance, cascade, recovery, and constitutional repair.",
    validation: "Requires at least two mechanisms or actor groups.",
    outputKind: "systemic_diagnosis",
    reportTemplate: "symphony",
    replayShape: [
      "Opening State",
      "First Shock",
      "Escalation",
      "Counterpoint",
      "Collapse or Stabilization",
      "Lessons",
      "Constitutional Patch",
    ],
    learningImportPolicy: "review_queue_required",
  },
};

export type SonataSection =
  | "EXPOSITION"
  | "DEVELOPMENT"
  | "RECAPITULATION"
  | "CODA";

export type SymphonyMovement =
  | "OPENING_STATE"
  | "FIRST_SHOCK"
  | "ESCALATION"
  | "COUNTERPOINT"
  | "COLLAPSE_OR_STABILIZATION"
  | "LESSONS"
  | "CONSTITUTIONAL_PATCH";

export type FugueFailurePathOutput = {
  kind: "failure_path";
  title: string;
  mechanism: string;
  exploitVector?: string;
  observedFailure: string;
  proposedPatch?: string;
};

export type SonataDevelopmentArcOutput = {
  kind: "development_arc";
  sections: {
    exposition: {
      theme: string;
      counterTheme?: string;
    };
    development: {
      tensions: string[];
      failureRisks?: string[];
    };
    recapitulation: {
      transformedTheme: string;
    };
    coda: {
      proposedRevision?: string;
      graphEffectProposalId?: string;
      rfcDraft?: string;
    };
  };
};

export type SymphonySystemicDiagnosisOutput = {
  kind: "systemic_diagnosis";
  movements: {
    openingState: string;
    firstShock: string;
    escalation: string;
    counterpoint?: string;
    collapseOrStabilization: string;
    lessons: string[];
    constitutionalPatch?: string;
  };
  affectedMechanisms: string[];
  affectedActors?: string[];
  proposedRfc?: string;
};

export type SandboxOutput =
  | FugueFailurePathOutput
  | SonataDevelopmentArcOutput
  | SymphonySystemicDiagnosisOutput;

export type SandboxDiagnostic = {
  level: "info" | "warning" | "error";
  title: string;
  detail: string;
};

export type SandboxRun = {
  id: string;
  mode: SandboxMode;
  title: string;
  description?: string;
  status: SandboxStatus;
  createdAt: string;
  updatedAt: string;
  inputNodes?: string[];
  inputActors?: string[];
  inputMechanisms?: string[];
  outputs: SandboxOutput[];
  diagnostics: SandboxDiagnostic[];
};

export type SandboxRunInput = {
  mode: SandboxMode | string;
  title?: string;
  description?: string;
  scenarioKey?: string;
  worldlineKey?: WorldlineKey | string;
  worldlineHypothesis?: string;
  responsibilityQuestion?: string;
  sourceJiEventIds?: string[];
  targetMechanism?: string;
  inputNodes?: string[];
  inputActors?: string[];
  inputMechanisms?: string[];
  theme?: string;
  counterTheme?: string;
  exploitVector?: string;
  observedFailure?: string;
  proposedPatch?: string;
  proposedRevision?: string;
  graphEffectProposalId?: string;
  rfcDraft?: string;
  openingState?: string;
  firstShock?: string;
  escalation?: string;
  counterpoint?: string;
  collapseOrStabilization?: string;
  lessons?: string[];
  constitutionalPatch?: string;
  proposedRfc?: string;
};

export type ValidatedSandboxRunInput = Omit<
  SandboxRunInput,
  | "mode"
  | "title"
  | "worldlineKey"
  | "sourceJiEventIds"
  | "inputNodes"
  | "inputActors"
  | "inputMechanisms"
> & {
  mode: SandboxMode;
  title: string;
  worldlineKey?: WorldlineKey;
  sourceJiEventIds: string[];
  inputNodes: string[];
  inputActors: string[];
  inputMechanisms: string[];
};

const fugueFailurePathOutputSchema = z.object({
  kind: z.literal("failure_path"),
  title: z.string().min(1),
  mechanism: z.string().min(1),
  exploitVector: z.string().optional(),
  observedFailure: z.string().min(1),
  proposedPatch: z.string().optional(),
});

const sonataDevelopmentArcOutputSchema = z.object({
  kind: z.literal("development_arc"),
  sections: z.object({
    exposition: z.object({
      theme: z.string().min(1),
      counterTheme: z.string().optional(),
    }),
    development: z.object({
      tensions: z.array(z.string().min(1)),
      failureRisks: z.array(z.string().min(1)).optional(),
    }),
    recapitulation: z.object({
      transformedTheme: z.string().min(1),
    }),
    coda: z.object({
      proposedRevision: z.string().optional(),
      graphEffectProposalId: z.string().optional(),
      rfcDraft: z.string().optional(),
    }),
  }),
});

const symphonySystemicDiagnosisOutputSchema = z.object({
  kind: z.literal("systemic_diagnosis"),
  movements: z.object({
    openingState: z.string().min(1),
    firstShock: z.string().min(1),
    escalation: z.string().min(1),
    counterpoint: z.string().optional(),
    collapseOrStabilization: z.string().min(1),
    lessons: z.array(z.string().min(1)),
    constitutionalPatch: z.string().optional(),
  }),
  affectedMechanisms: z.array(z.string().min(1)),
  affectedActors: z.array(z.string().min(1)).optional(),
  proposedRfc: z.string().optional(),
});

export const sandboxOutputSchema = z.discriminatedUnion("kind", [
  fugueFailurePathOutputSchema,
  sonataDevelopmentArcOutputSchema,
  symphonySystemicDiagnosisOutputSchema,
]);

export const sandboxDiagnosticSchema = z.object({
  level: z.enum(["info", "warning", "error"]),
  title: z.string().min(1),
  detail: z.string().min(1),
});

function cleanText(value?: string | null) {
  const text = value?.trim();
  return text ? text : undefined;
}

export function cleanSandboxList(values?: readonly (string | null | undefined)[]) {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const value of values ?? []) {
    const text = cleanText(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    cleaned.push(text);
  }
  return cleaned;
}

export function parseSandboxMode(value: unknown): SandboxMode {
  const parsed = sandboxModeSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  throw new Error(
    `Invalid sandbox mode "${String(
      value,
    )}". Expected FUGUE, SONATA, or SYMPHONY.`,
  );
}

export function validateSandboxRunInput(
  input: SandboxRunInput,
): ValidatedSandboxRunInput {
  const mode = parseSandboxMode(input.mode);
  const inputNodes = cleanSandboxList(input.inputNodes);
  const inputActors = cleanSandboxList(input.inputActors);
  const inputMechanisms = cleanSandboxList([
    ...(input.inputMechanisms ?? []),
    input.targetMechanism,
  ]);
  const worldlineKey = cleanOptionalWorldlineKey(input.worldlineKey);
  const sourceJiEventIds = cleanSandboxList(input.sourceJiEventIds);
  const title =
    cleanText(input.title) ??
    cleanText(input.theme) ??
    (worldlineKey ? `${worldlineProtocols[worldlineKey].label} ${mode} rehearsal` : undefined) ??
    cleanText(input.scenarioKey) ??
    `${sandboxModeDetails[mode].label} Sandbox Run`;

  if (mode === "FUGUE" && inputMechanisms.length + inputNodes.length < 1) {
    throw new Error("FUGUE sandbox runs require at least one target mechanism or node.");
  }

  if (mode === "SONATA" && !cleanText(input.theme)) {
    throw new Error("SONATA sandbox runs require a theme.");
  }

  if (mode === "SYMPHONY" && inputMechanisms.length + inputActors.length < 2) {
    throw new Error(
      "SYMPHONY sandbox runs require at least two affected mechanisms or actor groups.",
    );
  }

  return {
    ...input,
    mode,
    title,
    description: cleanText(input.description),
    targetMechanism: cleanText(input.targetMechanism),
    scenarioKey: cleanText(input.scenarioKey),
    worldlineKey,
    worldlineHypothesis: cleanText(input.worldlineHypothesis),
    responsibilityQuestion: cleanText(input.responsibilityQuestion),
    sourceJiEventIds,
    theme: cleanText(input.theme),
    counterTheme: cleanText(input.counterTheme),
    exploitVector: cleanText(input.exploitVector),
    observedFailure: cleanText(input.observedFailure),
    proposedPatch: cleanText(input.proposedPatch),
    proposedRevision: cleanText(input.proposedRevision),
    graphEffectProposalId: cleanText(input.graphEffectProposalId),
    rfcDraft: cleanText(input.rfcDraft),
    openingState: cleanText(input.openingState),
    firstShock: cleanText(input.firstShock),
    escalation: cleanText(input.escalation),
    counterpoint: cleanText(input.counterpoint),
    collapseOrStabilization: cleanText(input.collapseOrStabilization),
    lessons: cleanSandboxList(input.lessons),
    constitutionalPatch: cleanText(input.constitutionalPatch),
    proposedRfc: cleanText(input.proposedRfc),
    inputNodes,
    inputActors,
    inputMechanisms,
  };
}

export function buildSandboxOutputs(input: SandboxRunInput): SandboxOutput[] {
  const run = validateSandboxRunInput(input);
  const worldline = run.worldlineKey
    ? worldlineProtocols[run.worldlineKey]
    : undefined;

  if (run.mode === "FUGUE") {
    const mechanism = run.inputMechanisms[0] ?? run.inputNodes[0];
    return [
      {
        kind: "failure_path",
        title: `${run.title} failure path`,
        mechanism,
        exploitVector:
          run.exploitVector ??
          worldline?.failureVector ??
          "Counterpoint, imitation, inversion, adversarial pressure, or distorted incentives.",
        observedFailure:
          run.observedFailure ??
          (worldline
            ? `${mechanism} is stressed through ${worldline.label}: ${worldline.failureVector}`
            : `${mechanism} is stressed until its protective intent can invert into a Pool failure mode.`),
        proposedPatch:
          run.proposedPatch ??
          worldline?.repairPrinciple ??
          "Require explicit review before any sandbox learning can affect the canonical pool.",
      },
    ];
  }

  if (run.mode === "SONATA") {
    const theme = run.theme ?? run.worldlineHypothesis ?? run.title;
    const counterTheme = run.counterTheme ?? run.responsibilityQuestion;
    const worldlineTension = worldline
      ? `${worldline.label} asks whether ${worldline.defaultResponsibilityQuestion}`
      : undefined;
    return [
      {
        kind: "development_arc",
        sections: {
          exposition: {
            theme,
            counterTheme,
          },
          development: {
            tensions: [
              counterTheme
                ? `${theme} must mature without erasing ${counterTheme}.`
                : `${theme} is placed under structured conflict until its hidden assumption appears.`,
              ...(worldlineTension ? [worldlineTension] : []),
              "Useful pressure should transform the theme without letting convenience become sovereignty.",
            ],
            failureRisks: [
              "The theme may harden into dogma before it has absorbed the counter-theme.",
              "The Pool may mistake a useful instrument for an authority.",
              ...(worldline ? [worldline.failureVector] : []),
            ],
          },
          recapitulation: {
            transformedTheme:
              run.proposedRevision ??
              worldline?.repairPrinciple ??
              `${theme} returns as a bounded mechanism with visible responsibility and reversible effects.`,
          },
          coda: {
            proposedRevision:
              run.proposedRevision ??
              worldline?.repairPrinciple ??
              "Codify the matured theme as a reviewable mechanism revision before promotion.",
            graphEffectProposalId: run.graphEffectProposalId,
            rfcDraft: run.rfcDraft,
          },
        },
      },
    ];
  }

  const affectedMechanisms = run.inputMechanisms;
  const affectedActors = run.inputActors.length ? run.inputActors : undefined;
  return [
    {
      kind: "systemic_diagnosis",
      movements: {
        openingState:
          run.openingState ??
          (worldline
            ? `${worldline.label} opens with ${affectedMechanisms.join(", ")} and asks: ${worldline.defaultHypothesis}`
            : undefined) ??
          `${affectedMechanisms.join(", ")} operate together inside the sandbox pool.`,
        firstShock:
          run.firstShock ??
          worldline?.failureVector ??
          "An external shock changes incentives faster than the Pool can deliberate.",
        escalation:
          run.escalation ??
          "Local optimizations begin to resonate into cross-mechanism pressure.",
        counterpoint:
          run.counterpoint ??
          run.responsibilityQuestion ??
          worldline?.defaultResponsibilityQuestion ??
          "A repair path appears only if actors can challenge the cascade without owning it.",
        collapseOrStabilization:
          run.collapseOrStabilization ??
          worldline?.repairPrinciple ??
          "The rehearsal stabilizes when recovery rules outrank momentum and factional legitimacy claims.",
        lessons:
          run.lessons && run.lessons.length
            ? run.lessons
            : worldline
              ? worldline.lessons
            : [
                "Systemic rehearsals must watch incentives across mechanisms, not only local failures.",
                "Recovery needs explicit authority boundaries before a shock arrives.",
              ],
        constitutionalPatch:
          run.constitutionalPatch ??
          (worldline ? `Constitutional patch: ${worldline.repairPrinciple}` : undefined) ??
          "Add a constitutional review checkpoint for cascades that cross multiple mechanisms or actor groups.",
      },
      affectedMechanisms,
      affectedActors,
      proposedRfc: run.proposedRfc,
    },
  ];
}

export function buildSandboxDiagnostics(
  input: ValidatedSandboxRunInput,
): SandboxDiagnostic[] {
  const worldlineDiagnostic = input.worldlineKey
    ? [
        {
          level: "info" as const,
          title: "Worldline rehearsal",
          detail: `${worldlineProtocols[input.worldlineKey].label} is active as a horizontal sandbox protocol. It does not replace ${input.mode}.`,
        },
      ]
    : [];
  if (input.mode === "FUGUE") {
    return [
      {
        level: "info",
        title: "Failure rehearsal",
        detail: "Fugue output stays sandboxed until explicitly promoted as a learning.",
      },
      ...worldlineDiagnostic,
    ];
  }

  if (input.mode === "SONATA") {
    return [
      {
        level: input.counterTheme ? "info" : "warning",
        title: "Development arc",
        detail: input.counterTheme
          ? "Theme and counter-theme are both present."
          : "A Sonata run can proceed without a counter-theme, but the arc is weaker.",
      },
      ...worldlineDiagnostic,
    ];
  }

  return [
    {
      level: "info",
      title: "System rehearsal",
      detail: "Symphony output tracks cascade pressure across mechanisms and actor groups.",
    },
    ...worldlineDiagnostic,
  ];
}

export type SandboxTimelineEvent = {
  kind:
    | "scenario_started"
    | "tick"
    | "pressure_spike"
    | "actor_action"
    | "system_observation"
    | "learning_proposed";
  tick: number;
  title: string;
  detail: string;
  payload: Record<string, unknown>;
};

export function buildSandboxTimeline({
  mode,
  title,
  outputs,
}: {
  mode: SandboxMode;
  title: string;
  outputs: SandboxOutput[];
}): SandboxTimelineEvent[] {
  const output = outputs[0];
  if (!output) {
    return [
      {
        kind: "scenario_started",
        tick: 1,
        title: `${title} started`,
        detail: sandboxModeDetails[mode].description,
        payload: { mode },
      },
    ];
  }

  if (output.kind === "development_arc") {
    return [
      {
        kind: "scenario_started",
        tick: 1,
        title: "Exposition",
        detail: output.sections.exposition.theme,
        payload: { mode, section: "EXPOSITION" satisfies SonataSection },
      },
      {
        kind: "pressure_spike",
        tick: 2,
        title: "Development",
        detail: output.sections.development.tensions.join(" "),
        payload: { mode, section: "DEVELOPMENT" satisfies SonataSection },
      },
      {
        kind: "system_observation",
        tick: 3,
        title: "Recapitulation",
        detail: output.sections.recapitulation.transformedTheme,
        payload: { mode, section: "RECAPITULATION" satisfies SonataSection },
      },
      {
        kind: "learning_proposed",
        tick: 4,
        title: "Coda",
        detail: output.sections.coda.proposedRevision ?? "Coda recorded.",
        payload: { mode, section: "CODA" satisfies SonataSection },
      },
    ];
  }

  if (output.kind === "systemic_diagnosis") {
    const movements: Array<[SymphonyMovement, string, string]> = [
      ["OPENING_STATE", "Opening State", output.movements.openingState],
      ["FIRST_SHOCK", "First Shock", output.movements.firstShock],
      ["ESCALATION", "Escalation", output.movements.escalation],
      ["COUNTERPOINT", "Counterpoint", output.movements.counterpoint ?? "No counterpoint recorded."],
      [
        "COLLAPSE_OR_STABILIZATION",
        "Collapse or Stabilization",
        output.movements.collapseOrStabilization,
      ],
      ["LESSONS", "Lessons", output.movements.lessons.join(" ")],
      [
        "CONSTITUTIONAL_PATCH",
        "Constitutional Patch",
        output.movements.constitutionalPatch ?? "No constitutional patch recorded.",
      ],
    ];
    return movements.map(([movement, movementTitle, detail], index) => ({
      kind:
        movement === "ESCALATION"
          ? "pressure_spike"
          : movement === "CONSTITUTIONAL_PATCH"
            ? "learning_proposed"
            : "system_observation",
      tick: index + 1,
      title: movementTitle,
      detail,
      payload: { mode, movement },
    }));
  }

  return [
    {
      kind: "scenario_started",
      tick: 1,
      title: `${title} started`,
      detail: output.mechanism,
      payload: { mode, mechanism: output.mechanism },
    },
    {
      kind: "pressure_spike",
      tick: 2,
      title: "Exploit vector",
      detail: output.exploitVector ?? "No exploit vector recorded.",
      payload: { mode },
    },
    {
      kind: "system_observation",
      tick: 3,
      title: "Observed failure",
      detail: output.observedFailure,
      payload: { mode },
    },
    {
      kind: "learning_proposed",
      tick: 4,
      title: "Proposed patch",
      detail: output.proposedPatch ?? "No patch proposed.",
      payload: { mode },
    },
  ];
}

function bulletList(items?: readonly string[]) {
  if (!items?.length) return "None recorded.";
  return items.map((item) => `- ${item}`).join("\n");
}

function sectionValue(value?: string) {
  return value?.trim() || "None recorded.";
}

export function generateSandboxReport({
  title,
  output,
  recommendedFollowup = "Review the sandbox output before promoting any learning into the canonical pool.",
}: {
  title: string;
  output: SandboxOutput;
  recommendedFollowup?: string;
}) {
  if (output.kind === "failure_path") {
    return [
      `# Fugue Report: ${title}`,
      "## Target Mechanism",
      output.mechanism,
      "## Failure Path",
      output.title,
      "## Exploit Vector",
      sectionValue(output.exploitVector),
      "## Observed Failure",
      output.observedFailure,
      "## Proposed Patch",
      sectionValue(output.proposedPatch),
      "## Recommended Follow-up",
      recommendedFollowup,
    ].join("\n\n");
  }

  if (output.kind === "development_arc") {
    return [
      `# Sonata Report: ${title}`,
      "## Exposition",
      "### Theme",
      output.sections.exposition.theme,
      "### Counter-theme",
      sectionValue(output.sections.exposition.counterTheme),
      "## Development",
      bulletList(output.sections.development.tensions),
      "## Recapitulation",
      output.sections.recapitulation.transformedTheme,
      "## Coda",
      sectionValue(output.sections.coda.rfcDraft),
      "## Proposed Revision",
      sectionValue(output.sections.coda.proposedRevision),
      "## Recommended Follow-up",
      recommendedFollowup,
    ].join("\n\n");
  }

  return [
    `# Symphony Report: ${title}`,
    "## Opening State",
    output.movements.openingState,
    "## First Shock",
    output.movements.firstShock,
    "## Escalation",
    output.movements.escalation,
    "## Counterpoint",
    sectionValue(output.movements.counterpoint),
    "## Collapse or Stabilization",
    output.movements.collapseOrStabilization,
    "## Lessons",
    bulletList(output.movements.lessons),
    "## Constitutional Patch",
    sectionValue(output.movements.constitutionalPatch),
    "## Recommended Follow-up",
    recommendedFollowup,
  ].join("\n\n");
}

export function generateSandboxReports({
  title,
  outputs,
}: {
  title: string;
  outputs: SandboxOutput[];
}) {
  return outputs
    .map((output) => generateSandboxReport({ title, output }))
    .join("\n\n---\n\n");
}

export function parseSandboxOutputs(value?: string | null): SandboxOutput[] {
  if (!value?.trim()) return [];
  const parsed = z.array(sandboxOutputSchema).safeParse(JSON.parse(value));
  if (parsed.success) return parsed.data;
  throw new Error("Stored sandbox outputs are not valid.");
}

export function parseSandboxDiagnostics(value?: string | null): SandboxDiagnostic[] {
  if (!value?.trim()) return [];
  const parsed = z.array(sandboxDiagnosticSchema).safeParse(JSON.parse(value));
  if (parsed.success) return parsed.data;
  throw new Error("Stored sandbox diagnostics are not valid.");
}

export function assertSandboxRunMutable(
  status: string,
  action: "mutate" | "archive" = "mutate",
) {
  if (status === "completed" && action !== "archive") {
    throw new Error(
      "Completed sandbox runs are immutable except for archival metadata.",
    );
  }
  if (status === "archived") {
    throw new Error("Archived sandbox runs are immutable.");
  }
}
