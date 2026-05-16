import { appendFile, mkdir, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  buildJiRfcDraft,
  dedupeJiEventLines,
  jiEventDefaultPhase,
  jiEventKinds,
  jiProposalLaneDetails,
  jiProposalLaneKinds,
  jiEventReviewTitle,
  jiEventToSandboxInput,
  jiKindLabels,
  jiReviewStatuses,
  jiSourceLabels,
  jiSourceProjects,
  parseJiEventJsonl,
  validateJiEvent,
  type JiEvent,
  type JiEventKind,
  type JiEventRef,
  type JiImportDiagnostic,
  type JiImportResult,
  type JiProposalLaneSummary,
  type JiReviewStatus,
  type JiSourceProject,
} from "@/lib/ji";
import {
  buildHumaneReviewTriage,
  type HumaneReviewTriageSummary,
} from "@/lib/reviewTriage";
import { type SandboxMode } from "@/lib/sandbox";
import { defaultPoolIds } from "@/lib/pools";
import { prisma, type DbClient } from "./db";
import { createContributionEvent } from "./market";
import { ensureDefaultPoolSpaces } from "./pools";
import { recalculateNodeScore } from "./scoring";
import { runSandboxProtocol } from "./sandbox";

export const ecosystemDataDir = path.join(process.cwd(), "data", "ecosystem");
export const jiInboxDir = path.join(ecosystemDataDir, "inbox");

export type EcosystemJiEvent = JiEvent & {
  status: JiReviewStatus;
  reviewAction?: string | null;
  reviewNote?: string | null;
  importedNodeId?: string | null;
  sandboxRunId?: string | null;
  rfcDraft?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
};

export type JiInboxSnapshot = {
  files: number;
  lines: number;
  validEvents: number;
  errors: number;
  bytes: number;
  diagnostics: JiImportDiagnostic[];
};

export type EcosystemDashboard = {
  generatedAt: string;
  inbox: JiInboxSnapshot;
  totals: {
    events: number;
    pending: number;
    imported: number;
    sandboxed: number;
    rfcDrafted: number;
    dismissed: number;
  };
  byStatus: Record<JiReviewStatus, number>;
  bySource: Record<JiSourceProject, number>;
  byKind: Record<JiEventKind, number>;
  proposalLanes: JiProposalLaneSummary<EcosystemJiEvent>[];
  triage: HumaneReviewTriageSummary;
  pending: EcosystemJiEvent[];
  recent: EcosystemJiEvent[];
};

type JiRecordLike = {
  id: string;
  sourceProject: string;
  kind: string;
  title: string;
  body: string;
  occurredAt: Date;
  refsJson: string;
  suggestedPhase: string | null;
  ha: number | null;
  status: string;
  reviewAction: string | null;
  reviewNote: string | null;
  importedNodeId: string | null;
  sandboxRunId: string | null;
  rfcDraft: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
};

async function ensureJiDirs() {
  await mkdir(jiInboxDir, { recursive: true });
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "ji-events";
}

