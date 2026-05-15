"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { inspectCrystalPoolBackupText } from "@/lib/backup";
import { parseChatGptCorpusInput } from "@/lib/chatgptTranscript";
import {
  importReviewActions,
  normalizeReviewCommitItem,
} from "@/lib/importReview";
import { stableTextHash } from "@/lib/corpusTrail";
import { serializeJsonl } from "@/lib/jobManifest";
import { applyHaSoften } from "@/lib/phase";
import { contributionKinds, marketOrderSides } from "@/lib/market";
import { defaultPoolIds } from "@/lib/pools";
import {
  edgeRelations,
  phases,
  sourceTypes,
  type CrystalNodeCore,
} from "@/lib/domain";
import { type DbClient, prisma } from "./db";
import {
  createContributionEvent,
  createMarketOrder,
} from "./market";
import { recalculateManyNodeScores, recalculateNodeScore } from "./scoring";

const valueSchema = z.coerce.number().min(0).max(10).default(0);

const nodeFormSchema = z.object({
  title: z.string().trim().min(1).max(140),
  body: z.string().trim().min(1).max(4_000),
  phase: z.enum(phases).default("gas"),
  tags: z.string().optional(),
  publicness: valueSchema,
  privateIntensity: valueSchema,
  emotionFear: valueSchema,
  emotionCuriosity: valueSchema,
  emotionJoy: valueSchema,
  emotionBoredom: valueSchema,
  emotionHa: valueSchema,
  sourceType: z.enum(sourceTypes).default("manual"),
  sourceRef: z.string().trim().optional(),
});

const edgeFormSchema = z.object({
  fromId: z.string().min(1),
  toId: z.string().min(1),
  relation: z.enum(edgeRelations),
  weight: z.coerce.number().min(0).max(10).default(1),
});

const importCandidateSchema = z.object({
  title: z.string().trim().min(1).max(140),
  body: z.string().trim().min(1).max(4_000),
  phase: z.enum(phases),
  emotionHa: z.coerce.number().min(0).max(10).default(0),
  tags: z.array(z.string()).default([]),
});

const importReviewItemSchema = z.object({
  action: z.enum(importReviewActions),
  candidate: importCandidateSchema,
  targetNodeId: z.string().trim().optional(),
  edgeToNodeId: z.string().trim().optional(),
  relation: z.enum(edgeRelations).optional(),
  weight: z.coerce.number().min(0).max(10).optional(),
});

const archiveFormSchema = z.object({
  archiveReason: z.string().trim().max(500).optional(),
});

const mergeFormSchema = z.object({
  sourceId: z.string().min(1),
  mergeReason: z.string().trim().max(500).optional(),
});

const splitFormSchema = z.object({
  title: z.string().trim().min(1).max(140),
  body: z.string().trim().min(1).max(4_000),
  phase: z.enum(phases).default("gas"),
  tags: z.string().optional(),
});

const restoreBackupFormSchema = z.object({
  backupJson: z.string().trim().min(1),
  confirmRestore: z.literal("on"),
});

const chatGptCorpusFormSchema = z.object({
  title: z.string().trim().max(160).optional(),
  sourceRef: z.string().trim().max(500).optional(),
  transcript: z.string().trim().min(1).max(250_000),
});

const actorFieldsSchema = z.object({
  actorAlias: z.string().trim().min(1).max(80),
  publicKey: z.string().trim().max(240).optional(),
  url: z.string().trim().max(500).optional(),
});

const contributionFormSchema = actorFieldsSchema.extend({
  kind: z.enum(contributionKinds),
  body: z.string().trim().min(1).max(1_500),
  weight: z.coerce.number().min(0).max(10).default(1),
});

const marketOrderFormSchema = actorFieldsSchema.extend({
  side: z.enum(marketOrderSides),
  price: z.coerce.number().min(0).max(100).default(1),
  quantity: z.coerce.number().min(0.01).max(10_000).default(1),
  note: z.string().trim().max(500).optional(),
});

function backupRestoreErrorUrl(message: string) {
  return `/backup?restoreError=${encodeURIComponent(message)}`;
}

function formObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function tagNames(tags?: string | null) {
  return Array.from(
    new Set(
      (tags ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  );
}

async function replaceTags(client: DbClient, nodeId: string, names: string[]) {
  await client.nodeTag.deleteMany({ where: { nodeId } });
  for (const name of names) {
    const tag = await client.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await client.nodeTag.create({
      data: { nodeId, tagId: tag.id },
    });
  }
}

export async function createNodeAction(formData: FormData) {
  const parsed = nodeFormSchema.parse(formObject(formData));
  const createdNodeId = await prisma.$transaction(async (tx) => {
    const created = await tx.crystalNode.create({
      data: {
        poolId: defaultPoolIds.canonical,
        title: parsed.title,
        body: parsed.body,
        phase: parsed.phase,
        publicness: parsed.publicness,
        privateIntensity: parsed.privateIntensity,
        emotionFear: parsed.emotionFear,
        emotionCuriosity: parsed.emotionCuriosity,
        emotionJoy: parsed.emotionJoy,
        emotionBoredom: parsed.emotionBoredom,
        emotionHa: parsed.emotionHa,
        sourceType: parsed.sourceType,
        sourceRef: parsed.sourceRef || null,
      },
    });
    await replaceTags(tx, created.id, tagNames(parsed.tags));
    await tx.phaseEvent.create({
      data: {
        nodeId: created.id,
        fromPhase: null,
        toPhase: parsed.phase,
        reason: "Created from fragment form",
      },
    });
    await recalculateNodeScore(created.id, tx);
    return created.id;
  });
  revalidatePath("/");
  revalidatePath("/nodes");
  revalidatePath("/graph");
  redirect(`/nodes/${createdNodeId}`);
}

export async function updateNodeAction(nodeId: string, formData: FormData) {
  const parsed = nodeFormSchema.parse(formObject(formData));
  await prisma.$transaction(async (tx) => {
    const current = await tx.crystalNode.findUniqueOrThrow({
      where: { id: nodeId },
    });
    await tx.crystalNode.update({
      where: { id: nodeId },
      data: {
        title: parsed.title,
        body: parsed.body,
        phase: parsed.phase,
        publicness: parsed.publicness,
        privateIntensity: parsed.privateIntensity,
        emotionFear: parsed.emotionFear,
        emotionCuriosity: parsed.emotionCuriosity,
        emotionJoy: parsed.emotionJoy,
        emotionBoredom: parsed.emotionBoredom,
        emotionHa: parsed.emotionHa,
        sourceType: parsed.sourceType,
        sourceRef: parsed.sourceRef || null,
      },
    });
    if (current.phase !== parsed.phase) {
      await tx.phaseEvent.create({
        data: {
          nodeId,
          fromPhase: current.phase,
          toPhase: parsed.phase,
          reason: "Manual edit changed phase",
        },
      });
    }
    await replaceTags(tx, nodeId, tagNames(parsed.tags));
    await recalculateNodeScore(nodeId, tx);
  });
  revalidatePath("/");
  revalidatePath("/nodes");
  revalidatePath("/graph");
  revalidatePath(`/nodes/${nodeId}`);
  redirect(`/nodes/${nodeId}`);
}

export async function archiveNodeAction(nodeId: string, formData: FormData) {
  const parsed = archiveFormSchema.parse(formObject(formData));
  await prisma.$transaction(async (tx) => {
    const connectedEdges = await tx.crystalEdge.findMany({
      where: { OR: [{ fromId: nodeId }, { toId: nodeId }] },
      select: { fromId: true, toId: true },
    });
    const affectedNodeIds = connectedEdges
      .flatMap((edge) => [edge.fromId, edge.toId])
      .filter((id) => id !== nodeId);
    await tx.crystalNode.update({
      where: { id: nodeId },
      data: {
        archivedAt: new Date(),
        archiveReason: parsed.archiveReason || "Archived from node detail",
      },
    });
    await recalculateManyNodeScores(affectedNodeIds, tx);
  });
  revalidatePath("/");
  revalidatePath("/nodes");
  revalidatePath("/graph");
  redirect("/nodes");
}

export async function mergeNodeAction(targetNodeId: string, formData: FormData) {
  const parsed = mergeFormSchema.parse(formObject(formData));
  if (parsed.sourceId === targetNodeId) {
    throw new Error("A node cannot merge into itself.");
  }

  await prisma.$transaction(async (tx) => {
    const [target, source] = await Promise.all([
      tx.crystalNode.findUniqueOrThrow({
        where: { id: targetNodeId },
        include: { tags: { include: { tag: true } } },
      }),
      tx.crystalNode.findUniqueOrThrow({
        where: { id: parsed.sourceId },
        include: { tags: { include: { tag: true } } },
      }),
    ]);
    if (source.archivedAt) {
      throw new Error("Archived nodes cannot be merged as the source.");
    }

    const sourceEdges = await tx.crystalEdge.findMany({
      where: { OR: [{ fromId: source.id }, { toId: source.id }] },
    });
    const affectedIds = new Set<string>([target.id]);

    for (const edge of sourceEdges) {
      const fromId = edge.fromId === source.id ? target.id : edge.fromId;
      const toId = edge.toId === source.id ? target.id : edge.toId;
      if (fromId === toId) {
        await tx.crystalEdge.delete({ where: { id: edge.id } });
      } else {
        await tx.crystalEdge.update({
          where: { id: edge.id },
          data: { fromId, toId },
        });
        affectedIds.add(fromId);
        affectedIds.add(toId);
      }
    }

    const mergedTags = Array.from(
      new Set([
        ...target.tags.map((item) => item.tag.name),
        ...source.tags.map((item) => item.tag.name),
      ]),
    );
    await tx.crystalNode.update({
      where: { id: target.id },
      data: {
        body: `${target.body}\n\n---\nMerged from ${source.title}:\n${source.body}`,
        publicness: Math.max(target.publicness, source.publicness),
        privateIntensity: Math.max(
          target.privateIntensity,
          source.privateIntensity,
        ),
        emotionFear: Math.max(target.emotionFear, source.emotionFear),
        emotionCuriosity: Math.max(
          target.emotionCuriosity,
          source.emotionCuriosity,
        ),
        emotionJoy: Math.max(target.emotionJoy, source.emotionJoy),
        emotionBoredom: Math.max(target.emotionBoredom, source.emotionBoredom),
        emotionHa: Math.max(target.emotionHa, source.emotionHa),
      },
    });
    await replaceTags(tx, target.id, mergedTags);
    await tx.phaseEvent.create({
      data: {
        nodeId: target.id,
        fromPhase: target.phase,
        toPhase: target.phase,
        reason: `Merged "${source.title}" into this node${
          parsed.mergeReason ? `: ${parsed.mergeReason}` : ""
        }`,
      },
    });
    await tx.crystalNode.update({
      where: { id: source.id },
      data: {
        archivedAt: new Date(),
        archiveReason: `Merged into "${target.title}"`,
      },
    });
    await recalculateManyNodeScores(Array.from(affectedIds), tx);
  });

  revalidatePath("/");
  revalidatePath("/nodes");
  revalidatePath("/graph");
  revalidatePath(`/nodes/${targetNodeId}`);
  redirect(`/nodes/${targetNodeId}`);
}

export async function splitNodeAction(nodeId: string, formData: FormData) {
  const parsed = splitFormSchema.parse(formObject(formData));
  const createdId = await prisma.$transaction(async (tx) => {
    const source = await tx.crystalNode.findUniqueOrThrow({
      where: { id: nodeId },
    });
    const created = await tx.crystalNode.create({
      data: {
        poolId: source.poolId,
        title: parsed.title,
        body: parsed.body,
        phase: parsed.phase,
        publicness: source.publicness,
        privateIntensity: source.privateIntensity,
        emotionFear: source.emotionFear,
        emotionCuriosity: source.emotionCuriosity,
        emotionJoy: source.emotionJoy,
        emotionBoredom: source.emotionBoredom,
        emotionHa: source.emotionHa,
        sourceType: source.sourceType,
        sourceRef: `split:${source.id}`,
      },
    });
    await replaceTags(tx, created.id, tagNames(parsed.tags));
    await tx.crystalEdge.create({
      data: {
        fromId: source.id,
        toId: created.id,
        relation: "derives_from",
        weight: 1,
      },
    });
    await tx.phaseEvent.create({
      data: {
        nodeId: created.id,
        fromPhase: null,
        toPhase: parsed.phase,
        reason: `Split from "${source.title}"`,
      },
    });
    await tx.phaseEvent.create({
      data: {
        nodeId: source.id,
        fromPhase: source.phase,
        toPhase: source.phase,
        reason: `Split out "${created.title}"`,
      },
    });
    await recalculateManyNodeScores([source.id, created.id], tx);
    return created.id;
  });

  revalidatePath("/");
  revalidatePath("/nodes");
  revalidatePath("/graph");
  revalidatePath(`/nodes/${nodeId}`);
  redirect(`/nodes/${createdId}`);
}

export async function restoreBackupAction(formData: FormData) {
  const parsed = restoreBackupFormSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    redirect(
      backupRestoreErrorUrl(
        "Paste a Crystal Pool backup JSON and confirm replacement.",
      ),
    );
  }

  const inspection = inspectCrystalPoolBackupText(parsed.data.backupJson);
  if (!inspection.ok) {
    redirect(backupRestoreErrorUrl(inspection.message));
  }
  const backup = inspection.backup;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.fugueLearningProposal.deleteMany();
      await tx.fugueEvent.deleteMany();
      await tx.fugueRun.deleteMany();
      await tx.humanSuggestion.deleteMany();
      await tx.aIDecision.deleteMany();
      await tx.aIDirectorCycle.deleteMany();
      await tx.marketOrder.deleteMany();
      await tx.contributionEvent.deleteMany();
      await tx.chainAnchor.deleteMany();
      await tx.actor.deleteMany();
      await tx.phaseEvent.deleteMany();
      await tx.nodeTag.deleteMany();
      await tx.crystalEdge.deleteMany();
      await tx.tag.deleteMany();
      await tx.crystalNode.deleteMany();

      for (const node of backup.nodes) {
        await tx.crystalNode.create({
          data: {
            id: node.id,
            poolId: node.poolId,
            title: node.title,
            body: node.body,
            phase: node.phase,
            crystallizationScore: node.crystallizationScore,
            entropyResistance: node.entropyResistance,
            publicness: node.publicness,
            privateIntensity: node.privateIntensity,
            emotionFear: node.emotionFear,
            emotionCuriosity: node.emotionCuriosity,
            emotionJoy: node.emotionJoy,
            emotionBoredom: node.emotionBoredom,
            emotionHa: node.emotionHa,
            sourceType: node.sourceType,
            sourceRef: node.sourceRef ?? null,
            archivedAt: node.archivedAt ? new Date(node.archivedAt) : null,
            archiveReason: node.archiveReason ?? null,
            createdAt: new Date(node.createdAt),
            updatedAt: new Date(node.updatedAt),
          },
        });
      }
      for (const tag of backup.tags) {
        await tx.tag.create({
          data: {
            id: tag.id,
            name: tag.name,
            createdAt: new Date(tag.createdAt),
          },
        });
      }
      for (const edge of backup.edges) {
        await tx.crystalEdge.create({
          data: {
            id: edge.id,
            fromId: edge.fromId,
            toId: edge.toId,
            relation: edge.relation,
            weight: edge.weight,
            createdAt: new Date(edge.createdAt),
          },
        });
      }
      for (const nodeTag of backup.nodeTags) {
        await tx.nodeTag.create({
          data: {
            nodeId: nodeTag.nodeId,
            tagId: nodeTag.tagId,
            assignedAt: new Date(nodeTag.assignedAt),
          },
        });
      }
      for (const event of backup.phaseEvents) {
        await tx.phaseEvent.create({
          data: {
            id: event.id,
            nodeId: event.nodeId,
            fromPhase: event.fromPhase ?? null,
            toPhase: event.toPhase,
            reason: event.reason,
            createdAt: new Date(event.createdAt),
          },
        });
      }
    });
  } catch {
    redirect(
      backupRestoreErrorUrl(
        "Restore failed during the database transaction. No local data was replaced.",
      ),
    );
  }

  revalidatePath("/");
  revalidatePath("/nodes");
  revalidatePath("/graph");
  revalidatePath("/backup");
  redirect(`/backup?restored=1&nodes=${backup.nodes.length}`);
}

