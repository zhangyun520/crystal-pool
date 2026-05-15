import { clamp, type EdgeRelation, type Phase } from "./domain";
import { explainImportCandidate } from "./explanations";
import { inferCandidate, parseImportFragments, type ImportCandidate } from "./importFragments";
import {
  findResonanceMatches,
  type ReferenceNode,
  type ResonanceMatch,
} from "./resonance";

export const corpusSourceKinds = [
  "manual",
  "chatgpt",
  "common_crawl",
  "wikimedia",
  "gutenberg",
  "wayback",
  "file",
] as const;

export type CorpusSourceKind = (typeof corpusSourceKinds)[number];

export type CorpusDocumentInput = {
  sourceKind?: CorpusSourceKind;
  sourceRef: string;
  title?: string;
  body: string;
  capturedAt?: Date | string;
  license?: string;
};

export type CorpusSnapshot = {
  id: string;
  sourceKind: CorpusSourceKind;
  sourceRef: string;
  canonicalRef: string;
  title: string;
  body: string;
  textHash: string;
  capturedAt: string;
  license?: string;
};

export type MeaningMark = {
  id: string;
  snapshotId: string;
  stableKey: string;
  title: string;
  body: string;
  phase: Phase;
  emotionHa: number;
  tags: string[];
  suggestedRelation: EdgeRelation;
  confidence: number;
  matches: ResonanceMatch[];
  explanations: string[];
  createdAt: string;
};

export type MeaningTrajectoryEventType =
  | "appeared"
  | "phase_shifted"
  | "ha_changed"
  | "tag_changed"
  | "resonance_changed"
  | "disappeared";

export type MeaningTrajectoryEvent = {
  id: string;
  sourceRef: string;
  stableKey: string;
  title: string;
  eventType: MeaningTrajectoryEventType;
  summary: string;
  createdAt: string;
  from?: string;
  to?: string;
};

export type CorpusTrailBundle = {
  schemaVersion: "crystal-pool.corpus-trail.v1";
  createdAt: string;
  snapshots: CorpusSnapshot[];
  marks: MeaningMark[];
  trajectoryEvents: MeaningTrajectoryEvent[];
};

