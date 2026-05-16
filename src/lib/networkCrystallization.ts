import { createHash } from "node:crypto";
import { type JiEvent } from "./ji";
import { type SandboxMode, type SandboxRunInput } from "./sandbox";
import { type WorldlineKey } from "./worldline";

export const crystallizationDomains = [
  "AI_RESEARCH",
  "CODING_AUTOMATION",
] as const;
export type CrystallizationDomain = (typeof crystallizationDomains)[number];

export const networkCrystallizationSourceKinds = ["rss", "atom", "html"] as const;
export const networkCrystallizationQualityTiers = [
  "research",
  "institutional",
  "primary",
  "curated",
] as const;

export const networkCandidateKinds = [
  "ai_research_signal",
  "repo_architecture_signal",
  "ai_coding_agent_pattern",
  "programming_paradigm_signal",
  "design_pattern_signal",
  "tooling_failure_signal",
  "governance_or_security_signal",
] as const;

export type NetworkCrystallizationSourceKind =
  (typeof networkCrystallizationSourceKinds)[number];
export type NetworkCrystallizationQualityTier =
  (typeof networkCrystallizationQualityTiers)[number];
export type NetworkCandidateKind = (typeof networkCandidateKinds)[number];

export type CrystallizationDomainProfile = {
  domain: CrystallizationDomain;
  label: string;
  nativeLabel: string;
  description: string;
  defaultQuota: number;
  autoSandbox: boolean;
};

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
  domain?: CrystallizationDomain;
  candidateKind?: NetworkCandidateKind;
  repo?: string;
};

export type NetworkSignalCandidate = {
  id: string;
  sourceId: string;
  sourceLabel: string;
  sourceKind: NetworkCrystallizationSourceKind | "repo_scan";
  domain: CrystallizationDomain;
  candidateKind: NetworkCandidateKind;
  title: string;
  href: string;
  summary: string;
  publishedAt?: string;
  repo?: string;
  language?: string;
  tags: string[];
  qualityScore: number;
  qualityReasons: string[];
};

export type NetworkCrystallizationChainEntry = {
  index: number;
  eventId: string;
  sourceId: string;
  domain: CrystallizationDomain;
  candidateKind: NetworkCandidateKind;
  title: string;
  href: string;
  repo?: string;
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
  domain: CrystallizationDomain;
  createdAt: string;
  completedAt: string;
  sources: number;
  fetchedSources: number;
  failedSources: number;
  repoScans: number;
  candidates: number;
  chained: number;
  jiEventsWritten: number;
  sandboxRunsCreated: number;
  previousHash: string | null;
  latestHash: string | null;
  intervalRecommendationMs: 3_600_000;
  canonicalMutationAllowed: false;
};

export const crystallizationDomainProfiles: Record<
  CrystallizationDomain,
  CrystallizationDomainProfile
> = {
  AI_RESEARCH: {
    domain: "AI_RESEARCH",
    label: "AI Research",
    nativeLabel: "AI 研究",
    description: "Primary AI research and institutional AI signals.",
    defaultQuota: 8,
    autoSandbox: false,
  },
  CODING_AUTOMATION: {
    domain: "CODING_AUTOMATION",
    label: "Coding Automation",
    nativeLabel: "自动化 Coding",
    description:
      "AI coding agents, programming paradigms, modular architecture, design patterns, and open-source repo evolution.",
    defaultQuota: 8,
    autoSandbox: true,
  },
};

export function parseCrystallizationDomain(value?: string): CrystallizationDomain {
  const normalized = (value ?? "AI_RESEARCH").trim().toUpperCase();
  if (normalized === "AI" || normalized === "RESEARCH") return "AI_RESEARCH";
  if (normalized === "CODING" || normalized === "CODE") return "CODING_AUTOMATION";
  if (crystallizationDomains.includes(normalized as CrystallizationDomain)) {
    return normalized as CrystallizationDomain;
  }
  throw new Error(
    `Invalid crystallization domain "${String(value)}". Expected ${crystallizationDomains.join(", ")}.`,
  );
}