async function safeReadText(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function parseRefsJson(value: string): JiEventRef[] {
  try {
    const parsed = z.array(z.object({
      label: z.string(),
      href: z.string().optional(),
      path: z.string().optional(),
      hash: z.string().optional(),
    })).safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function recordToJiEvent(record: JiRecordLike): EcosystemJiEvent {
  const event = validateJiEvent({
    id: record.id,
    sourceProject: record.sourceProject,
    kind: record.kind,
    title: record.title,
    body: record.body,
    occurredAt: record.occurredAt.toISOString(),
    refs: parseRefsJson(record.refsJson),
    suggestedPhase: record.suggestedPhase ?? undefined,
    ha: record.ha ?? undefined,
  });
  const status = z.enum(jiReviewStatuses).parse(record.status);
  return {
    ...event,
    status,
    reviewAction: record.reviewAction,
    reviewNote: record.reviewNote,
    importedNodeId: record.importedNodeId,
    sandboxRunId: record.sandboxRunId,
    rfcDraft: record.rfcDraft,
    createdAt: record.createdAt.toISOString(),
    reviewedAt: record.reviewedAt?.toISOString() ?? null,
  };
}

function jiEventCreateData(event: JiEvent) {
  return {
    id: event.id,
    sourceProject: event.sourceProject,
    kind: event.kind,
    title: event.title,
    body: event.body,
    occurredAt: new Date(event.occurredAt),
    refsJson: JSON.stringify(event.refs ?? []),
    suggestedPhase: event.suggestedPhase ?? null,
    ha: event.ha ?? null,
  };
}

function requirePending(event: EcosystemJiEvent) {
  if (event.status !== "pending") {
    throw new Error(
      `JiEvent ${event.id} is ${event.status}; reviewed events cannot be mutated except archival metadata.`,
    );
  }
}

async function getJiEventForReview(id: string, client: DbClient = prisma) {
  const record = await client.jiEventRecord.findUniqueOrThrow({ where: { id } });
  const event = recordToJiEvent(record);
  requirePending(event);
  return event;
}

async function addNodeTags(client: DbClient, nodeId: string, tags: string[]) {
  for (const name of Array.from(new Set(tags)).slice(0, 8)) {
    const tag = await client.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await client.nodeTag.upsert({
      where: { nodeId_tagId: { nodeId, tagId: tag.id } },
      update: {},
      create: { nodeId, tagId: tag.id },
    });
  }
}

export async function writeJiEventToInbox(
  input: unknown,
  options: { fileName?: string } = {},
) {
  await ensureJiDirs();
  const event = validateJiEvent(input);
  const fileName = sanitizeFileName(options.fileName ?? event.sourceProject);
  const filePath = path.join(jiInboxDir, `${fileName}.jsonl`);
  await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
  return { event, filePath };
}

export async function getJiInboxSnapshot(): Promise<JiInboxSnapshot> {
  await ensureJiDirs();
  const entries = await readdir(jiInboxDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
    .map((entry) => path.join(jiInboxDir, entry.name));
  const parsed = await Promise.all(
    files.map(async (filePath) => {
      const [text, size] = await Promise.all([
        safeReadText(filePath),
        stat(filePath).then((value) => value.size).catch(() => 0),
      ]);
      const result = parseJiEventJsonl(text, path.basename(filePath));
      return { ...result, size };
    }),
  );

  return {
    files: files.length,
    lines: parsed.reduce((sum, result) => sum + result.lines, 0),
    validEvents: parsed.reduce((sum, result) => sum + result.events.length, 0),
    errors: parsed.reduce((sum, result) => sum + result.diagnostics.length, 0),
    bytes: parsed.reduce((sum, result) => sum + result.size, 0),
    diagnostics: parsed.flatMap((result) => result.diagnostics).slice(0, 16),
  };
}

export async function importJiInbox(): Promise<JiImportResult> {
  await ensureJiDirs();
  const entries = await readdir(jiInboxDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
    .map((entry) => path.join(jiInboxDir, entry.name));
  const parsed = await Promise.all(
    files.map(async (filePath) => ({
      file: path.basename(filePath),
      parsed: parseJiEventJsonl(await safeReadText(filePath), path.basename(filePath)),
    })),
  );
  const validLines = parsed.flatMap(({ file, parsed: result }) =>
    result.events.map((line) => ({ ...line, file })),
  );
  const diagnostics = parsed.flatMap(({ parsed: result }) => result.diagnostics);
  const ids = Array.from(new Set(validLines.map((line) => line.event.id)));
  const existing = ids.length
    ? await prisma.jiEventRecord.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      })
    : [];
  const existingIds = new Set(existing.map((event) => event.id));
  const deduped = dedupeJiEventLines(validLines, existingIds);
  diagnostics.push(...deduped.diagnostics);

  const created = deduped.events.length
    ? await prisma.jiEventRecord.createMany({
        data: deduped.events.map(jiEventCreateData),
      })
    : { count: 0 };

  return {
    scannedFiles: files.length,
    scannedLines: parsed.reduce((sum, result) => sum + result.parsed.lines, 0),
    validEvents: validLines.length,
    importedEvents: created.count,
    duplicateEvents: deduped.duplicateEvents,
    diagnostics,
  };
}

export async function getEcosystemDashboard(): Promise<EcosystemDashboard> {
  const [
    inbox,
    totalEvents,
    pending,
    pendingCodingCoverage,
    pendingPhilosophyCoverage,
    proposalLaneCounts,
    proposalLaneSamples,
    recent,
    statusGroups,
    sourceGroups,
    kindGroups,
  ] = await Promise.all([
    getJiInboxSnapshot(),
    prisma.jiEventRecord.count(),
    prisma.jiEventRecord.findMany({
      where: { status: "pending" },
      orderBy: [{ createdAt: "desc" }, { occurredAt: "desc" }],
      take: 24,
    }),
    prisma.jiEventRecord.findMany({
      where: {
        status: "pending",
        body: { contains: "Domain: CODING_AUTOMATION" },
      },
      orderBy: [{ createdAt: "desc" }, { occurredAt: "desc" }],
      take: 6,
    }),
    prisma.jiEventRecord.findMany({
      where: {
        status: "pending",
        body: { contains: "Domain: PHILOSOPHY_AESTHETICS" },
      },
      orderBy: [{ createdAt: "desc" }, { occurredAt: "desc" }],
      take: 6,
    }),
    Promise.all(
      jiProposalLaneKinds.map((kind) =>
        prisma.jiEventRecord.count({
          where: {
            status: "pending",
            body: { contains: `Proposal kind: ${kind}` },
          },
        }),
      ),
    ),
    Promise.all(
      jiProposalLaneKinds.map((kind) =>
        prisma.jiEventRecord.findMany({
          where: {
            status: "pending",
            body: { contains: `Proposal kind: ${kind}` },
          },
          orderBy: [{ createdAt: "desc" }, { occurredAt: "desc" }],
          take: 3,
        }),
      ),
    ),
    prisma.jiEventRecord.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 12,
    }),
    prisma.jiEventRecord.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.jiEventRecord.groupBy({
      by: ["sourceProject"],
      _count: { sourceProject: true },
    }),
    prisma.jiEventRecord.groupBy({
      by: ["kind"],
      _count: { kind: true },
    }),
  ]);
  const byStatus = Object.fromEntries(
    jiReviewStatuses.map((status) => [
      status,
      statusGroups.find((group) => group.status === status)?._count.status ?? 0,
    ]),
  ) as Record<JiReviewStatus, number>;
  const bySource = Object.fromEntries(
    jiSourceProjects.map((source) => [
      source,
      sourceGroups.find((group) => group.sourceProject === source)?._count
        .sourceProject ?? 0,
    ]),
  ) as Record<JiSourceProject, number>;
  const byKind = Object.fromEntries(
    jiEventKinds.map((kind) => [
      kind,
      kindGroups.find((group) => group.kind === kind)?._count.kind ?? 0,
    ]),
  ) as Record<JiEventKind, number>;
  const proposalLanes = jiProposalLaneKinds.map((kind, index) => ({
    kind,
    ...jiProposalLaneDetails[kind],
    count: proposalLaneCounts[index] ?? 0,
    events: (proposalLaneSamples[index] ?? []).map(recordToJiEvent),
  })) satisfies JiProposalLaneSummary<EcosystemJiEvent>[];
  const pendingEvents = Array.from(
    new Map(
      [...pendingPhilosophyCoverage, ...pendingCodingCoverage, ...pending].map(
        (event) => [event.id, event],
      ),
    ).values(),
  )
    .slice(0, 24)
    .map(recordToJiEvent);

  return {
    generatedAt: new Date().toISOString(),
    inbox,
    totals: {
      events: totalEvents,
      pending: byStatus.pending,
      imported: byStatus.imported,
      sandboxed: byStatus.sandboxed,
      rfcDrafted: byStatus.rfc_drafted,
      dismissed: byStatus.dismissed,
    },
    byStatus,
    bySource,
    byKind,
    proposalLanes,
    triage: buildHumaneReviewTriage({
      events: pendingEvents,
      totalPending: byStatus.pending,
    }),
    pending: pendingEvents,
    recent: recent.map(recordToJiEvent),
  };
}

export async function listPendingJiEvents({
  take = 50,
}: {
  take?: number;
} = {}): Promise<EcosystemJiEvent[]> {
  const records = await prisma.jiEventRecord.findMany({
    where: { status: "pending" },
    orderBy: [{ createdAt: "desc" }, { occurredAt: "desc" }],
    take,
  });
  return records.map(recordToJiEvent);
}

export async function importJiEventAsNode(eventId: string) {
  await ensureDefaultPoolSpaces();
  return prisma.$transaction(async (tx) => {
    const event = await getJiEventForReview(eventId, tx);
    const phase = jiEventDefaultPhase(event);
    const node = await tx.crystalNode.create({
      data: {
        poolId: defaultPoolIds.canonical,
        title: event.title,
        body: [
          event.body,
          "",
          `Source JiEvent: ${event.id}`,
          `Source project: ${event.sourceProject}`,
          `Kind: ${event.kind}`,
        ].join("\n"),
        phase,
        publicness: event.kind === "artifact.published" ? 7 : 4,
        privateIntensity: event.kind === "publish.blocked" ? 6 : 3,
        emotionCuriosity: 6,
        emotionBoredom: event.kind === "ci.failed" ? 4 : 0,
        emotionHa: event.ha ?? (event.kind === "publish.blocked" ? 5 : 2),
        sourceType: "ecosystem",
        sourceRef: `ji:${event.id}`,
      },
    });
    await addNodeTags(tx, node.id, [
      "ji-event",
      `source:${event.sourceProject}`,
      `kind:${event.kind}`,
    ]);
    await tx.phaseEvent.create({
      data: {
        nodeId: node.id,
        fromPhase: null,
        toPhase: phase,
        reason: `Imported from reviewed JiEvent ${event.id}`,
      },
    });
    await createContributionEvent(tx, {
      alias: `ecosystem:${event.sourceProject}`,
      actorKind: "system",
      nodeId: node.id,
      kind: "feedback",
      body: `Reviewed JiEvent ${event.id}: ${event.body}`,
      weight: Math.max(1, Math.min(10, event.ha ?? 2)),
    });
    await recalculateNodeScore(node.id, tx);
    await tx.jiEventRecord.update({
      where: { id: event.id },
      data: {
        status: "imported",
        reviewAction: "create_node_and_contribution",
        reviewNote:
          "Created a canonical CrystalNode and deterministic local ContributionEvent after review.",
        importedNodeId: node.id,
        reviewedAt: new Date(),
      },
    });
    return node.id;
  });
}

export async function createSandboxFromJiEvent(eventId: string, mode: SandboxMode) {
  const event = await getJiEventForReview(eventId);
  const run = await runSandboxProtocol(jiEventToSandboxInput(event, mode));
  await prisma.jiEventRecord.update({
    where: { id: event.id },
    data: {
      status: "sandboxed",
      reviewAction: `create_${mode.toLowerCase()}_sandbox`,
      reviewNote: `Created ${mode} sandbox run from JiEvent ${event.id}.`,
      sandboxRunId: run.id,
      reviewedAt: new Date(),
    },
  });
  return run.id;
}

export async function draftRfcFromJiEvent(eventId: string) {
  const event = await getJiEventForReview(eventId);
  const rfcDraft = buildJiRfcDraft(event);
  await prisma.jiEventRecord.update({
    where: { id: event.id },
    data: {
      status: "rfc_drafted",
      reviewAction: "draft_rfc",
      reviewNote: "Generated a local RFC draft; not canonical until reviewed.",
      rfcDraft,
      reviewedAt: new Date(),
    },
  });
  return rfcDraft;
}

export async function dismissJiEvent(eventId: string, reason?: string) {
  const event = await getJiEventForReview(eventId);
  await prisma.jiEventRecord.update({
    where: { id: event.id },
    data: {
      status: "dismissed",
      reviewAction: "dismiss",
      reviewNote: reason?.trim() || "Dismissed from ecosystem review queue.",
      reviewedAt: new Date(),
    },
  });
}

export function describeJiEvent(event: JiEvent) {
  return {
    title: jiEventReviewTitle(event),
    source: jiSourceLabels[event.sourceProject],
    kind: jiKindLabels[event.kind],
    defaultPhase: jiEventDefaultPhase(event),
  };
}
