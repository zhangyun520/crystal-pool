import { type ImportCandidate } from "./importFragments";
import { type ResonanceMatch } from "./resonance";

export function explainResonanceMatch(match: ResonanceMatch) {
  const shared = match.sharedTerms.length
    ? ` Shared terms: ${match.sharedTerms.join(", ")}.`
    : "";
  const confidence = ` Overlap score: ${Math.round(match.score * 100)}%.`;
  if (match.kind === "duplicate") {
    return `Possible duplicate because it strongly overlaps ${match.title}.${confidence}${shared}`;
  }
  return `Potential resonance with ${match.title} based on partial overlap.${confidence}${shared}`;
}

export function explainImportCandidate(
  candidate: ImportCandidate,
  matches: ResonanceMatch[],
) {
  const explanations: string[] = [];
  if (candidate.phase === "seed") {
    explanations.push("Seed markers such as core/crystal language were detected.");
  }
  if (candidate.emotionHa > 0) {
    explanations.push("Ha markers were detected, so the candidate gets ha softness.");
  }
  if (matches[0]) {
    explanations.push(explainResonanceMatch(matches[0]));
  }
  if (explanations.length === 0) {
    explanations.push("No strong duplicate or ha/seed marker was detected.");
  }
  return explanations;
}