export const aiResearchCrystallizationSources: NetworkCrystallizationSource[] = [
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
    domain: "AI_RESEARCH",
    candidateKind: "ai_research_signal",
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
    domain: "AI_RESEARCH",
    candidateKind: "ai_research_signal",
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
    domain: "AI_RESEARCH",
    candidateKind: "ai_research_signal",
  },
];

export const codingAutomationCrystallizationSources: NetworkCrystallizationSource[] = [
  {
    id: "openai-codex-releases",
    label: "OpenAI Codex releases",
    url: "https://github.com/openai/codex/releases.atom",
    kind: "atom",
    qualityTier: "primary",
    category: "AI coding agent",
    trustReason: "OpenAI Codex is an official local coding agent repository.",
    queryHints: ["codex", "coding agent", "terminal", "sandbox", "review"],
    defaultTags: ["network", "coding", "ai-coding", "openai"],
    domain: "CODING_AUTOMATION",
    candidateKind: "ai_coding_agent_pattern",
    repo: "openai/codex",
  },
  {
    id: "openai-codex-commits",
    label: "OpenAI Codex commits",
    url: "https://github.com/openai/codex/commits/main.atom",
    kind: "atom",
    qualityTier: "primary",
    category: "AI coding agent commits",
    trustReason: "Codex commit activity reveals implementation and governance drift.",
    queryHints: ["agent", "sandbox", "approval", "security", "workflow"],
    defaultTags: ["network", "coding", "repo-evolution", "openai"],
    domain: "CODING_AUTOMATION",
    candidateKind: "repo_architecture_signal",
    repo: "openai/codex",
  },
  {
    id: "openai-agents-sdk-docs",
    label: "OpenAI Agents SDK docs",
    url: "https://developers.openai.com/api/docs/guides/agents",
    kind: "html",
    qualityTier: "primary",
    category: "agent framework docs",
    trustReason:
      "Official Agents SDK documentation explains orchestration, tools, guardrails, and human review.",
    queryHints: ["agents", "tools", "guardrails", "human review", "state"],
    defaultTags: ["network", "coding", "agents-sdk", "openai"],
    domain: "CODING_AUTOMATION",
    candidateKind: "ai_coding_agent_pattern",
    repo: "openai/openai-agents-js",
  },
  {
    id: "openai-agents-js-releases",
    label: "OpenAI Agents JS releases",
    url: "https://github.com/openai/openai-agents-js/releases.atom",
    kind: "atom",
    qualityTier: "primary",
    category: "agent framework releases",
    trustReason: "Official TypeScript agent framework release stream.",
    queryHints: ["agent", "typescript", "tools", "handoff", "guardrail"],
    defaultTags: ["network", "coding", "agents-sdk", "typescript"],
    domain: "CODING_AUTOMATION",
    candidateKind: "ai_coding_agent_pattern",
    repo: "openai/openai-agents-js",
  },
  {
    id: "mcp-sdk-docs",
    label: "Model Context Protocol SDK docs",
    url: "https://modelcontextprotocol.io/docs/sdk",
    kind: "html",
    qualityTier: "primary",
    category: "agent protocol docs",
    trustReason:
      "The MCP SDK docs describe the open agent-tool protocol and language support.",
    queryHints: ["mcp", "sdk", "typescript", "python", "server", "tool"],
    defaultTags: ["network", "coding", "mcp", "protocol"],
    domain: "CODING_AUTOMATION",
    candidateKind: "governance_or_security_signal",
    repo: "modelcontextprotocol/servers",
  },
  {
    id: "mcp-servers-commits",
    label: "MCP servers commits",
    url: "https://github.com/modelcontextprotocol/servers/commits/main.atom",
    kind: "atom",
    qualityTier: "primary",
    category: "agent protocol servers",
    trustReason:
      "Official MCP servers reveal connector patterns and protocol hardening pressure.",
    queryHints: ["server", "github", "git", "filesystem", "security", "tool"],
    defaultTags: ["network", "coding", "mcp", "servers"],
    domain: "CODING_AUTOMATION",
    candidateKind: "governance_or_security_signal",
    repo: "modelcontextprotocol/servers",
  },
  {
    id: "openhands-releases",
    label: "OpenHands releases",
    url: "https://github.com/All-Hands-AI/OpenHands/releases.atom",
    kind: "atom",
    qualityTier: "curated",
    category: "open-source coding agent",
    trustReason: "OpenHands is a major open-source autonomous coding platform.",
    queryHints: ["coding agent", "runtime", "sandbox", "github", "ci", "security"],
    defaultTags: ["network", "coding", "open-source-agent"],
    domain: "CODING_AUTOMATION",
    candidateKind: "ai_coding_agent_pattern",
    repo: "All-Hands-AI/OpenHands",
  },
  {
    id: "aider-releases",
    label: "Aider releases",
    url: "https://github.com/Aider-AI/aider/releases.atom",
    kind: "atom",
    qualityTier: "curated",
    category: "open-source pair programming",
    trustReason: "Aider is a widely used terminal AI pair-programming project.",
    queryHints: ["repo map", "edit", "git", "architect", "pair programming"],
    defaultTags: ["network", "coding", "pair-programming"],
    domain: "CODING_AUTOMATION",
    candidateKind: "ai_coding_agent_pattern",
    repo: "Aider-AI/aider",
  },
  {
    id: "arxiv-cs-se",
    label: "arXiv cs.SE",
    url: "https://export.arxiv.org/rss/cs.SE",
    kind: "rss",
    qualityTier: "research",
    category: "software engineering research",
    trustReason:
      "arXiv software engineering feed captures design, testing, refactoring, and CI research.",
    queryHints: [
      "software engineering",
      "refactoring",
      "testing",
      "architecture",
      "design pattern",
      "agent",
    ],
    defaultTags: ["network", "coding", "software-engineering"],
    domain: "CODING_AUTOMATION",
    candidateKind: "programming_paradigm_signal",
  },
  {
    id: "arxiv-cs-pl",
    label: "arXiv cs.PL",
    url: "https://export.arxiv.org/rss/cs.PL",
    kind: "rss",
    qualityTier: "research",
    category: "programming languages research",
    trustReason:
      "Programming languages research keeps OOP, procedural, functional, modular, and type-system ideas visible.",
    queryHints: [
      "object-oriented",
      "functional programming",
      "procedural",
      "module",
      "type system",
      "design pattern",
    ],
    defaultTags: ["network", "coding", "programming-languages"],
    domain: "CODING_AUTOMATION",
    candidateKind: "programming_paradigm_signal",
  },
];