export async function createEdgeAction(formData: FormData) {
  const parsed = edgeFormSchema.parse(formObject(formData));
  if (parsed.fromId === parsed.toId) {
    throw new Error("A crystal cannot connect to itself.");
  }
  await prisma.$transaction(async (tx) => {
    await tx.crystalEdge.create({
      data: parsed,
    });
    await recalculateManyNodeScores([parsed.fromId, parsed.toId], tx);
  });
  revalidatePath("/");
  revalidatePath("/graph");
  revalidatePath("/nodes");
  revalidatePath(`/nodes/${parsed.fromId}`);
  redirect(`/nodes/${parsed.fromId}`);
}

export async function updateEdgeAction(
  edgeId: string,
  returnNodeId: string,
  formData: FormData,
) {
  const parsed = edgeFormSchema
    .pick({ relation: true, weight: true })
    .parse(formObject(formData));
  await prisma.$transaction(async (tx) => {
    const edge = await tx.crystalEdge.update({
      where: { id: edgeId },
      data: parsed,
    });
    await recalculateManyNodeScores([edge.fromId, edge.toId], tx);
  });
  revalidatePath("/");
  revalidatePath("/graph");
  revalidatePath("/nodes");
  revalidatePath(`/nodes/${returnNodeId}`);
  redirect(`/nodes/${returnNodeId}`);
}

