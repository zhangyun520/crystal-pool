import { createBackupDocument } from "@/lib/backup";
import { prisma } from "./db";

export async function buildBackupData() {
  const [nodes, edges, tags, nodeTags, phaseEvents] = await prisma.$transaction([
    prisma.crystalNode.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.crystalEdge.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.nodeTag.findMany({
      orderBy: [{ nodeId: "asc" }, { tagId: "asc" }],
    }),
    prisma.phaseEvent.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return createBackupDocument({
    nodes,
    edges,
    tags,
    nodeTags,
    phaseEvents,
  });
}