export const defaultNetworkCrystallizationSources: NetworkCrystallizationSource[] = [
  ...aiResearchCrystallizationSources,
  ...codingAutomationCrystallizationSources,
];

const tierBaseScore: Record<NetworkCrystallizationQualityTier, number> = {
  research: 62,
  institutional: 58,
  primary: 56,
  curated: 48,
};

const codingSandboxMap: Record<
  NetworkCandidateKind,
  { mode: SandboxMode; worldlineKey: WorldlineKey }
> = {
  ai_research_signal: { mode: "SONATA", worldlineKey: "AI_DIRECTED_WORLD" },
  repo_architecture_signal: {
    mode: "SYMPHONY",
    worldlineKey: "STELLAR_COMMONWEALTH",
  },
  ai_coding_agent_pattern: {
    mode: "SONATA",
    worldlineKey: "AI_DIRECTED_WORLD",
  },
  programming_paradigm_signal: {
    mode: "SONATA",
    worldlineKey: "DAO_GOVERNANCE",
  },
  design_pattern_signal: { mode: "SONATA", worldlineKey: "DAO_GOVERNANCE" },
  tooling_failure_signal: { mode: "FUGUE", worldlineKey: "FORK_DRIFT" },
  governance_or_security_signal: {
    mode: "SYMPHONY",
    worldlineKey: "HOPEPUNK_REPAIR",
  },
};

export function sourcesForCrystallizationDomain(
  domain: CrystallizationDomain,
  sources: NetworkCrystallizationSource[] = defaultNetworkCrystallizationSources,
) {
  return sources.filter((source) => (source.domain ?? "AI_RESEARCH") === domain);
}

