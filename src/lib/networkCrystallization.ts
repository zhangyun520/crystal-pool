import { createHash } from "node:crypto";
import { type JiEvent } from "./ji";

export const networkCrystallizationSourceKinds = ["rss", "atom"] as const;
export const networkCrystallizationQualityTiers = [
  "research",
  "institutional",
  "primary",
  "curated",
] as const;

export type NetworkCrystallizationSourceKind =
  (typeof networkCrystallizationSourceKinds)[number];
export type NetworkCrystallizationQualityTier =
  (typeof networkCrystallizationQualityTiers)[number];

export type NetworkCrystallizationSource = {
  id: string;
  label: string;
  url: string;
  kind: NetworkCrystallizationSourceKind;
  qualityTier: NetworkCrystallizationQualityTier;
  category: string;
  trustReason: string;
  queryHints: string[];
  defaultTags: string[];
};

export type NetworkSignalCandidate = {
  id: string;
  sourceId: string;
  sourceLabel: string;
  title: string;
  href: string;
  summary: string;
  publishedAt?: string;
  tags: string[];
  qualityScore: number;
  qualityReasons: string[];
};

export type NetworkCrystallizationChainEntry = {
  index: number;
  eventId: string;
  sourceId: string;
  title: string;
  href: string;
  publishedAt?: string;
  qualityScore: number;
  previousHash: string | null;
  eventHash: string;
  bodyHash: string;
  createdAt: string;
};

export type NetworkCrystallizationManifest = {
  runId: string;
  mode: "network_observe_propose";
  createdAt: string;
  completedAt: string;
  sources: number;
  fetchedSources: number;
  failedSources: number;
  candidates: number;
  chained: number;
  jiEventsWritten: number;
  previousHash: string | null;
  latestHash: string | null;
  intervalRecommendationMs: 3_600_000;
  canonicalMutationAllowed: false;
};

export const defaultNetworkCrystallizationSources: NetworkCrystallizationSource[] = [
  {
    id: "arxiv-cs-ai",
    label: "arXiv cs.AI",
    url: "https://export.arxiv.org/rss/cs.AI",
    kind: "rss",
    qualityTier: "research",
    category: "AI research",
    trustReason:
      "arXiv computer science AI feed provides primary research metadata and stable source links.",
    queryHints: [
      "artificial intelligence",
      "agent",
      "reasoning",
      "alignment",
      "safety",
      "evaluation",
    ],
    defaultTags: ["network", "research", "ai"],
  },
  {
    id: "arxiv-cs-hc",
    label: "arXiv cs.HC",
    url: "https://export.arxiv.org/rss/cs.HC",
    kind: "rss",
    qualityTier: "research",
    category: "human-computer interaction",
    trustReason:
      "arXiv human-computer interaction feed helps catch human-centered AI and interface research.",
    queryHints: [
      "human",
      "interface",
      "agency",
      "governance",
      "interpretability",
      "collaboration",
    ],
    defaultTags: ["network", "research", "human-centered"],
  },
  {
    id: "mit-ai-news",
    label: "MIT News AI",
    url: "https://news.mit.edu/rss/topic/artificial-intelligence2",
    kind: "rss",
    qualityTier: "institutional",
    category: "AI institution news",
    trustReason:
      "MIT News AI feed is an institutional source with research context and dated article links.",
    queryHints: [
      "artificial intelligence",
      "society",
      "research",
      "human",
      "robot",
      "learning",
    ],
    defaultTags: ["network", "institutional", "ai"],
  },
];

const tierBaseScore: Record<NetworkCrystallizationQualityTier, number> = {
  research: 62,
  institutional: 58,
  primary: 56,
  curated: 48,
};