function normalizeText(input: string) {
  return input.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

export function stableTextHash(input: string) {
  let hash = 0x811c9dc5;
  for (const char of Array.from(input)) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}

export function canonicalizeCorpusRef(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "manual:untitled";

  try {
    const url = new URL(trimmed);
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";
    if (
      (url.protocol === "http:" && url.port === "80") ||
      (url.protocol === "https:" && url.port === "443")
    ) {
      url.port = "";
    }
    const sortedParams = Array.from(url.searchParams.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    url.search = "";
    for (const [key, value] of sortedParams) {
      url.searchParams.append(key, value);
    }
    const canonical = url.toString();
    return canonical.endsWith("/") && !url.search
      ? canonical.slice(0, -1)
      : canonical;
  } catch {
    return trimmed.replace(/\s+/g, " ");
  }
}

export function createCorpusSnapshot(input: CorpusDocumentInput): CorpusSnapshot {
  const sourceKind = corpusSourceKinds.includes(input.sourceKind ?? "manual")
    ? (input.sourceKind ?? "manual")
    : "manual";
  const body = normalizeText(input.body);
  const sourceRef = input.sourceRef.trim() || input.title?.trim() || "manual:untitled";
  const canonicalRef = canonicalizeCorpusRef(sourceRef);
  const capturedAt = input.capturedAt
    ? new Date(input.capturedAt).toISOString()
    : new Date().toISOString();
  const title = input.title?.trim() || canonicalRef;
  const textHash = stableTextHash(body);

  return {
    id: `snap_${stableTextHash(`${sourceKind}\n${canonicalRef}\n${capturedAt}\n${textHash}`)}`,
    sourceKind,
    sourceRef,
    canonicalRef,
    title,
    body,
    textHash,
    capturedAt,
    license: input.license?.trim() || undefined,
  };
}

function inferSuggestedRelation(candidate: ImportCandidate, matches: ResonanceMatch[]): EdgeRelation {
  const body = candidate.body.toLowerCase();
  if (candidate.emotionHa >= 6) return "ha_softens";
  if (/触发|trigger/.test(body)) return "triggers";
  if (/矛盾|反对|contradict/.test(body)) return "contradicts";
  if (/来自|衍生|derive|derived/.test(body)) return "derives_from";
  if (/溶解|解构|dissolve/.test(body)) return "dissolves_into";
  if (/结晶|硬化|核心|harden/.test(body)) return "hardens_into";
  if (matches[0]?.kind === "duplicate") return "derives_from";
  return "resonates_with";
}

function markStableKey(snapshot: CorpusSnapshot, candidate: ImportCandidate) {
  const firstClause = candidate.body.split(/[，,。！？!?；;]/)[0] || candidate.body;
  const semanticAnchor =
    firstClause
      .toLowerCase()
      .replace(/(最硬|核心|结晶|总纲|哈基米|哈哈|哈)/g, "")
      .replace(/[^\p{Letter}\p{Number}\p{Script=Han}]+/gu, "")
      .slice(0, 24) || candidate.title.toLowerCase();
  return stableTextHash(`${snapshot.canonicalRef}\n${semanticAnchor}`);
}

export function createMeaningMarks(
  snapshot: CorpusSnapshot,
  referenceNodes: ReferenceNode[] = [],
): MeaningMark[] {
  const candidates =
    parseImportFragments(snapshot.body).length > 0
      ? parseImportFragments(snapshot.body)
      : [inferCandidate(snapshot.body)];

  return candidates.map((candidate, index) => {
    const matches = findResonanceMatches(candidate, referenceNodes);
    const suggestedRelation = inferSuggestedRelation(candidate, matches);
    const confidence = clamp(
      (matches[0]?.score ?? 0) * 100 + candidate.tags.length * 6 + candidate.emotionHa * 2,
      0,
      100,
    );
    const stableKey = markStableKey(snapshot, candidate);

    return {
      id: `mark_${stableTextHash(`${snapshot.id}\n${index}\n${candidate.body}`)}`,
      snapshotId: snapshot.id,
      stableKey,
      title: candidate.title,
      body: candidate.body,
      phase: candidate.phase,
      emotionHa: candidate.emotionHa,
      tags: candidate.tags,
      suggestedRelation,
      confidence: Math.round(confidence) / 100,
      matches,
      explanations: explainImportCandidate(candidate, matches),
      createdAt: snapshot.capturedAt,
    };
  });
}

function tagsKey(mark: MeaningMark) {
  return [...mark.tags].sort().join(", ");
}

function resonanceKey(mark: MeaningMark) {
  const topMatch = mark.matches[0];
  return topMatch
    ? `${mark.suggestedRelation}:${topMatch.nodeId}:${topMatch.kind}`
    : mark.suggestedRelation;
}

function trajectoryEvent(
  type: MeaningTrajectoryEventType,
  mark: MeaningMark,
  sourceRef: string,
  summary: string,
  from?: string,
  to?: string,
): MeaningTrajectoryEvent {
  return {
    id: `traj_${stableTextHash(`${type}\n${mark.id}\n${from ?? ""}\n${to ?? ""}`)}`,
    sourceRef,
    stableKey: mark.stableKey,
    title: mark.title,
    eventType: type,
    summary,
    createdAt: mark.createdAt,
    from,
    to,
  };
}

export function diffMeaningMarks(
  previous: MeaningMark[],
  next: MeaningMark[],
  sourceRef = "corpus",
): MeaningTrajectoryEvent[] {
  const events: MeaningTrajectoryEvent[] = [];
  const previousByKey = new Map(previous.map((mark) => [mark.stableKey, mark]));
  const nextByKey = new Map(next.map((mark) => [mark.stableKey, mark]));

  for (const mark of next) {
    const before = previousByKey.get(mark.stableKey);
    if (!before) {
      events.push(
        trajectoryEvent(
          "appeared",
          mark,
          sourceRef,
          `New meaning mark appeared as ${mark.phase}.`,
          undefined,
          mark.phase,
        ),
      );
      continue;
    }

    if (before.phase !== mark.phase) {
      events.push(
        trajectoryEvent(
          "phase_shifted",
          mark,
          sourceRef,
          `Phase shifted from ${before.phase} to ${mark.phase}.`,
          before.phase,
          mark.phase,
        ),
      );
    }

    if (before.emotionHa !== mark.emotionHa) {
      events.push(
        trajectoryEvent(
          "ha_changed",
          mark,
          sourceRef,
          `Ha changed from ${before.emotionHa} to ${mark.emotionHa}.`,
          String(before.emotionHa),
          String(mark.emotionHa),
        ),
      );
    }

    if (tagsKey(before) !== tagsKey(mark)) {
      events.push(
        trajectoryEvent(
          "tag_changed",
          mark,
          sourceRef,
          "Tag signature changed.",
          tagsKey(before),
          tagsKey(mark),
        ),
      );
    }

    if (resonanceKey(before) !== resonanceKey(mark)) {
      events.push(
        trajectoryEvent(
          "resonance_changed",
          mark,
          sourceRef,
          "Top resonance or suggested relation changed.",
          resonanceKey(before),
          resonanceKey(mark),
        ),
      );
    }
  }

  for (const mark of previous) {
    if (!nextByKey.has(mark.stableKey)) {
      events.push(
        trajectoryEvent(
          "disappeared",
          mark,
          sourceRef,
          "Meaning mark disappeared from the next snapshot.",
          mark.phase,
          undefined,
        ),
      );
    }
  }

  return events;
}

export function buildCorpusTrailBundle(
  entries: Array<{ snapshot: CorpusSnapshot; marks: MeaningMark[] }>,
): CorpusTrailBundle {
  const sortedEntries = [...entries].sort((a, b) =>
    a.snapshot.capturedAt.localeCompare(b.snapshot.capturedAt),
  );
  const entriesBySource = new Map<
    string,
    Array<{ snapshot: CorpusSnapshot; marks: MeaningMark[] }>
  >();
  for (const entry of sortedEntries) {
    const group = entriesBySource.get(entry.snapshot.canonicalRef) ?? [];
    group.push(entry);
    entriesBySource.set(entry.snapshot.canonicalRef, group);
  }
  const trajectoryEvents = Array.from(entriesBySource.values()).flatMap(
    (sourceEntries) =>
      sourceEntries.flatMap((entry, index) =>
        diffMeaningMarks(
          index === 0 ? [] : sourceEntries[index - 1].marks,
          entry.marks,
          entry.snapshot.canonicalRef,
        ),
      ),
  );

  return {
    schemaVersion: "crystal-pool.corpus-trail.v1",
    createdAt: new Date().toISOString(),
    snapshots: sortedEntries.map((entry) => entry.snapshot),
    marks: sortedEntries.flatMap((entry) => entry.marks),
    trajectoryEvents,
  };
}

export function summarizeMeaningMarks(marks: MeaningMark[]) {
  return marks.reduce(
    (summary, mark) => {
      summary.total += 1;
      summary.byPhase[mark.phase] = (summary.byPhase[mark.phase] ?? 0) + 1;
      summary.byRelation[mark.suggestedRelation] =
        (summary.byRelation[mark.suggestedRelation] ?? 0) + 1;
      if (mark.emotionHa >= 6) summary.highHa += 1;
      if (mark.matches.some((match) => match.kind === "duplicate")) {
        summary.duplicates += 1;
      }
      return summary;
    },
    {
      total: 0,
      highHa: 0,
      duplicates: 0,
      byPhase: {} as Record<Phase, number>,
      byRelation: {} as Record<EdgeRelation, number>,
    },
  );
}
