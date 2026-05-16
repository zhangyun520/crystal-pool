import { type ImportCandidate } from "./importFragments";

export type ReferenceNode = {
  id: string;
  title: string;
  body: string;
  phase?: string;
  tags: string[];
};

export type ResonanceMatch = {
  nodeId: string;
  title: string;
  kind: "duplicate" | "resonance";
  score: number;
  sharedTerms: string[];
};

const stopWords = new Set([
  "this",
  "that",
  "with",
  "from",
  "into",
  "and",
  "the",
  "一个",
  "这个",
  "那个",
  "我们",
  "不是",
  "可以",
]);

function cjkBigrams(text: string) {
  const chars = Array.from(text.replace(/[^\p{Script=Han}]/gu, ""));
  const grams = new Set<string>();
  for (let index = 0; index < chars.length - 1; index += 1) {
    grams.add(`${chars[index]}${chars[index + 1]}`);
  }
  return grams;
}

export function tokenizeMeaning(text: string) {
  const latin = text
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9_-]{2,}/g);
  const terms = new Set<string>(latin ?? []);

  for (const term of cjkBigrams(text)) {
    terms.add(term);
  }

  return Array.from(terms).filter((term) => !stopWords.has(term));
}

function scoreOverlap(candidateTerms: string[], nodeTerms: string[]) {
  if (candidateTerms.length === 0 || nodeTerms.length === 0) {
    return { score: 0, shared: [] as string[] };
  }
  const nodeSet = new Set(nodeTerms);
  const shared = candidateTerms.filter((term) => nodeSet.has(term));
  const denominator = Math.sqrt(candidateTerms.length * nodeTerms.length);
  return {
    score: shared.length / Math.max(1, denominator),
    shared,
  };
}

export function findResonanceMatches(
  candidate: ImportCandidate,
  nodes: ReferenceNode[],
): ResonanceMatch[] {
  const candidateTerms = tokenizeMeaning(
    `${candidate.title} ${candidate.body} ${candidate.tags.join(" ")}`,
  );

  return nodes
    .map((node) => {
      const nodeTerms = tokenizeMeaning(
        `${node.title} ${node.body} ${node.tags.join(" ")}`,
      );
      const overlap = scoreOverlap(candidateTerms, nodeTerms);
      const tagHits = candidate.tags.filter((tag) => node.tags.includes(tag));
      const titleHit =
        candidate.body.includes(node.title) ||
        candidate.title.includes(node.title) ||
        node.body.includes(candidate.title)
          ? 0.45
          : 0;
      const score = Math.min(
        1,
        overlap.score + tagHits.length * 0.12 + titleHit,
      );

      return {
        nodeId: node.id,
        title: node.title,
        kind: score >= 0.68 ? "duplicate" : "resonance",
        score,
        sharedTerms: Array.from(new Set([...tagHits, ...overlap.shared])).slice(
          0,
          6,
        ),
      } satisfies ResonanceMatch;
    })
    .filter((match) => match.score >= 0.18)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