export async function deleteEdgeAction(edgeId: string, returnNodeId: string) {
  await prisma.$transaction(async (tx) => {
    const edge = await tx.crystalEdge.delete({ where: { id: edgeId } });
    await recalculateManyNodeScores([edge.fromId, edge.toId], tx);
  });
  revalidatePath("/");
  revalidatePath("/graph");
  revalidatePath("/nodes");
  revalidatePath(`/nodes/${returnNodeId}`);
  redirect(`/nodes/${returnNodeId}`);
}

export async function transitionPhaseAction(
  nodeId: string,
  targetPhase: (typeof phases)[number],
  formData: FormData,
) {
  const reason =
    String(formData.get("reason") ?? "").trim() ||
    `Manual transition to ${targetPhase}`;
  await prisma.$transaction(async (tx) => {
    const node = await tx.crystalNode.findUniqueOrThrow({
      where: { id: nodeId },
    });
    await tx.crystalNode.update({
      where: { id: nodeId },
      data: { phase: targetPhase },
    });
    await tx.phaseEvent.create({
      data: {
        nodeId,
        fromPhase: node.phase,
        toPhase: targetPhase,
        reason,
      },
    });
    await recalculateNodeScore(nodeId, tx);
  });
  revalidatePath("/");
  revalidatePath("/nodes");
  revalidatePath("/graph");
  revalidatePath(`/nodes/${nodeId}`);
  redirect(`/nodes/${nodeId}`);
}

