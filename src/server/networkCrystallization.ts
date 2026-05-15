import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildNetworkCrystallizationChain,
  candidateToJiEvent,
  candidateToJiEventId,
  defaultNetworkCrystallizationSources,
  generateNetworkCrystallizationReport,
  networkCrystallizationQualityTiers,
  parseNetworkFeed,
  selectNetworkCandidates,
  type NetworkCrystallizationChainEntry,
  type NetworkCrystallizationManifest,
  type NetworkCrystallizationSource,
  type NetworkSignalCandidate,
} from "@/lib/networkCrystallization";
import { parseJiEventJsonl, type JiEvent } from "@/lib/ji";
import { prisma } from "./db";
import { jiInboxDir, writeJiEventToInbox } from "./ji";

const networkRunsDir = path.join(process.cwd(), "data", "ecosystem", "network-runs");
const networkChainDir = path.join(process.cwd(), "data", "ecosystem", "network-chain");
const networkSourceConfigPath = path.join(
  process.cwd(),
  "data",
  "ecosystem",
  "network-sources.json",
);

type NetworkCrystallizationLatestState = {
  latestHash: string | null;
  eventIds: string[];
  updatedAt?: string;
  lastRunId?: string;
};

export type NetworkCrystallizationRunResult = {
  runId: string;
  runDir: string;
  manifest: NetworkCrystallizationManifest;
  candidates: NetworkSignalCandidate[];
  chain: NetworkCrystallizationChainEntry[];
  jiEvents: JiEvent[];
  reportMarkdown: string;
  errors: string[];
};

export type LatestNetworkCrystallizationSummary = {
  runId: string;
  runDir: string;
  manifest?: NetworkCrystallizationManifest;
  candidates: NetworkSignalCandidate[];
  chain: NetworkCrystallizationChainEntry[];
  reportMarkdown?: string;
};

function runIdFromDate(date = new Date()) {
  return `network-${date.toISOString().replace(/[:.]/g, "-")}`;
}

function jsonl(items: unknown[]) {
  return items.map((item) => JSON.stringify(item)).join("\n") + (items.length ? "\n" : "");
}

function parseJsonl<T>(text: string): T[] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as T);
}

async function safeReadText(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

function isNetworkSource(value: unknown): value is NetworkCrystallizationSource {
  const source = value as Partial<NetworkCrystallizationSource> | null;
  return Boolean(
    source &&
      typeof source.id === "string" &&
      typeof source.label === "string" &&
      typeof source.url === "string" &&
      (source.kind === "rss" || source.kind === "atom") &&
      networkCrystallizationQualityTiers.includes(
        source.qualityTier as (typeof networkCrystallizationQualityTiers)[number],
      ) &&
      typeof source.category === "string" &&
      typeof source.trustReason === "string" &&
      Array.isArray(source.queryHints) &&
      source.queryHints.every((item) => typeof item === "string") &&
      Array.isArray(source.defaultTags) &&
      source.defaultTags.every((item) => typeof item === "string"),
  );
}

async function readConfiguredSources(): Promise<NetworkCrystallizationSource[]> {
  const text = await safeReadText(networkSourceConfigPath);
  if (!text) return defaultNetworkCrystallizationSources;

  try {
    const parsed = JSON.parse(text) as
      | NetworkCrystallizationSource[]
      | { sources?: NetworkCrystallizationSource[] };
    const rawSources = Array.isArray(parsed) ? parsed : parsed.sources;
    const sources = rawSources?.filter(isNetworkSource) ?? [];
    return sources.length > 0 ? sources : defaultNetworkCrystallizationSources;
  } catch {
    return defaultNetworkCrystallizationSources;
  }
}

async function readLatestState(): Promise<NetworkCrystallizationLatestState> {
  const text = await safeReadText(path.join(networkChainDir, "latest.json"));
  if (!text) return { latestHash: null, eventIds: [] };
  try {
    const parsed = JSON.parse(text) as Partial<NetworkCrystallizationLatestState>;
    return {
      latestHash: typeof parsed.latestHash === "string" ? parsed.latestHash : null,
      eventIds: Array.isArray(parsed.eventIds)
        ? parsed.eventIds.filter((id): id is string => typeof id === "string")
        : [],
      updatedAt: parsed.updatedAt,
      lastRunId: parsed.lastRunId,
    };
  } catch {
    return { latestHash: null, eventIds: [] };
  }
}

async function readInboxEventIds() {
  const ids = new Set<string>();
  try {
    const entries = await readdir(jiInboxDir, { withFileTypes: true });
    await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
        .map(async (entry) => {
          const text = await safeReadText(path.join(jiInboxDir, entry.name));
          if (!text) return;
          const parsed = parseJiEventJsonl(text, entry.name);
          parsed.events.forEach(({ event }) => ids.add(event.id));
        }),
    );
  } catch {
    return ids;
  }
  return ids;
}

async function getKnownJiEventIds(candidateEventIds: string[], localStateIds: string[]) {
  const dbRecords = candidateEventIds.length
    ? await prisma.jiEventRecord.findMany({
        where: { id: { in: candidateEventIds } },
        select: { id: true },
      })
    : [];
  const inboxIds = await readInboxEventIds();
  return new Set([
    ...localStateIds,
    ...dbRecords.map((record) => record.id),
    ...Array.from(inboxIds),
  ]);
}

