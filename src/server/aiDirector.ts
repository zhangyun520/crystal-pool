import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import {
  aiDirectorJsonSchema,
  aiDirectorOutputSchema,
  canHumanUseAIPool,
  normalizeDirectorModel,
  type AIDirectorOutput,
} from "@/lib/aiPool";
import { applyHaSoften } from "@/lib/phase";
import { defaultPoolIds } from "@/lib/pools";
import { type CrystalNodeCore, type Phase } from "@/lib/domain";
import { getOrCreateActor } from "./actors";
import { prisma, type DbClient } from "./db";
import { aiPoolId, ensureDefaultPoolSpaces } from "./pools";
import { recalculateManyNodeScores, recalculateNodeScore } from "./scoring";

type OpenAIResponse = {
  id?: string;
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

export type AIDirectorProvider = (input: {
  model: string;
  prompt: string;
}) => Promise<{ responseId?: string | null; output: AIDirectorOutput }>;

function digest(value: unknown) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function extractOutputText(response: OpenAIResponse) {
  if (response.output_text) return response.output_text;
  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

async function callOpenAIDirector({
  model,
  prompt,
}: {
  model: string;
  prompt: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions:
        "You are Crystal Pool's AI director. You own mutations only inside the AI-directed pool. Respect phase history, ha softening, and the non-financial meaning-market boundary. Return only schema-valid decisions.",
      input: prompt,
      reasoning: { effort: "medium" },
      max_output_tokens: 2_000,
      text: {
        format: {
          type: "json_schema",
          name: "crystal_pool_ai_director_cycle",
          strict: true,
          schema: aiDirectorJsonSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI Responses API failed: ${response.status} ${body.slice(0, 240)}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  const text = extractOutputText(data);
  const parsed = aiDirectorOutputSchema.parse(JSON.parse(text));
  return { responseId: data.id ?? null, output: parsed };
}

async function buildAIPoolPrompt(poolId: string) {
  const [nodes, edges, suggestions, recentCycles] = await Promise.all([
    prisma.crystalNode.findMany({
      where: { poolId, archivedAt: null },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ crystallizationScore: "desc" }, { updatedAt: "desc" }],
      take: 24,
    }),
    prisma.crystalEdge.findMany({
      where: { from: { poolId, archivedAt: null }, to: { poolId, archivedAt: null } },
      orderBy: { createdAt: "desc" },
      take: 32,
    }),
    prisma.humanSuggestion.findMany({
      where: { poolId, status: "open" },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.aIDirectorCycle.findMany({
      where: { poolId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const snapshot = {
    nodes: nodes.map((node) => ({
      id: node.id,
      title: node.title,
      body: node.body.slice(0, 700),
      phase: node.phase,
      score: Math.round(node.crystallizationScore),
      ha: node.emotionHa,
      tags: node.tags.map((item) => item.tag.name),
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      fromId: edge.fromId,
      toId: edge.toId,
      relation: edge.relation,
      weight: edge.weight,
    })),
    humanSuggestions: suggestions.map((suggestion) => ({
      id: suggestion.id,
      actor: suggestion.actor.alias,
      title: suggestion.title,
      body: suggestion.body,
    })),
    recentCycles: recentCycles.map((cycle) => ({
      id: cycle.id,
      status: cycle.status,
      error: cycle.error,
      completedAt: cycle.completedAt,
    })),
  };

  return {
    inputDigest: digest(snapshot),
    prompt: JSON.stringify(snapshot, null, 2),
  };
}

async function ensureAINodePool(client: DbClient, nodeId: string, poolId: string) {
  return client.crystalNode.findFirst({
    where: { id: nodeId, poolId, archivedAt: null },
  });
}

async function applyAIDecision(
  client: DbClient,
  poolId: string,
  cycleId: string,
  decision: AIDirectorOutput["decisions"][number],
) {
  const payloadJson = JSON.stringify(decision);
  const base = {
    cycleId,
    poolId,
    kind: decision.kind,
    rationale: decision.rationale,
    payloadJson,
  };

  try {
    if (decision.kind === "no_op") {
      return client.aIDecision.create({
        data: { ...base, status: "applied", appliedAt: new Date() },
      });
    }

    if (decision.kind === "create_node") {
      if (!decision.title || !decision.body) {
        throw new Error("create_node requires title and body.");
      }
      const node = await client.crystalNode.create({
        data: {
          poolId,
          title: decision.title,
          body: decision.body,
          phase: decision.phase ?? "gas",
          sourceType: "ai",
          sourceRef: `ai-cycle:${cycleId}`,
          emotionCuriosity: 5,
          emotionHa: decision.body.toLowerCase().includes("ha") ? 4 : 0,
        },
      });
      await client.phaseEvent.create({
        data: {
          nodeId: node.id,
          fromPhase: null,
          toPhase: node.phase,
          reason: `AI director created node: ${decision.rationale}`,
        },
      });
      await recalculateNodeScore(node.id, client);
      return client.aIDecision.create({
        data: {
          ...base,
          status: "applied",
          targetNodeId: node.id,
          title: decision.title,
          body: decision.body,
          phase: node.phase,
          appliedAt: new Date(),
        },
      });
    }

    if (decision.kind === "transition_phase") {
      if (!decision.targetNodeId || !decision.phase) {
        throw new Error("transition_phase requires targetNodeId and phase.");
      }
      const node = await ensureAINodePool(client, decision.targetNodeId, poolId);
      if (!node) throw new Error("Target node is not in the AI-directed pool.");
      await client.crystalNode.update({
        where: { id: node.id },
        data: { phase: decision.phase },
      });
      await client.phaseEvent.create({
        data: {
          nodeId: node.id,
          fromPhase: node.phase as Phase,
          toPhase: decision.phase,
          reason: `AI director phase transition: ${decision.rationale}`,
        },
      });
      await recalculateNodeScore(node.id, client);
      return client.aIDecision.create({
        data: {
          ...base,
          status: "applied",
          targetNodeId: node.id,
          phase: decision.phase,
          appliedAt: new Date(),
        },
      });
    }

    if (decision.kind === "ha_soften") {
      if (!decision.targetNodeId) throw new Error("ha_soften requires targetNodeId.");
      const node = await ensureAINodePool(client, decision.targetNodeId, poolId);
      if (!node) throw new Error("Target node is not in the AI-directed pool.");
      const result = applyHaSoften(node as unknown as CrystalNodeCore);
      await client.crystalNode.update({
        where: { id: node.id },
        data: {
          phase: result.node.phase,
          emotionHa: result.node.emotionHa,
        },
      });
      await client.phaseEvent.create({
        data: {
          nodeId: node.id,
          fromPhase: result.event.fromPhase,
          toPhase: result.event.toPhase,
          reason: `AI director ha soften: ${decision.rationale}`,
        },
      });
      await recalculateNodeScore(node.id, client);
      return client.aIDecision.create({
        data: {
          ...base,
          status: "applied",
          targetNodeId: node.id,
          phase: result.node.phase,
          appliedAt: new Date(),
        },
      });
    }

    if (decision.kind === "create_edge") {
      if (!decision.fromNodeId || !decision.toNodeId || !decision.relation) {
        throw new Error("create_edge requires fromNodeId, toNodeId, and relation.");
      }
      const [from, to] = await Promise.all([
        ensureAINodePool(client, decision.fromNodeId, poolId),
        ensureAINodePool(client, decision.toNodeId, poolId),
      ]);
      if (!from || !to) throw new Error("Both edge endpoints must be in the AI-directed pool.");
      const edge = await client.crystalEdge.create({
        data: {
          fromId: from.id,
          toId: to.id,
          relation: decision.relation,
          weight: decision.weight ?? 1,
        },
      });
      await recalculateManyNodeScores([from.id, to.id], client);
      return client.aIDecision.create({
        data: {
          ...base,
          status: "applied",
          targetNodeId: from.id,
          relation: edge.relation,
          weight: edge.weight,
          appliedAt: new Date(),
        },
      });
    }
  } catch (error) {
    return client.aIDecision.create({
      data: {
        ...base,
        status: "invalid",
        targetNodeId: decision.targetNodeId ?? decision.fromNodeId,
        title: decision.title,
        body: decision.body,
        phase: decision.phase,
        relation: decision.relation,
        weight: decision.weight,
        error: error instanceof Error ? error.message : "Invalid AI decision.",
      },
    });
  }
}

export async function runAIDirectorCycle({
  provider = callOpenAIDirector,
}: {
  provider?: AIDirectorProvider;
} = {}) {
  await ensureDefaultPoolSpaces();
  const poolId = aiPoolId();
  const model = normalizeDirectorModel(process.env.OPENAI_MODEL);
  const prompt = await buildAIPoolPrompt(poolId);

  if (!process.env.OPENAI_API_KEY?.trim() && provider === callOpenAIDirector) {
    const skipped = await prisma.aIDirectorCycle.create({
      data: {
        poolId,
        model,
        status: "skipped",
        inputDigest: prompt.inputDigest,
        error: "OPENAI_API_KEY is not configured.",
        completedAt: new Date(),
      },
    });
    revalidatePath("/ai-pool");
    revalidatePath("/observe");
    return skipped;
  }

  const cycle = await prisma.aIDirectorCycle.create({
    data: {
      poolId,
      model,
      status: "pending",
      inputDigest: prompt.inputDigest,
    },
  });

  try {
    const result = await provider({ model, prompt: prompt.prompt });
    await prisma.$transaction(async (tx) => {
      for (const decision of result.output.decisions) {
        await applyAIDecision(tx, poolId, cycle.id, decision);
      }
      await tx.aIDirectorCycle.update({
        where: { id: cycle.id },
        data: {
          status: "completed",
          openaiResponseId: result.responseId ?? null,
          outputJson: JSON.stringify(result.output),
          completedAt: new Date(),
        },
      });
      await tx.humanSuggestion.updateMany({
        where: { poolId, status: "open" },
        data: { status: "reviewed", reviewedAt: new Date() },
      });
    });
  } catch (error) {
    await prisma.aIDirectorCycle.update({
      where: { id: cycle.id },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : "AI director failed.",
        completedAt: new Date(),
      },
    });
  }

  revalidatePath("/ai-pool");
  revalidatePath("/flow");
  revalidatePath("/observe");
  return prisma.aIDirectorCycle.findUniqueOrThrow({
    where: { id: cycle.id },
    include: { decisions: true },
  });
}

export async function submitHumanSuggestion({
  alias,
  title,
  body,
}: {
  alias: string;
  title: string;
  body: string;
}) {
  if (!canHumanUseAIPool("suggest")) {
    throw new Error("Humans cannot mutate the AI-directed pool.");
  }
  await ensureDefaultPoolSpaces();
  const actor = await getOrCreateActor(prisma, { alias, kind: "human" });
  const suggestion = await prisma.humanSuggestion.create({
    data: {
      poolId: defaultPoolIds.ai,
      actorId: actor.id,
      title,
      body,
    },
  });
  revalidatePath("/ai-pool");
  return suggestion;
}

export async function getAIPoolDashboard() {
  await ensureDefaultPoolSpaces();
  const poolId = aiPoolId();
  const [pool, nodes, edges, suggestions, cycles, decisions] = await Promise.all([
    prisma.poolSpace.findUniqueOrThrow({ where: { id: poolId } }),
    prisma.crystalNode.findMany({
      where: { poolId, archivedAt: null },
      include: { tags: { include: { tag: true } }, phaseEvents: { orderBy: { createdAt: "desc" }, take: 3 } },
      orderBy: [{ updatedAt: "desc" }],
      take: 24,
    }),
    prisma.crystalEdge.findMany({
      where: { from: { poolId, archivedAt: null }, to: { poolId, archivedAt: null } },
      include: { from: true, to: true },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    prisma.humanSuggestion.findMany({
      where: { poolId },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.aIDirectorCycle.findMany({
      where: { poolId },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { decisions: true },
    }),
    prisma.aIDecision.findMany({
      where: { poolId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);
  const cycleStatusCounts = {
    pending: cycles.filter((cycle) => cycle.status === "pending").length,
    skipped: cycles.filter((cycle) => cycle.status === "skipped").length,
    completed: cycles.filter((cycle) => cycle.status === "completed").length,
    failed: cycles.filter((cycle) => cycle.status === "failed").length,
  };
  const suggestionStatusCounts = {
    open: suggestions.filter((suggestion) => suggestion.status === "open").length,
    reviewed: suggestions.filter((suggestion) => suggestion.status === "reviewed").length,
    accepted: suggestions.filter((suggestion) => suggestion.status === "accepted").length,
    rejected: suggestions.filter((suggestion) => suggestion.status === "rejected").length,
  };
  const invalidDecisions = decisions
    .filter((decision) => decision.status === "invalid" || decision.status === "failed")
    .slice(0, 8)
    .map((decision) => ({
      id: decision.id,
      kind: decision.kind,
      reason: decision.error ?? "No invalid reason recorded.",
      createdAt: decision.createdAt.toISOString(),
    }));
  return {
    pool,
    nodes,
    edges,
    suggestions,
    cycles,
    decisions,
    review: {
      cycleStatusCounts,
      suggestionStatusCounts,
      invalidDecisions,
    },
    config: {
      model: normalizeDirectorModel(process.env.OPENAI_MODEL),
      hasApiKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
    },
  };
}