export function codingSandboxPlanForCandidate(candidate: NetworkSignalCandidate) {
  return codingSandboxMap[candidate.candidateKind];
}

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

function firstMeta(html: string, name: string) {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  return stripMarkup(pattern.exec(html)?.[1] ?? "");
}

function candidateId(sourceId: string, href: string, title: string) {
  return `network:${stableHash({ sourceId, href, title }).slice(0, 32)}`;
}

function classifyCandidateKind({
  source,
  title,
  summary,
}: {
  source: NetworkCrystallizationSource;
  title: string;
  summary: string;
}): NetworkCandidateKind {
  if (source.candidateKind) return source.candidateKind;
  if ((source.domain ?? "AI_RESEARCH") === "AI_RESEARCH") return "ai_research_signal";
  const lower = `${title} ${summary} ${source.category}`.toLowerCase();
  if (/(vulnerab|security|cve|permission|sandbox escape|prompt injection|governance)/.test(lower)) {
    return "governance_or_security_signal";
  }
  if (/(fail|bug|regression|incident|broken|error|repair)/.test(lower)) {
    return "tooling_failure_signal";
  }
  if (/(object-oriented|functional|procedural|type system|language|module)/.test(lower)) {
    return "programming_paradigm_signal";
  }
  if (/(pattern|architecture|refactor|design|modular)/.test(lower)) {
    return "design_pattern_signal";
  }
  if (/(agent|codex|aider|openhands|swe-agent|mcp|tool)/.test(lower)) {
    return "ai_coding_agent_pattern";
  }
  return "repo_architecture_signal";
}

