export const defaultPoolIds = {
  canonical: "pool_canonical",
  ai: "pool_ai_directed",
  fugue: "pool_fugue",
} as const;

export const poolKinds = ["canonical", "ai_directed", "fugue"] as const;

export type PoolKind = (typeof poolKinds)[number];

export const poolStatuses = ["active", "paused", "archived"] as const;

export type PoolStatus = (typeof poolStatuses)[number];

export type PoolSpaceCore = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  kind: PoolKind;
  status: PoolStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export const defaultPoolSpaces = [
  {
    id: defaultPoolIds.canonical,
    slug: "canonical",
    name: "Canonical Pool",
    description: "Human-operated meaning crystallization pool.",
    kind: "canonical",
  },
  {
    id: defaultPoolIds.ai,
    slug: "ai",
    name: "AI-Directed Pool",
    description: "OpenAI director owns mutations; humans observe and suggest.",
    kind: "ai_directed",
  },
  {
    id: defaultPoolIds.fugue,
    slug: "fugue",
    name: "Crystal Sandbox",
    description: "Fugue, Sonata, and Symphony rehearsals for Pool mechanisms.",
    kind: "fugue",
  },
] as const;

export function normalizePoolSlug(value?: string | null) {
  const slug = value?.trim().toLowerCase();
  if (slug === "ai-pool" || slug === "ai_directed" || slug === "ai") {
    return "ai";
  }
  if (slug === "fugue" || slug === "crystal-fugue") return "fugue";
  return "canonical";
}

export function defaultPoolIdForSlug(value?: string | null) {
  const slug = normalizePoolSlug(value);
  if (slug === "ai") return defaultPoolIds.ai;
  if (slug === "fugue") return defaultPoolIds.fugue;
  return defaultPoolIds.canonical;
}
