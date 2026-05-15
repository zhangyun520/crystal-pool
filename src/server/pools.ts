import { type PoolSpace } from "@prisma/client";
import {
  defaultPoolIdForSlug,
  defaultPoolSpaces,
  normalizePoolSlug,
} from "@/lib/pools";
import { prisma, type DbClient } from "./db";

export async function ensureDefaultPoolSpaces(client: DbClient = prisma) {
  for (const pool of defaultPoolSpaces) {
    await client.poolSpace.upsert({
      where: { id: pool.id },
      update: {
        slug: pool.slug,
        name: pool.name,
        description: pool.description,
        kind: pool.kind,
        status: "active",
      },
      create: {
        id: pool.id,
        slug: pool.slug,
        name: pool.name,
        description: pool.description,
        kind: pool.kind,
        status: "active",
      },
    });
  }
}

export async function getPoolSpaceBySlug(slug?: string | null) {
  await ensureDefaultPoolSpaces();
  return prisma.poolSpace.findUniqueOrThrow({
    where: { slug: normalizePoolSlug(slug) },
  });
}

export async function getPoolSpaceById(poolId: string) {
  await ensureDefaultPoolSpaces();
  return prisma.poolSpace.findUniqueOrThrow({ where: { id: poolId } });
}

export function canonicalPoolId() {
  return defaultPoolIdForSlug("canonical");
}

export function aiPoolId() {
  return defaultPoolIdForSlug("ai");
}

export function fuguePoolId() {
  return defaultPoolIdForSlug("fugue");
}

export function poolLabel(pool: Pick<PoolSpace, "name" | "slug">) {
  return `${pool.name} (${pool.slug})`;
}
