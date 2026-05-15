import { calculateCrystallizationScore } from "@/lib/crystallization";
import { type CrystalEdgeCore, type CrystalNodeCore, type PhaseEventCore } from "@/lib/domain";
import { type DbClient, prisma } from "./db";

export async function recalculateNodeScore(
  nodeId: string,
  client: DbClient = prisma,
) {
  const node = await client.crystalNode.findUnique({
    where: { id: nodeId },
  });
  if (!node) return null;

  const [edges, events] = await Promise.all([
    client.crystalEdge.findMany({
      where: {
        OR: [{ fromId: nodeId }, { toId: nodeId }],
        from: { archivedAt: null },
        to: { archivedAt: null },
      },
    }),
    client.phaseEvent.findMany({ where: { nodeId } }),
  ]);

  const score = calculateCrystallizationScore(
    node as unknown as CrystalNodeCore,
    edges as unknown as CrystalEdgeCore[],
    events as unknown as PhaseEventCore[],
  );

  return client.crystalNode.update({
    where: { id: nodeId },
    data: {
      crystallizationScore: score,
      entropyResistance: Math.min(
        100,
        Math.max(0, score + node.emotionHa * 2 - node.emotionBoredom * 2),
      ),
    },
  });
}

export async function recalculateManyNodeScores(
  nodeIds: string[],
  client: DbClient = prisma,
) {
  const uniqueIds = Array.from(new Set(nodeIds));
  for (const nodeId of uniqueIds) {
    await recalculateNodeScore(nodeId, client);
  }
}
