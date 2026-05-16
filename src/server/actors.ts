import { type ActorKind } from "@prisma/client";
import { prisma, type DbClient } from "./db";

export type ActorInput = {
  alias: string;
  kind?: ActorKind;
  modelName?: string | null;
  publicKey?: string | null;
  url?: string | null;
};

export function cleanActorAlias(alias: string) {
  return alias.trim().replace(/\s+/g, " ").slice(0, 80);
}

export async function getOrCreateActor(
  client: DbClient,
  input: ActorInput,
) {
  const alias = cleanActorAlias(input.alias);
  if (!alias) throw new Error("Actor alias is required.");
  return client.actor.upsert({
    where: { alias },
    update: {
      kind: input.kind,
      modelName: input.modelName?.trim() || undefined,
      publicKey: input.publicKey?.trim() || undefined,
      url: input.url?.trim() || undefined,
    },
    create: {
      alias,
      kind: input.kind ?? "human",
      modelName: input.modelName?.trim() || null,
      publicKey: input.publicKey?.trim() || null,
      url: input.url?.trim() || null,
    },
  });
}

export async function getOrCreateHumanActor(alias: string) {
  return getOrCreateActor(prisma, { alias, kind: "human" });
}
