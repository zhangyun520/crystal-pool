import { z } from "zod";
import { phases, type Phase } from "./domain";
import { type SandboxMode } from "./sandbox";

export const jiSourceProjects = [
  "crystal-pool",
  "open-hermes",
  "houzuo-nianwu-mv",
  "yuehua-mv",
  "github",
  "chrome",
  "computer",
  "network",
] as const;

export type JiSourceProject = (typeof jiSourceProjects)[number];

export const jiEventKinds = [
  "artifact.rendered",
  "artifact.published",
  "publish.blocked",
  "audience.signal",
  "repo.changed",
  "ci.failed",
  "agent.cycle",
  "memory.learned",
  "sandbox.lesson",
  "manual.note",
] as const;

export type JiEventKind = (typeof jiEventKinds)[number];

export const jiReviewStatuses = [
  "pending",
  "imported",
  "sandboxed",
  "rfc_drafted",
  "dismissed",
] as const;

export type JiReviewStatus = (typeof jiReviewStatuses)[number];

export const jiEventRefSchema = z
  .object({
    label: z.string().trim().min(1).max(100),
    href: z.string().trim().max(1_000).optional(),
    path: z.string().trim().max(1_000).optional(),
    hash: z.string().trim().max(256).optional(),
  })
  .refine((ref) => ref.href || ref.path || ref.hash, {
    message: "JiEvent refs require at least one href, path, or hash.",
  });

export type JiEventRef = z.infer<typeof jiEventRefSchema>;

export const jiEventSchema = z.object({
  id: z.string().trim().min(1).max(160),
  sourceProject: z.enum(jiSourceProjects),
  kind: z.enum(jiEventKinds),
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(6_000),
  occurredAt: z.string().datetime(),
  refs: z.array(jiEventRefSchema).max(12).optional(),
  suggestedPhase: z.enum(phases).optional(),
  ha: z.number().min(0).max(10).optional(),
});

export type JiEvent = z.infer<typeof jiEventSchema>;

export type JiImportDiagnostic = {
  file?: string;
  line?: number;
  severity: "warning" | "error";
  code: "invalid_json" | "invalid_event" | "duplicate_event" | "import_error";
  message: string;
};

export type ParsedJiEventLine = {
  event: JiEvent;
  line: number;
};

export type ImportableJiEventLine = ParsedJiEventLine & {
  file?: string;
};

export type JiImportResult = {
  scannedFiles: number;
  scannedLines: number;
  validEvents: number;
  importedEvents: number;
  duplicateEvents: number;
  diagnostics: JiImportDiagnostic[];
};

export const jiSourceLabels: Record<
  JiSourceProject,
  { label: string; role: string; boundary: string }
> = {
  "crystal-pool": {
    label: "Crystal Pool",
    role: "母池",
    boundary: "Canonical truth lives here, but every external signal still passes review.",
  },
  "open-hermes": {
    label: "Hermes",
    role: "神经系统",
    boundary: "Hermes may emit JiEvent or suggestions, not mutate canonical pool state.",
  },
  "houzuo-nianwu-mv": {
    label: "后坐念物 MV",
    role: "创作触手",
    boundary: "Render, publish, blocker, and audience signals remain observations.",
  },
  "yuehua-mv": {
    label: "月华 MV",
    role: "创作触手",
    boundary: "Creative artifacts become reviewable signals before crystallization.",
  },
  github: {
    label: "GitHub",
    role: "外骨骼",
    boundary: "Repo, PR, CI, and release events cannot auto-merge or auto-release.",
  },
  chrome: {
    label: "Chrome",
    role: "真实平台窗口",
    boundary: "Authenticated page observations are refs, not canonical conclusions.",
  },
  computer: {
    label: "Computer Use",
    role: "本机操作臂",
    boundary: "Desktop UI actions produce observations only unless reviewed.",
  },
  network: {
    label: "Network",
    role: "高质量信息源",
    boundary: "Network signals are reviewed observations, not canonical truth.",
  },
};

export const jiKindLabels: Record<
  JiEventKind,
  { label: string; defaultPhase: Phase; lane: "signal" | "blocker" | "work" | "memory" }
