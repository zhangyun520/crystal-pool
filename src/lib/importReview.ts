import { edgeRelations, phases, type EdgeRelation } from "./domain";
import { type ImportCandidate } from "./importFragments";
import { explainImportCandidate } from "./explanations";
import {
  findResonanceMatches,
  type ReferenceNode,
  type ResonanceMatch,
} from "./resonance";

export const importReviewActions = [
  "create",
  "merge",
  "edge",
  "dismiss",
] as const;

export type ImportReviewAction = (typeof importReviewActions)[number];

export type ImportReviewItem = {
  id: string;
  candidate: ImportCandidate;
  action: ImportReviewAction;
  matches: ResonanceMatch[];
  targetNodeId?: string;
  edgeToNodeId?: string;
  relation: EdgeRelation;
  weight: number;
  explanations: string[];
};

export type ImportReviewCommitItem = {
  action: ImportReviewAction;
  candidate: ImportCandidate;
  targetNodeId?: string;
  edgeToNodeId?: string;
  relation?: EdgeRelation;
  weight?: number;
};

export type ImportReviewCommitSummary = {
  created: number;
  merged: number;
  edges: number;
  dismissed: number;
  skipped: number;
};

function reviewId(candidate: ImportCandidate, index: number) {
  return `${index}:${candidate.title}:${candidate.body.length}`;
}

function defaultAction(matches: ResonanceMatch[]): ImportReviewAction {
  if (matches[0]?.kind === "duplicate") return "merge";
  if (matches.length >= 2) return "edge";
  return "create";
}

function defaultEdgeTarget(matches: ResonanceMatch[]) {
  if (matches.length < 2) return undefined;
  return matches[1].nodeId;
}

export function buildImportReviewItems(
  candidates: ImportCandidate[],
  referenceNodes: ReferenceNode[],
): ImportReviewItem[] {
  return candidates.map((candidate, index) => {
    const matches = findResonanceMatches(candidate, referenceNodes);
    const action = defaultAction(matches);
    const targetNodeId = matches[0]?.nodeId;
    return {
      id: reviewId(candidate, index),
      candidate,
      action,
      matches,
      targetNodeId,
      edgeToNodeId:
        action === "edge" ? defaultEdgeTarget(matches) : undefined,
      relation: "resonates_with",
      weight: matches[0] ? Math.max(1, Math.round(matches[0].score * 4)) : 1,
      explanations: explainImportCandidate(candidate, matches),
    };
  });
}

export function normalizeReviewCommitItem(
  item: ImportReviewCommitItem,
): ImportReviewCommitItem {
  const phase = phases.includes(item.candidate.phase)
    ? item.candidate.phase
    : "gas";
  const relation =
    item.relation && edgeRelations.includes(item.relation)
      ? item.relation
      : "resonates_with";
  return {
    action: importReviewActions.includes(item.action) ? item.action : "dismiss",
    candidate: {
      title: item.candidate.title.trim().slice(0, 140),
      body: item.candidate.body.trim().slice(0, 4_000),
      phase,
      emotionHa: Math.max(0, Math.min(10, Number(item.candidate.emotionHa) || 0)),
      tags: Array.from(
        new Set(item.candidate.tags.map((tag) => tag.trim()).filter(Boolean)),
      ).slice(0, 12),
    },
    targetNodeId: item.targetNodeId?.trim() || undefined,
    edgeToNodeId: item.edgeToNodeId?.trim() || undefined,
    relation,
    weight: Math.max(0, Math.min(10, Number(item.weight) || 1)),
  };
}

export function summarizeReviewCommitItems(
  items: ImportReviewCommitItem[],
): ImportReviewCommitSummary {
  return items.reduce(
    (summary, rawItem) => {
      const item = normalizeReviewCommitItem(rawItem);
      if (item.action === "dismiss") summary.dismissed += 1;
      else if (!item.candidate.title || !item.candidate.body) summary.skipped += 1;
      else if (item.action === "create") summary.created += 1;
      else if (item.action === "merge" && item.targetNodeId) summary.merged += 1;
      else if (
        item.action === "edge" &&
        item.targetNodeId &&
        item.edgeToNodeId &&
        item.targetNodeId !== item.edgeToNodeId
      ) {
        summary.edges += 1;
      } else summary.skipped += 1;
      return summary;
    },
    { created: 0, merged: 0, edges: 0, dismissed: 0, skipped: 0 },
  );
}