function scoreCandidate({
  source,
  title,
  href,
  summary,
  publishedAt,
  candidateKind,
}: {
  source: NetworkCrystallizationSource;
  title: string;
  href: string;
  summary: string;
  publishedAt?: string;
  candidateKind: NetworkCandidateKind;
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
  if ((source.domain ?? "AI_RESEARCH") === "CODING_AUTOMATION") {
    score += 4;
    reasons.push(`coding domain candidate: ${candidateKind}`);
  }
  if (source.repo) {
    score += 4;
    reasons.push(`tracked repo: ${source.repo}`);
  }

  return { qualityScore: Math.min(100, Math.round(score)), qualityReasons: reasons };
}

function normalizeHref(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export function createNetworkSignalCandidate({
  source,
  title,
  href,
  summary,
  publishedAt,
  repo,
  language,
  candidateKind,
  tags = [],
  sourceKind,
}: {
  source: NetworkCrystallizationSource;
  title: string;
  href: string;
  summary: string;
  publishedAt?: string;
  repo?: string;
  language?: string;
  candidateKind?: NetworkCandidateKind;
  tags?: string[];
  sourceKind?: NetworkSignalCandidate["sourceKind"];
}): NetworkSignalCandidate | undefined {
  const cleanTitle = stripMarkup(title).slice(0, 220);
  const cleanHref = normalizeHref(href);
  const cleanSummary = stripMarkup(summary).slice(0, 1_800);
  if (!cleanTitle || !cleanHref) return undefined;
  const kind = candidateKind ?? classifyCandidateKind({
    source,
    title: cleanTitle,
    summary: cleanSummary,
  });
  const domain = source.domain ?? "AI_RESEARCH";
  const scored = scoreCandidate({
    source,
    title: cleanTitle,
    href: cleanHref,
    summary: cleanSummary,
    publishedAt,
    candidateKind: kind,
  });

  return {
    id: candidateId(source.id, cleanHref, cleanTitle),
    sourceId: source.id,
    sourceLabel: source.label,
    sourceKind: sourceKind ?? source.kind,
    domain,
    candidateKind: kind,
    title: cleanTitle,
    href: cleanHref,
    summary: cleanSummary,
    publishedAt,
    repo: repo ?? source.repo,
    language,
    tags: Array.from(new Set([...source.defaultTags, ...tags, domain.toLowerCase()])),
    ...scored,
  };
}

export function parseNetworkFeed(
  xml: string,
  source: NetworkCrystallizationSource,
): NetworkSignalCandidate[] {
  if (source.kind === "html") {
    const title =
      firstTag(xml, "title") ||
      firstMeta(xml, "og:title") ||
      `${source.label} documentation`;
    const summary =
      firstMeta(xml, "description") ||
      firstMeta(xml, "og:description") ||
      firstTag(xml, "h1") ||
      stripMarkup(xml).slice(0, 600);
    const candidate = createNetworkSignalCandidate({
      source,
      title,
      href: source.url,
      summary,
    });
    return candidate ? [candidate] : [];
  }

  const rssItems = blocksFor(xml, "item").map((block) =>
    createNetworkSignalCandidate({
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
    createNetworkSignalCandidate({
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
    domain,
  }: {
    maxItems?: number;
    minQuality?: number;
    query?: string;
    knownEventIds?: ReadonlySet<string>;
    domain?: CrystallizationDomain;
  } = {},
) {
  const queryTerms = (query ?? "")
    .split(/[, ]+/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

  return candidates
    .filter((candidate) => !domain || candidate.domain === domain)
    .filter((candidate) => !knownEventIds.has(candidateToJiEventId(candidate)))
    .filter((candidate) => candidate.qualityScore >= minQuality)
    .filter((candidate) => {
      if (queryTerms.length === 0) return true;
      const haystack =
        `${candidate.title} ${candidate.summary} ${candidate.tags.join(" ")} ${candidate.repo ?? ""}`.toLowerCase();
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
    `Domain: ${candidate.domain}`,
    `Candidate kind: ${candidate.candidateKind}`,
    `Source: ${candidate.sourceLabel} (${candidate.sourceId})`,
    candidate.repo ? `Repository: ${candidate.repo}` : undefined,
    candidate.language ? `Language: ${candidate.language}` : undefined,
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
    candidate.domain === "CODING_AUTOMATION"
      ? "Should this coding signal become a CrystalNode, coding Sandbox rehearsal, RFC draft, architecture note, or be dismissed?"
      : "Should this network signal become a CrystalNode, Sandbox rehearsal, RFC draft, or be dismissed?",
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
      { label: "domain", hash: candidate.domain },
      { label: "candidate-kind", hash: candidate.candidateKind },
      ...(candidate.repo
        ? [{ label: "repo", href: `https://github.com/${candidate.repo}` }]
        : []),
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
      domain: candidate.domain,
      candidateKind: candidate.candidateKind,
      title: candidate.title,
      href: candidate.href,
      repo: candidate.repo,
      summary: candidate.summary,
      publishedAt: candidate.publishedAt,
      qualityScore: candidate.qualityScore,
    });
    const eventHash = stableHash({
      index,
      eventId,
      sourceId: candidate.sourceId,
      domain: candidate.domain,
      candidateKind: candidate.candidateKind,
      href: candidate.href,
      bodyHash,
      previousHash: cursor,
    });
    const entry = {
      index,
      eventId,
      sourceId: candidate.sourceId,
      domain: candidate.domain,
      candidateKind: candidate.candidateKind,
      title: candidate.title,
      href: candidate.href,
      repo: candidate.repo,
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

export function codingCandidateToSandboxInput(
  candidate: NetworkSignalCandidate,
  sourceJiEventId = candidateToJiEventId(candidate),
): SandboxRunInput {
  const plan = codingSandboxPlanForCandidate(candidate);
  const repoText = candidate.repo ? ` in ${candidate.repo}` : "";
  const common = {
    mode: plan.mode,
    title: `Coding ${plan.mode}: ${candidate.title}`,
    description: `Coding automation rehearsal for ${candidate.candidateKind}${repoText}. Source remains a JiEvent review signal, not canonical truth.`,
    worldlineKey: plan.worldlineKey,
    worldlineHypothesis: `A coding signal can improve Crystal Pool only when architecture, responsibility, review, and repair stay traceable${repoText}.`,
    responsibilityQuestion:
      "Can this coding pattern improve automation without bypassing human review, test evidence, or canonical promotion gates?",
    sourceJiEventIds: [sourceJiEventId],
  } satisfies Partial<SandboxRunInput>;

  if (plan.mode === "FUGUE") {
    return {
      ...common,
      targetMechanism: candidate.candidateKind,
      inputMechanisms: [candidate.candidateKind, "review gate", "repo provenance"],
      exploitVector:
        "Coding automation may remove review friction, execute untrusted code, or convert popularity into authority.",
      observedFailure: candidate.summary,
      proposedPatch:
        "Keep repo analysis read-only, require review before canonical promotion, and sandbox any authority-expanding pattern.",
    };
  }

  if (plan.mode === "SONATA") {
    return {
      ...common,
      theme: candidate.title,
      counterTheme:
        "A useful coding pattern can still harden into hidden coupling, tool deference, or unreviewed automation.",
      inputMechanisms: [candidate.candidateKind, "module boundary", "review queue"],
      proposedRevision:
        "Import only after a reviewer confirms provenance, failure mode, modular boundary, and rollback path.",
    };
  }

  return {
    ...common,
    inputMechanisms: [
      "coding agent workflow",
      "repo architecture",
      "review gate",
      "sandbox learning promotion",
    ],
    inputActors: ["coding agent", "maintainer", "reviewer", "future contributor"],
    openingState:
      "Coding tools, repositories, and programming paradigms emit reviewable signals into the ecosystem lane.",
    firstShock: `${candidate.candidateKind}: ${candidate.title}`,
    escalation: candidate.summary,
    counterpoint:
      "Automation speed, architecture quality, human responsibility, and open-source governance pull in different directions.",
    collapseOrStabilization:
      "The system stabilizes only if repo evidence remains inspectable and sandbox outputs cannot become canonical without review.",
    lessons: [
      "High coding velocity is not reliability unless tests, ownership, and repair paths remain visible.",
      "Repository popularity is an observation, not proof of fit for Crystal Pool.",
    ],
    constitutionalPatch:
      "Coding automation may propose architecture and sandbox rehearsals, but cannot execute cloned code or promote canonical meaning directly.",
  };
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
  const profile = crystallizationDomainProfiles[manifest.domain];
  const candidateLines = candidates.length
    ? candidates
        .map(
          (candidate) =>
            `- ${candidate.qualityScore}/100 [${candidate.domain}/${candidate.candidateKind}] ${candidate.sourceLabel}: ${candidate.title}${candidate.repo ? ` repo=${candidate.repo}` : ""} (${candidate.href})`,
        )
        .join("\n")
    : "- No candidates met the quality threshold.";
  const chainLines = chain.length
    ? chain
        .map(
          (entry) =>
            `- ${entry.index}: ${entry.eventId} ${entry.domain}/${entry.candidateKind} hash=${entry.eventHash.slice(0, 16)} prev=${entry.previousHash?.slice(0, 16) ?? "genesis"}`,
        )
        .join("\n")
    : "- No chain entries created.";

  return [
    `# Network Crystallization Run: ${manifest.runId}`,
    "",
    "## Domain",
    `${profile.label} / ${profile.nativeLabel}: ${profile.description}`,
    "",
    "## Boundary",
    "This skill searches configured high-quality sources, forms a local hash chain, and writes reviewable JiEvents. Coding repository scans are read-only. It does not create canonical CrystalNodes, promote learning, execute cloned code, upload anchors, open PRs, or unlock AI mainline.",
    "",
    "## Summary",
    `- domain: ${manifest.domain}`,
    `- sources: ${manifest.sources}`,
    `- fetchedSources: ${manifest.fetchedSources}`,
    `- failedSources: ${manifest.failedSources}`,
    `- repoScans: ${manifest.repoScans}`,
    `- candidates: ${manifest.candidates}`,
    `- chained: ${manifest.chained}`,
    `- jiEventsWritten: ${manifest.jiEventsWritten}`,
    `- sandboxRunsCreated: ${manifest.sandboxRunsCreated}`,
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
    manifest.domain === "CODING_AUTOMATION"
      ? "Review coding JiEvents in /ecosystem and inspect auto-created Sandbox runs before importing architecture lessons."
      : "Review the JiEvents in /ecosystem. Use Sonata for theme maturation, Symphony for systemic implications, and Fugue if a source reveals a mechanism failure.",
  ].join("\n");
}