> = {
  "artifact.rendered": {
    label: "Artifact rendered",
    defaultPhase: "seed",
    lane: "work",
  },
  "artifact.published": {
    label: "Artifact published",
    defaultPhase: "crystal",
    lane: "work",
  },
  "publish.blocked": {
    label: "Publish blocked",
    defaultPhase: "liquid",
    lane: "blocker",
  },
  "audience.signal": {
    label: "Audience signal",
    defaultPhase: "liquid",
    lane: "signal",
  },
  "repo.changed": {
    label: "Repo changed",
    defaultPhase: "seed",
    lane: "work",
  },
  "ci.failed": {
    label: "CI failed",
    defaultPhase: "liquid",
    lane: "blocker",
  },
  "agent.cycle": {
    label: "Agent cycle",
    defaultPhase: "liquid",
    lane: "signal",
  },
  "memory.learned": {
    label: "Memory learned",
    defaultPhase: "seed",
    lane: "memory",
  },
  "sandbox.lesson": {
    label: "Sandbox lesson",
    defaultPhase: "seed",
    lane: "memory",
  },
  "manual.note": {
    label: "Manual note",
    defaultPhase: "gas",
    lane: "signal",
  },
};

export function validateJiEvent(input: unknown): JiEvent {
  return jiEventSchema.parse(input);
}

export function parseJiEventJsonl(
  text: string,
  file?: string,
): { events: ParsedJiEventLine[]; diagnostics: JiImportDiagnostic[]; lines: number } {
  const events: ParsedJiEventLine[] = [];
  const diagnostics: JiImportDiagnostic[] = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((lineText, index) => {
    const line = index + 1;
    if (!lineText.trim()) return;
    let raw: unknown;
    try {
      raw = JSON.parse(lineText);
    } catch (error) {
      diagnostics.push({
        file,
        line,
        severity: "error",
        code: "invalid_json",
        message: error instanceof Error ? error.message : "Invalid JSON.",
      });
      return;
    }

    const parsed = jiEventSchema.safeParse(raw);
    if (!parsed.success) {
      diagnostics.push({
        file,
        line,
        severity: "error",
        code: "invalid_event",
        message: parsed.error.issues.map((issue) => issue.message).join("; "),
      });
      return;
    }
    events.push({ event: parsed.data, line });
  });

  return { events, diagnostics, lines: lines.filter((line) => line.trim()).length };
}

export function serializeJiEventJsonl(events: JiEvent[]) {
  return `${events.map((event) => JSON.stringify(validateJiEvent(event))).join("\n")}\n`;
}

export function dedupeJiEventLines(
  lines: ImportableJiEventLine[],
  existingIds: ReadonlySet<string> = new Set(),
) {
  const diagnostics: JiImportDiagnostic[] = [];
  const seenIds = new Set<string>();
  const events: JiEvent[] = [];
  let duplicateEvents = 0;

  for (const line of lines) {
    if (existingIds.has(line.event.id) || seenIds.has(line.event.id)) {
      duplicateEvents += 1;
      diagnostics.push({
        file: line.file,
        line: line.line,
        severity: "warning",
        code: "duplicate_event",
        message: `JiEvent ${line.event.id} is already in the ecosystem review queue.`,
      });
      continue;
    }
    seenIds.add(line.event.id);
    events.push(line.event);
  }

  return { events, duplicateEvents, diagnostics };
}

export function jiEventDefaultPhase(event: Pick<JiEvent, "kind" | "suggestedPhase">): Phase {
  return event.suggestedPhase ?? jiKindLabels[event.kind].defaultPhase;
}

export function jiEventReviewTitle(event: Pick<JiEvent, "sourceProject" | "kind" | "title">) {
  return `${jiSourceLabels[event.sourceProject].label} / ${jiKindLabels[event.kind].label}: ${event.title}`;
}

