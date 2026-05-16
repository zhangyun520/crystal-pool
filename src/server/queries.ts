import { prisma } from "./db";
import {
  edgeRelations,
  phases,
  type EdgeRelation,
  type Phase,
} from "@/lib/domain";
import { defaultPoolIds } from "@/lib/pools";
import { type Prisma } from "@prisma/client";

export const nodeInclude = {
  tags: { include: { tag: true }, orderBy: { assignedAt: "asc" as const } },
  incomingEdges: {
    include: { from: true },
    orderBy: { createdAt: "desc" as const },
  },
  outgoingEdges: {
    include: { to: true },
    orderBy: { createdAt: "desc" as const },
  },
  phaseEvents: { orderBy: { createdAt: "desc" as const } },
};

export type NodeStatusFilter = "active" | "archived" | "all";
export type NodeSort = "score" | "createdAt" | "updatedAt" | "title";
export type SortDirection = "asc" | "desc";

export type NodeQueryFilters = {
  q?: string;
  phase?: Phase;
  tag?: string;
  status?: NodeStatusFilter;
  sort?: NodeSort;
  dir?: SortDirection;
  poolId?: string;
};

export type GraphQueryFilters = {
  phase?: Phase;
  relation?: EdgeRelation;
  tag?: string;
  selected?: string;
};

function normalizeFilterValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseNodeQueryFilters(searchParams?: {
  [key: string]: string | string[] | undefined;
}): NodeQueryFilters {
  const q = normalizeFilterValue(searchParams?.q)?.trim();
  const phaseValue = normalizeFilterValue(searchParams?.phase);
  const tag = normalizeFilterValue(searchParams?.tag)?.trim();
  const statusValue = normalizeFilterValue(searchParams?.status);
  const sortValue = normalizeFilterValue(searchParams?.sort);
  const dirValue = normalizeFilterValue(searchParams?.dir);

  return {
    q: q || undefined,
    phase: phases.includes(phaseValue as Phase)
      ? (phaseValue as Phase)
      : undefined,
    tag: tag || undefined,
    status:
      statusValue === "archived" || statusValue === "all"
        ? statusValue
        : "active",
    sort:
      sortValue === "createdAt" ||
      sortValue === "updatedAt" ||
      sortValue === "title"
        ? sortValue
        : "score",
    dir: dirValue === "asc" ? "asc" : "desc",
  };
}

export function parseGraphQueryFilters(searchParams?: {
  [key: string]: string | string[] | undefined;
}): GraphQueryFilters {
  const phaseValue = normalizeFilterValue(searchParams?.phase);
  const relationValue = normalizeFilterValue(searchParams?.relation);
  const tag = normalizeFilterValue(searchParams?.tag)?.trim();
  const selected = normalizeFilterValue(searchParams?.selected)?.trim();

  return {
    phase: phases.includes(phaseValue as Phase)
      ? (phaseValue as Phase)
      : undefined,
    relation: edgeRelations.includes(relationValue as EdgeRelation)
      ? (relationValue as EdgeRelation)
      : undefined,
    tag: tag || undefined,
    selected: selected || undefined,
  };
}

function nodeWhere(filters: NodeQueryFilters = {}): Prisma.CrystalNodeWhereInput {
  const status = filters.status ?? "active";
  return {
    poolId: filters.poolId ?? defaultPoolIds.canonical,
    ...(status === "active"
      ? { archivedAt: null }
      : status === "archived"
        ? { archivedAt: { not: null } }
        : {}),
    ...(filters.phase ? { phase: filters.phase } : {}),
    ...(filters.tag
      ? { tags: { some: { tag: { name: filters.tag } } } }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q } },
            { body: { contains: filters.q } },
            { sourceRef: { contains: filters.q } },
          ],
        }
      : {}),
  };
}

function nodeOrderBy(
  filters: NodeQueryFilters = {},
): Prisma.CrystalNodeOrderByWithRelationInput[] {
  const dir = filters.dir ?? "desc";
  switch (filters.sort ?? "score") {
    case "createdAt":
      return [{ createdAt: dir }, { title: "asc" }];
    case "updatedAt":
      return [{ updatedAt: dir }, { title: "asc" }];
    case "title":
      return [{ title: filters.dir ?? "asc" }];
    case "score":
    default:
      return [{ crystallizationScore: dir }, { updatedAt: "desc" }];
  }
}

export async function getAllNodes(filters: NodeQueryFilters = {}) {
  return prisma.crystalNode.findMany({
    where: nodeWhere(filters),
    include: nodeInclude,
    orderBy: nodeOrderBy(filters),
  });
}

export async function getNode(id: string) {
  return prisma.crystalNode.findUnique({
    where: { id },
    include: nodeInclude,
  });
}

export async function getAllEdges() {
  const poolId = defaultPoolIds.canonical;
  return prisma.crystalEdge.findMany({
    where: {
      from: { archivedAt: null, poolId },
      to: { archivedAt: null, poolId },
    },
    include: { from: true, to: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGraphData(filters: GraphQueryFilters = {}) {
  const poolId = defaultPoolIds.canonical;
  const nodes = await getAllNodes({
    phase: filters.phase,
    tag: filters.tag,
    status: "active",
    sort: "score",
    dir: "desc",
    poolId,
  });
  const nodeIds = nodes.map((node) => node.id);
  const edges =
    nodeIds.length === 0
      ? []
      : await prisma.crystalEdge.findMany({
          where: {
            from: { archivedAt: null, poolId },
            to: { archivedAt: null, poolId },
            fromId: { in: nodeIds },
            toId: { in: nodeIds },
            ...(filters.relation ? { relation: filters.relation } : {}),
          },
          include: { from: true, to: true },
          orderBy: { createdAt: "desc" },
        });

  return { nodes, edges };
}

export async function getNodesForSelection(exceptId?: string) {
  return prisma.crystalNode.findMany({
    where: {
      poolId: defaultPoolIds.canonical,
      archivedAt: null,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    orderBy: { title: "asc" },
  });
}

export async function getPhaseCounts() {
  return prisma.crystalNode.groupBy({
    where: { archivedAt: null, poolId: defaultPoolIds.canonical },
    by: ["phase"],
    _count: { phase: true },
  });
}

export async function getAllTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getImportReferenceNodes() {
  const nodes = await prisma.crystalNode.findMany({
    where: { archivedAt: null, poolId: defaultPoolIds.canonical },
    select: {
      id: true,
      title: true,
      body: true,
      phase: true,
      tags: { include: { tag: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return nodes.map((node) => ({
    id: node.id,
    title: node.title,
    body: node.body,
    phase: node.phase,
    tags: node.tags.map((item) => item.tag.name),
  }));
}