function stableHash(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripMarkup(value: string) {
  return decodeXml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstTag(block: string, tag: string) {
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  return stripMarkup(pattern.exec(block)?.[1] ?? "");
}

function firstRawTag(block: string, tag: string) {
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  return decodeXml(pattern.exec(block)?.[1] ?? "").trim();
}

function attr(block: string, tag: string, name: string) {
  const pattern = new RegExp(`<${tag}\\b[^>]*\\s${name}=["']([^"']+)["'][^>]*>`, "i");
  return decodeXml(pattern.exec(block)?.[1] ?? "").trim();
}

function blocksFor(xml: string, tag: string) {
  const pattern = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi");
  return xml.match(pattern) ?? [];
}

function parseDate(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function candidateId(sourceId: string, href: string, title: string) {
  return `network:${stableHash({ sourceId, href, title }).slice(0, 32)}`;
}

function scoreCandidate({
  source,
  title,
  href,
  summary,
  publishedAt,
}: {
  source: NetworkCrystallizationSource;
  title: string;
  href: string;
  summary: string;
  publishedAt?: string;
}) {
  const reasons: string[] = [`${source.qualityTier} source: ${source.trustReason}`];
  let score = tierBaseScore[source.qualityTier];

  if (href.startsWith("https://")) {
    score += 8;
    reasons.push("stable https source link");
  }
  if (title.length >= 24) {
    score += 8;
    reasons.push("specific title");
  }
  if (summary.length >= 160) {
    score += 12;
    reasons.push("context-rich summary");
  } else if (summary.length >= 80) {
    score += 6;
    reasons.push("reviewable summary");
  }
  if (publishedAt) {
    const ageDays = Math.max(
      0,
      (Date.now() - new Date(publishedAt).getTime()) / 86_400_000,
    );
    if (ageDays <= 45) {
      score += 8;
      reasons.push("recent enough for active review");
    } else if (ageDays <= 180) {
      score += 3;
      reasons.push("still within medium-term review window");
    }
  }
  const lower = `${title} ${summary}`.toLowerCase();
  const matchedHints = source.queryHints.filter((hint) =>
    lower.includes(hint.toLowerCase()),
  );
  if (matchedHints.length > 0) {
    score += Math.min(10, matchedHints.length * 3);
    reasons.push(`matched hints: ${matchedHints.slice(0, 4).join(", ")}`);
  }

  return { qualityScore: Math.min(100, Math.round(score)), qualityReasons: reasons };
}

function normalizeHref(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function buildCandidate({
  source,
  title,
  href,
  summary,
  publishedAt,
}: {
  source: NetworkCrystallizationSource;
  title: string;
  href: string;
  summary: string;
  publishedAt?: string;
}): NetworkSignalCandidate | undefined {
  const cleanTitle = stripMarkup(title).slice(0, 220);
  const cleanHref = normalizeHref(href);
  const cleanSummary = stripMarkup(summary).slice(0, 1_800);
  if (!cleanTitle || !cleanHref) return undefined;
  const scored = scoreCandidate({
    source,
    title: cleanTitle,
    href: cleanHref,
    summary: cleanSummary,
    publishedAt,
  });

  return {
    id: candidateId(source.id, cleanHref, cleanTitle),
    sourceId: source.id,
    sourceLabel: source.label,
    title: cleanTitle,
    href: cleanHref,
    summary: cleanSummary,
    publishedAt,
    tags: source.defaultTags,
    ...scored,
  };
}

export function parseNetworkFeed(
  xml: string,
  source: NetworkCrystallizationSource,
): NetworkSignalCandidate[] {
  const rssItems = blocksFor(xml, "item").map((block) =>
    buildCandidate({
      source,
      title: firstTag(block, "title"),
      href: firstTag(block, "link") || firstTag(block, "guid"),
      summary:
        firstRawTag(block, "description") ||
        firstRawTag(block, "content:encoded") ||
        firstRawTag(block, "summary"),
      publishedAt: parseDate(firstTag(block, "pubDate") || firstTag(block, "dc:date")),
    }),
  );
  const atomItems = blocksFor(xml, "entry").map((block) =>
    buildCandidate({
      source,
      title: firstTag(block, "title"),
      href: attr(block, "link", "href") || firstTag(block, "id"),
      summary:
        firstRawTag(block, "summary") ||
        firstRawTag(block, "content") ||
        firstRawTag(block, "description"),
      publishedAt: parseDate(firstTag(block, "updated") || firstTag(block, "published")),
    }),
  );

  return [...rssItems, ...atomItems]
    .filter((item): item is NetworkSignalCandidate => Boolean(item))
    .filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.id === item.id) === index,
    );
}

export function selectNetworkCandidates(
  candidates: NetworkSignalCandidate[],
  {
    maxItems = 8,
    minQuality = 72,
    query,
    knownEventIds = new Set<string>(),
  }: {
    maxItems?: number;
    minQuality?: number;
    query?: string;
    knownEventIds?: ReadonlySet<string>;
  } = {},
) {
  const queryTerms = (query ?? "")
    .split(/[, ]+/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

  return candidates
    .filter((candidate) => !knownEventIds.has(candidateToJiEventId(candidate)))
    .filter((candidate) => candidate.qualityScore >= minQuality)
    .filter((candidate) => {
      if (queryTerms.length === 0) return true;
      const haystack = `${candidate.title} ${candidate.summary} ${candidate.tags.join(" ")}`.toLowerCase();
      return queryTerms.some((term) => haystack.includes(term));
    })
    .sort((a, b) => {
      const scoreDelta = b.qualityScore - a.qualityScore;
      if (scoreDelta !== 0) return scoreDelta;
      return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
    })
    .slice(0, maxItems);
}

export function candidateToJiEventId(candidate: NetworkSignalCandidate) {
  return `network-crystal-${stableHash({
    sourceId: candidate.sourceId,
    href: candidate.href,
  }).slice(0, 24)}`;
}

function bodyForCandidate(
  candidate: NetworkSignalCandidate,
  chain?: Pick<NetworkCrystallizationChainEntry, "eventHash" | "previousHash">,
) {
  return [
    `Source: ${candidate.sourceLabel} (${candidate.sourceId})`,
    `Quality score: ${candidate.qualityScore}/100`,
    candidate.publishedAt ? `Published: ${candidate.publishedAt}` : undefined,
    chain ? `Chain hash: ${chain.eventHash}` : undefined,
    chain?.previousHash ? `Previous hash: ${chain.previousHash}` : "Previous hash: genesis",
    "",
    "Summary:",
    candidate.summary || "No feed summary provided; reviewer should inspect the source before import.",
    "",
    "Quality reasons:",
    ...candidate.qualityReasons.map((reason) => `- ${reason}`),
    "",
    "Review question:",
    "Should this network signal become a CrystalNode, Sandbox rehearsal, RFC draft, or be dismissed?",
  ]
    .filter((line): line is string => typeof line === "string")
    .join("\n");
}

export function candidateToJiEvent(
  candidate: NetworkSignalCandidate,
  chain?: Pick<NetworkCrystallizationChainEntry, "eventHash" | "previousHash">,
): JiEvent {
  return {
    id: candidateToJiEventId(candidate),
    sourceProject: "network",
    kind: "memory.learned",
    title: `Network crystal: ${candidate.title}`.slice(0, 180),
    body: bodyForCandidate(candidate, chain).slice(0, 6_000),
    occurredAt: candidate.publishedAt ?? new Date().toISOString(),
    refs: [
      { label: "source", href: candidate.href },
      { label: "feed", hash: candidate.sourceId },
      ...(chain ? [{ label: "chain", hash: chain.eventHash }] : []),
    ],
    suggestedPhase: "seed",
    ha: candidate.qualityScore >= 88 ? 4 : 3,
  };
}

export function buildNetworkCrystallizationChain({
  candidates,
  previousHash = null,
  createdAt = new Date().toISOString(),
}: {
  candidates: NetworkSignalCandidate[];
  previousHash?: string | null;
  createdAt?: string;
}): NetworkCrystallizationChainEntry[] {
  let cursor = previousHash;
  return candidates.map((candidate, index) => {
    const eventId = candidateToJiEventId(candidate);
    const bodyHash = stableHash({
      id: candidate.id,
      sourceId: candidate.sourceId,
      title: candidate.title,
      href: candidate.href,
      summary: candidate.summary,
      publishedAt: candidate.publishedAt,
      qualityScore: candidate.qualityScore,
    });
    const eventHash = stableHash({
      index,
      eventId,
      sourceId: candidate.sourceId,
      href: candidate.href,
      bodyHash,
      previousHash: cursor,
    });
    const entry = {
      index,
      eventId,
      sourceId: candidate.sourceId,
      title: candidate.title,
      href: candidate.href,
      publishedAt: candidate.publishedAt,
      qualityScore: candidate.qualityScore,
      previousHash: cursor,
      eventHash,
      bodyHash,
      createdAt,
    };
    cursor = eventHash;
    return entry;
  });
}

export function generateNetworkCrystallizationReport({
  manifest,
  candidates,
  chain,
}: {
  manifest: NetworkCrystallizationManifest;
  candidates: NetworkSignalCandidate[];
  chain: NetworkCrystallizationChainEntry[];
}) {
  const candidateLines = candidates.length
    ? candidates
        .map(
          (candidate) =>
            `- ${candidate.qualityScore}/100 ${candidate.sourceLabel}: ${candidate.title} (${candidate.href})`,
        )
        .join("\n")
    : "- No candidates met the quality threshold.";
  const chainLines = chain.length
    ? chain
        .map(
          (entry) =>
            `- ${entry.index}: ${entry.eventId} hash=${entry.eventHash.slice(0, 16)} prev=${entry.previousHash?.slice(0, 16) ?? "genesis"}`,
        )
        .join("\n")
    : "- No chain entries created.";

  return [
    `# Network Crystallization Run: ${manifest.runId}`,
    "",
    "## Boundary",
    "This skill searches configured high-quality network sources, forms a local hash chain, and writes reviewable JiEvents. It does not create canonical CrystalNodes, promote learning, upload anchors, open PRs, or unlock AI mainline.",
    "",
    "## Summary",
    `- sources: ${manifest.sources}`,
    `- fetchedSources: ${manifest.fetchedSources}`,
    `- failedSources: ${manifest.failedSources}`,
    `- candidates: ${manifest.candidates}`,
    `- chained: ${manifest.chained}`,
    `- jiEventsWritten: ${manifest.jiEventsWritten}`,
    `- previousHash: ${manifest.previousHash ?? "genesis"}`,
    `- latestHash: ${manifest.latestHash ?? "none"}`,
    `- recommendedIntervalMs: ${manifest.intervalRecommendationMs}`,
    "",
    "## Candidates",
    candidateLines,
    "",
    "## Chain",
    chainLines,
    "",
    "## Recommended Follow-up",
    "Review the JiEvents in /ecosystem. Use Sonata for theme maturation, Symphony for systemic implications, and Fugue if a source reveals a mechanism failure.",
  ].join("\n");
}