export function buildJiRfcDraft(event: JiEvent) {
  const refs = event.refs?.length
    ? event.refs
        .map((ref) => `- ${ref.label}${ref.href ? `: ${ref.href}` : ""}${ref.path ? ` (${ref.path})` : ""}${ref.hash ? ` [${ref.hash}]` : ""}`)
        .join("\n")
    : "- No refs recorded.";

  return [
    `# RFC Draft: ${event.title}`,
    "",
    "## Source JiEvent",
    `- id: ${event.id}`,
    `- sourceProject: ${event.sourceProject}`,
    `- kind: ${event.kind}`,
    `- occurredAt: ${event.occurredAt}`,
    "",
    "## Signal",
    event.body,
    "",
    "## Refs",
    refs,
    "",
    "## Proposed Review Question",
    "Should this trigger point become a CrystalNode, Sandbox rehearsal, proof-chain contribution, or be dismissed?",
    "",
    "## Boundary",
    "This RFC draft is not canonical until reviewed inside Crystal Pool.",
  ].join("\n");
}

export function jiEventToSandboxInput(event: JiEvent, mode: SandboxMode) {
  const title = `${mode}: ${event.title}`;
  const sourceLabel = jiSourceLabels[event.sourceProject].label;
  const kindLabel = jiKindLabels[event.kind].label;
  const mechanism = `${sourceLabel} ${kindLabel}`;
  const refs = event.refs?.map((ref) => ref.label).join(", ");

  if (mode === "FUGUE") {
    return {
      mode,
      title,
      description: `JiEvent ${event.id} failure rehearsal from ${event.sourceProject}.`,
      sourceJiEventIds: [event.id],
      inputMechanisms: [mechanism],
      observedFailure:
        event.kind === "publish.blocked" || event.kind === "ci.failed"
          ? event.body
          : `The signal could harden into an unreviewed canonical conclusion: ${event.body}`,
      exploitVector:
        event.kind === "audience.signal"
          ? "Audience metrics may overrule meaning review."
          : "External tool output may bypass pool review.",
      proposedPatch:
        "Keep the event in Ji review until a human reviewer promotes it into a node, contribution, sandbox lesson, or RFC.",
    };
  }

  if (mode === "SONATA") {
    return {
      mode,
      title,
      description: `JiEvent ${event.id} developmental arc from ${event.sourceProject}.`,
      sourceJiEventIds: [event.id],
      theme: event.title,
      counterTheme:
        event.kind === "publish.blocked" || event.kind === "ci.failed"
          ? "A blocked signal can reveal a stronger operating rule."
          : "A strong external signal still cannot own canonical meaning.",
      tensions: [
        event.body,
        `${sourceLabel} acts as ${jiSourceLabels[event.sourceProject].role}, while Crystal Pool remains the mother pool.`,
      ],
      failureRisks: [
        "Tool observations become conclusions without review.",
        "Project-local urgency overwhelms cross-project memory.",
      ],
      transformedTheme:
        "External trigger points mature when they remain traceable, reviewable, and sandboxable before entering the canonical pool.",
      proposedRevision:
        refs
          ? `Review JiEvent ${event.id} with refs: ${refs}.`
          : `Review JiEvent ${event.id} before canonical import.`,
    };
  }

  return {
    mode,
    title,
    description: `JiEvent ${event.id} systemic rehearsal from ${event.sourceProject}.`,
    sourceJiEventIds: [event.id],
    inputMechanisms: [
      `${sourceLabel} signal intake`,
      "Crystal Pool review queue",
      "Sandbox learning promotion",
    ],
    inputActors: [sourceLabel, "Crystal Pool reviewer"],
    openingState:
      "External projects submit trigger points as JiEvents while Crystal Pool remains the only canonical truth source.",
    firstShock: `${kindLabel}: ${event.title}`,
    escalation: event.body,
    counterpoint:
      "Tools, project adapters, and reviewers may disagree on whether the signal is evidence, urgency, or noise.",
    collapseOrStabilization:
      "The system stabilizes only if review creates an explicit node, contribution, RFC, or sandbox lesson instead of implicit mutation.",
    lessons: [
      "Every external trigger must keep source, refs, time, and review status.",
      "Browser, Chrome, Computer, Hermes, MV, and GitHub outputs are observations until promoted.",
    ],
    constitutionalPatch:
      "No external project may mutate canonical pool state directly; all cross-project life enters through JiEvent.",
  };
}
