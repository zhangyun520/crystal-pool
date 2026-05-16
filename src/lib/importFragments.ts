import { type Phase } from "./domain";

export type ImportCandidate = {
  title: string;
  body: string;
  phase: Phase;
  emotionHa: number;
  tags: string[];
};

const seedMarkers = ["最硬", "核心", "结晶", "总纲"];
const haMarkers = ["哈基米", "哈哈", "哈"];

function normalize(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function titleFromBody(body: string) {
  const compact = body.replace(/\s+/g, " ").trim();
  return compact.length > 34 ? `${compact.slice(0, 34)}...` : compact;
}

export function inferCandidate(body: string): ImportCandidate {
  const phase = seedMarkers.some((marker) => body.includes(marker))
    ? "seed"
    : "gas";
  const emotionHa = haMarkers.some((marker) => body.includes(marker)) ? 6 : 0;
  const tags = [
    phase === "seed" ? "seed-marker" : "",
    emotionHa > 0 ? "ha" : "",
  ].filter(Boolean);

  return {
    title: titleFromBody(body),
    body,
    phase,
    emotionHa,
    tags,
  };
}

export function parseImportFragments(input: string): ImportCandidate[] {
  const clean = normalize(input);
  if (!clean) return [];

  const blocks = clean.split(/\n\s*\n/g).flatMap((block) => {
    if (block.length <= 120) return [block.trim()];
    return block
      .split(/(?<=[。！？!?])\s+/g)
      .map((part) => part.trim())
      .filter((part) => part.length >= 8);
  });

  const seen = new Set<string>();
  return blocks
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter((block) => {
      if (block.length < 4 || seen.has(block)) return false;
      seen.add(block);
      return true;
    })
    .map(inferCandidate);
}