async function fetchText(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
        "user-agent": "CrystalPoolNetworkCrystallization/1.0",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function runNetworkCrystallizationCycle({
  runId = runIdFromDate(),
  maxItems = 8,
  minQuality = 72,
  query,
  sourceIds,
  timeoutMs = 15_000,
  writeJiEvents = true,
}: {
  runId?: string;
  maxItems?: number;
  minQuality?: number;
  query?: string;
  sourceIds?: string[];
  timeoutMs?: number;
  writeJiEvents?: boolean;
} = {}): Promise<NetworkCrystallizationRunResult> {
  await Promise.all([
    mkdir(networkRunsDir, { recursive: true }),
    mkdir(networkChainDir, { recursive: true }),
    mkdir(jiInboxDir, { recursive: true }),
  ]);
  const runDir = path.join(networkRunsDir, runId);
  await mkdir(runDir, { recursive: true });

  const sourceFilter = new Set(sourceIds?.filter(Boolean) ?? []);
  const configuredSources = await readConfiguredSources();
  const sources = sourceFilter.size
    ? configuredSources.filter((source) => sourceFilter.has(source.id))
    : configuredSources;
  const latestState = await readLatestState();
  const errors: string[] = [];

  const fetched = await Promise.all(
    sources.map(async (source) => {
      try {
        const xml = await fetchText(source.url, timeoutMs);
        return { source, candidates: parseNetworkFeed(xml, source), ok: true };
      } catch (error) {
        errors.push(
          `${source.id}: ${error instanceof Error ? error.message : "Unable to fetch feed."}`,
        );
        return { source, candidates: [] as NetworkSignalCandidate[], ok: false };
      }
    }),
  );
  const allCandidates = fetched.flatMap((result) => result.candidates);
  const candidateEventIds = allCandidates.map(candidateToJiEventId);
  const knownEventIds = await getKnownJiEventIds(
    candidateEventIds,
    latestState.eventIds,
  );
  const candidates = selectNetworkCandidates(allCandidates, {
    maxItems,
    minQuality,
    query,
    knownEventIds,
  });
  const chain = buildNetworkCrystallizationChain({
    candidates,
    previousHash: latestState.latestHash,
  });
  const jiEvents = candidates.map((candidate, index) =>
    candidateToJiEvent(candidate, chain[index]),
  );

  if (writeJiEvents) {
    for (const event of jiEvents) {
      await writeJiEventToInbox(event, { fileName: "network-crystallization" });
    }
  }

  const latestHash = chain.at(-1)?.eventHash ?? latestState.latestHash;
  const now = new Date().toISOString();
  const manifest: NetworkCrystallizationManifest = {
    runId,
    mode: "network_observe_propose",
    createdAt: now,
    completedAt: now,
    sources: sources.length,
    fetchedSources: fetched.filter((result) => result.ok).length,
    failedSources: fetched.filter((result) => !result.ok).length,
    candidates: candidates.length,
    chained: chain.length,
    jiEventsWritten: writeJiEvents ? jiEvents.length : 0,
    previousHash: latestState.latestHash,
    latestHash,
    intervalRecommendationMs: 3_600_000,
    canonicalMutationAllowed: false,
  };
  const reportMarkdown = generateNetworkCrystallizationReport({
    manifest,
    candidates,
    chain,
  });

  await Promise.all([
    writeFile(path.join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(runDir, "candidates.jsonl"), jsonl(candidates)),
    writeFile(path.join(runDir, "chain.jsonl"), jsonl(chain)),
    writeFile(path.join(runDir, "ji-events.jsonl"), jsonl(jiEvents)),
    writeFile(path.join(runDir, "errors.jsonl"), jsonl(errors.map((message) => ({ message })))),
    writeFile(path.join(runDir, "report.md"), reportMarkdown),
    writeFile(
      path.join(networkChainDir, "latest.json"),
      `${JSON.stringify(
        {
          latestHash,
          eventIds: Array.from(
            new Set([...latestState.eventIds, ...jiEvents.map((event) => event.id)]),
          ),
          updatedAt: manifest.completedAt,
          lastRunId: runId,
        } satisfies NetworkCrystallizationLatestState,
        null,
        2,
      )}\n`,
    ),
  ]);

  return { runId, runDir, manifest, candidates, chain, jiEvents, reportMarkdown, errors };
}

export async function getLatestNetworkCrystallizationSummary(): Promise<
  LatestNetworkCrystallizationSummary | undefined
> {
  try {
    const entries = await readdir(networkRunsDir, { withFileTypes: true });
    const runId = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
      .reverse()[0];
    if (!runId) return undefined;

    const runDir = path.join(networkRunsDir, runId);
    const [manifestText, candidatesText, chainText, reportMarkdown] =
      await Promise.all([
        safeReadText(path.join(runDir, "manifest.json")),
        safeReadText(path.join(runDir, "candidates.jsonl")),
        safeReadText(path.join(runDir, "chain.jsonl")),
        safeReadText(path.join(runDir, "report.md")),
      ]);

    return {
      runId,
      runDir,
      manifest: manifestText
        ? (JSON.parse(manifestText) as NetworkCrystallizationManifest)
        : undefined,
      candidates: candidatesText
        ? parseJsonl<NetworkSignalCandidate>(candidatesText)
        : [],
      chain: chainText ? parseJsonl<NetworkCrystallizationChainEntry>(chainText) : [],
      reportMarkdown,
    };
  } catch {
    return undefined;
  }
}