export async function haSoftenAction(nodeId: string) {
  await prisma.$transaction(async (tx) => {
    const node = await tx.crystalNode.findUniqueOrThrow({
      where: { id: nodeId },
    });
    const result = applyHaSoften(node as unknown as CrystalNodeCore);
    await tx.crystalNode.update({
      where: { id: nodeId },
      data: {
        phase: result.node.phase,
        emotionHa: result.node.emotionHa,
      },
    });
    await tx.phaseEvent.create({
      data: {
        nodeId,
        fromPhase: result.event.fromPhase,
        toPhase: result.event.toPhase,
        reason: result.event.reason,
      },
    });
    await recalculateNodeScore(nodeId, tx);
  });
  revalidatePath("/");
  revalidatePath("/nodes");
  revalidatePath("/graph");
  revalidatePath(`/nodes/${nodeId}`);
  redirect(`/nodes/${nodeId}`);
}

export async function createContributionEventAction(
  nodeId: string,
  formData: FormData,
) {
  const parsed = contributionFormSchema.parse(formObject(formData));
  await prisma.$transaction(async (tx) => {
    await createContributionEvent(tx, {
      nodeId,
      alias: parsed.actorAlias,
      publicKey: parsed.publicKey,
      url: parsed.url,
      kind: parsed.kind,
      body: parsed.body,
      weight: parsed.weight,
    });
  });
  revalidatePath("/");
  revalidatePath("/flow");
  revalidatePath("/observe");
  revalidatePath(`/nodes/${nodeId}`);
  redirect(`/nodes/${nodeId}`);
}

