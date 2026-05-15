import { z } from "zod";
import { edgeRelations, phases } from "./domain";

export const aiDecisionKinds = [
  "create_node",
  "create_edge",
  "transition_phase",
  "ha_soften",
  "no_op",
] as const;

export type AIDecisionKind = (typeof aiDecisionKinds)[number];

const optionalText = (schema: z.ZodString) =>
  schema.nullish().transform((value) => value ?? undefined);

const optionalPhase = z
  .enum(phases)
  .nullish()
  .transform((value) => value ?? undefined);

const optionalRelation = z
  .enum(edgeRelations)
  .nullish()
  .transform((value) => value ?? undefined);

const optionalWeight = z
  .number()
  .min(0)
  .max(10)
  .nullish()
  .transform((value) => value ?? undefined);

export const aiDirectorOutputSchema = z.object({
  summary: z.string().min(1).max(1_200),
  decisions: z
    .array(
      z.object({
        kind: z.enum(aiDecisionKinds),
        rationale: z.string().min(1).max(1_500),
        title: optionalText(z.string().min(1).max(140)),
        body: optionalText(z.string().min(1).max(4_000)),
        phase: optionalPhase,
        targetNodeId: optionalText(z.string().min(1)),
        fromNodeId: optionalText(z.string().min(1)),
        toNodeId: optionalText(z.string().min(1)),
        relation: optionalRelation,
        weight: optionalWeight,
      }),
    )
    .max(6),
});

export type AIDirectorOutput = z.infer<typeof aiDirectorOutputSchema>;

export const aiDirectorJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "decisions"],
  properties: {
    summary: { type: "string" },
    decisions: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "kind",
          "rationale",
          "title",
          "body",
          "phase",
          "targetNodeId",
          "fromNodeId",
          "toNodeId",
          "relation",
          "weight",
        ],
        properties: {
          kind: { type: "string", enum: aiDecisionKinds },
          rationale: { type: "string" },
          title: { type: ["string", "null"] },
          body: { type: ["string", "null"] },
          phase: { type: ["string", "null"], enum: [...phases, null] },
          targetNodeId: { type: ["string", "null"] },
          fromNodeId: { type: ["string", "null"] },
          toNodeId: { type: ["string", "null"] },
          relation: { type: ["string", "null"], enum: [...edgeRelations, null] },
          weight: { type: ["number", "null"], minimum: 0, maximum: 10 },
        },
      },
    },
  },
} as const;

export type AIPoolPermission =
  | "observe"
  | "suggest"
  | "create_node"
  | "create_edge"
  | "transition_phase";

export function canHumanUseAIPool(permission: AIPoolPermission) {
  return permission === "observe" || permission === "suggest";
}

export function normalizeDirectorModel(value?: string | null) {
  return value?.trim() || "gpt-5.5";
}