export async function createMarketOrderAction(
  nodeId: string,
  formData: FormData,
) {
  const parsed = marketOrderFormSchema.parse(formObject(formData));
  await prisma.$transaction(async (tx) => {
    await createMarketOrder(tx, {
      nodeId,
      alias: parsed.actorAlias,
      publicKey: parsed.publicKey,
      url: parsed.url,
      side: parsed.side,
      price: parsed.price,
      quantity: parsed.quantity,
      note: parsed.note,
    });
  });
  revalidatePath("/flow");
  revalidatePath("/observe");
  revalidatePath(`/nodes/${nodeId}`);
  redirect(`/nodes/${nodeId}`);
}

function importReviewResultUrl(summary: {
  created: number;
  merged: number;
  edges: number;
  dismissed: number;
  skipped: number;
}) {
  const params = new URLSearchParams({
    created: String(summary.created),
    merged: String(summary.merged),
    edges: String(summary.edges),
    dismissed: String(summary.dismissed),
    skipped: String(summary.skipped),
  });
  return `/import?${params.toString()}`;
}

export async function commitImportCandidatesAction(formData: FormData) {
  const rawItems = formData.getAll("reviewItem").map(String).slice(0, 50);
  const summary = {
    created: 0,
    merged: 0,
    edges: 0,
    dismissed: 0,
    skipped: 0,
  };

  await prisma.$transaction(async (tx) => {
    for (const raw of rawItems) {
      let payload: unknown;
      try {
        payload = JSON.parse(raw);
      } catch {
        summary.skipped += 1;
        continue;
      }

      const result = importReviewItemSchema.safeParse(payload);
      if (!result.success) {
        summary.skipped += 1;
        continue;
      }

      const item = normalizeReviewCommitItem(result.data);
      const candidate = item.candidate;
      if (item.action === "dismiss") {
        summary.dismissed += 1;
        continue;
      }
      if (!candidate.title || !candidate.body) {
        summary.skipped += 1;
        continue;
      }

      if (item.action === "create") {
        const node = await tx.crystalNode.create({
          data: {
            title: candidate.title,
            body: candidate.body,
            phase: candidate.phase,
            emotionHa: candidate.emotionHa,
            sourceType: "chat",
            sourceRef: "daily-residue-import",
          },
        });
        await replaceTags(tx, node.id, candidate.tags);
        await tx.phaseEvent.create({
          data: {
            nodeId: node.id,
            fromPhase: null,
            toPhase: candidate.phase,
            reason: "Imported reviewed residue",
          },
        });
        await recalculateNodeScore(node.id, tx);
        summary.created += 1;
        continue;
      }

      if (item.action === "merge") {
        if (!item.targetNodeId) {
          summary.skipped += 1;
          continue;
        }
        const target = await tx.crystalNode.findFirst({
          where: { id: item.targetNodeId, archivedAt: null },
          include: { tags: { include: { tag: true } } },
        });
        if (!target) {
          summary.skipped += 1;
          continue;
        }
        const mergedTags = Array.from(
          new Set([
            ...target.tags.map((entry) => entry.tag.name),
            ...candidate.tags,
          ]),
        );
        await tx.crystalNode.update({
          where: { id: target.id },
          data: {
            body: `${target.body}\n\n---\nMerged import candidate "${candidate.title}":\n${candidate.body}`,
            emotionHa: Math.max(target.emotionHa, candidate.emotionHa),
          },
        });
        await replaceTags(tx, target.id, mergedTags);
        await tx.phaseEvent.create({
          data: {
            nodeId: target.id,
            fromPhase: target.phase,
            toPhase: target.phase,
            reason: `Merged import candidate "${candidate.title}"`,
          },
        });
        await recalculateNodeScore(target.id, tx);
        summary.merged += 1;
        continue;
      }

      if (item.action === "edge") {
        if (
          !item.targetNodeId ||
          !item.edgeToNodeId ||
          item.targetNodeId === item.edgeToNodeId
        ) {
          summary.skipped += 1;
          continue;
        }
        const [fromNode, toNode] = await Promise.all([
          tx.crystalNode.findFirst({
            where: { id: item.targetNodeId, archivedAt: null },
          }),
          tx.crystalNode.findFirst({
            where: { id: item.edgeToNodeId, archivedAt: null },
          }),
        ]);
        if (!fromNode || !toNode) {
          summary.skipped += 1;
          continue;
        }
        await tx.crystalEdge.create({
          data: {
            fromId: fromNode.id,
            toId: toNode.id,
            relation: item.relation ?? "resonates_with",
            weight: item.weight ?? 1,
          },
        });
        await tx.phaseEvent.create({
          data: {
            nodeId: fromNode.id,
            fromPhase: fromNode.phase,
            toPhase: fromNode.phase,
            reason: `Imported residue suggested ${item.relation ?? "resonates_with"} edge to "${toNode.title}"`,
          },
        });
        await recalculateManyNodeScores([fromNode.id, toNode.id], tx);
        summary.edges += 1;
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/nodes");
  revalidatePath("/graph");
  revalidatePath("/import");
  redirect(importReviewResultUrl(summary));
}

export async function dismissImportCandidatesAction(formData: FormData) {
  const dismissed = formData.getAll("reviewItem").length;
  redirect(
    importReviewResultUrl({
      created: 0,
      merged: 0,
      edges: 0,
      dismissed,
      skipped: 0,
    }),
  );
}

export async function importFragmentsAction(formData: FormData) {
  const rawFragments = formData.getAll("fragment").map(String);
  const createdIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (const raw of rawFragments.slice(0, 50)) {
      let candidate: unknown;
      try {
        candidate = JSON.parse(raw);
      } catch {
        continue;
      }
      const result = importCandidateSchema.safeParse(candidate);
      if (!result.success) continue;
      const parsed = result.data;
      const node = await tx.crystalNode.create({
        data: {
          title: parsed.title,
          body: parsed.body,
          phase: parsed.phase,
          emotionHa: parsed.emotionHa,
          sourceType: "chat",
          sourceRef: "bulk-import",
        },
      });
      await replaceTags(tx, node.id, parsed.tags);
      await tx.phaseEvent.create({
        data: {
          nodeId: node.id,
          fromPhase: null,
          toPhase: parsed.phase,
          reason: "Imported conversation residue",
        },
      });
      await recalculateNodeScore(node.id, tx);
      createdIds.push(node.id);
    }
  });

  revalidatePath("/");
  revalidatePath("/nodes");
  revalidatePath("/graph");
  redirect(createdIds.length === 1 ? `/nodes/${createdIds[0]}` : "/nodes");
}

export async function enqueueChatGptCorpusAction(formData: FormData) {
  const parsed = chatGptCorpusFormSchema.parse(formObject(formData));
  const documents = parseChatGptCorpusInput({
    rawText: parsed.transcript,
    sourceRef: parsed.sourceRef,
    title: parsed.title,
  });

  if (documents.length === 0) {
    redirect("/corpus?chatgptError=No%20ChatGPT%20messages%20were%20detected");
  }

  const inboxDir = path.join(process.cwd(), "data", "corpus", "inbox");
  const stamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15);
  const fileName = `chatgpt-${stamp}-${stableTextHash(parsed.transcript)}.jsonl`;
  await mkdir(inboxDir, { recursive: true });
  await writeFile(
    path.join(inboxDir, fileName),
    `${serializeJsonl(documents)}\n`,
    "utf8",
  );

  revalidatePath("/corpus");
  revalidatePath("/observe");
  const params = new URLSearchParams({
    chatgptQueued: String(documents.length),
    file: fileName,
  });
  redirect(`/corpus?${params.toString()}`);
}
