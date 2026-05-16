import {
  createNetworkSignalCandidate,
  type NetworkCrystallizationSource,
  type NetworkSignalCandidate,
} from "./networkCrystallization";

export const codingRepositoryAllowlist = [
  "openai/codex",
  "openai/openai-agents-js",
  "openai/openai-agents-python",
  "openai/symphony",
  "openai/skills",
  "modelcontextprotocol/servers",
  "modelcontextprotocol/registry",
  "All-Hands-AI/OpenHands",
  "Aider-AI/aider",
  "princeton-nlp/SWE-agent",
] as const;

export type CodingRepositoryAllowlistEntry =
  (typeof codingRepositoryAllowlist)[number];

export type CodingRepoStructure = {
  repo: string;
  commit: string;
  scannedAt: string;
  fileCount: number;
  totalBytes: number;
  topLevelDirs: string[];
  manifestFiles: string[];
  readmePath?: string;
  licensePath?: string;
  primaryLanguages: string[];
  architectureHints: string[];
  skipped?: boolean;
  diagnostics: string[];
};

export type CodingRepoScanResult = {
  structure: CodingRepoStructure;
  candidates: NetworkSignalCandidate[];
  reportMarkdown: string;
};

const codingRepoSource: NetworkCrystallizationSource = {
  id: "coding-repo-scan",
  label: "Coding repo scan",
  url: "https://github.com",
  kind: "html",
  qualityTier: "primary",
  category: "read-only repository structure",
  trustReason:
    "Whitelisted GitHub repositories are shallow-cloned for read-only structure analysis without executing code.",
  queryHints: [
    "agent",
    "architecture",
    "module",
    "design",
    "test",
    "sandbox",
    "review",
  ],
  defaultTags: ["network", "coding", "repo-scan"],
  domain: "CODING_AUTOMATION",
  candidateKind: "repo_architecture_signal",
};

export function isCodingRepositoryAllowed(repo: string) {
  return codingRepositoryAllowlist.includes(repo as CodingRepositoryAllowlistEntry);
}

export function normalizeRepositoryName(repo: string) {
  return repo.trim().replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "");
}

export function languageFromPath(filePath: string) {
  if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) return "TypeScript";
  if (filePath.endsWith(".js") || filePath.endsWith(".jsx")) return "JavaScript";
  if (filePath.endsWith(".py")) return "Python";
  if (filePath.endsWith(".rs")) return "Rust";
  if (filePath.endsWith(".ex") || filePath.endsWith(".exs")) return "Elixir";
  if (filePath.endsWith(".go")) return "Go";
  if (filePath.endsWith(".java") || filePath.endsWith(".kt")) return "JVM";
  if (filePath.endsWith(".md") || filePath.endsWith(".mdx")) return "Docs";
  return undefined;
}

function topLanguage(files: string[]) {
  const counts = new Map<string, number>();
  for (const file of files) {
    const language = languageFromPath(file);
    if (!language || language === "Docs") continue;
    counts.set(language, (counts.get(language) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

function architectureHintsFor(files: string[], readmeText: string) {
  const lowerReadme = readmeText.toLowerCase();
  const lowerFiles = files.join("\n").toLowerCase();
  const hints: string[] = [];
  if (/agent|agents|runtime|orchestrat/.test(lowerReadme + lowerFiles)) {
    hints.push("agent orchestration");
  }
  if (/sandbox|permission|approval|guardrail|security/.test(lowerReadme + lowerFiles)) {
    hints.push("permission and sandbox boundary");
  }
  if (/packages\/|apps\/|crates\/|sdk|client|server/.test(lowerFiles)) {
    hints.push("modular package layout");
  }
  if (/test|spec|e2e|ci|workflow/.test(lowerFiles)) {
    hints.push("test and CI surface");
  }
  if (/mcp|tool|function call|tool call/.test(lowerReadme + lowerFiles)) {
    hints.push("tool protocol integration");
  }
  if (/design pattern|architecture|plugin|extension/.test(lowerReadme + lowerFiles)) {
    hints.push("explicit architecture pattern");
  }
  return hints.length ? hints : ["top-level repository structure"];
}

export function buildCodingRepoStructure({
  repo,
  commit,
  scannedAt,
  files,
  totalBytes,
  readmePath,
  readmeText = "",
  licensePath,
  diagnostics = [],
}: {
  repo: string;
  commit: string;
  scannedAt: string;
  files: string[];
  totalBytes: number;
  readmePath?: string;
  readmeText?: string;
  licensePath?: string;
  diagnostics?: string[];
}): CodingRepoStructure {
  const topLevelDirs = Array.from(
    new Set(
      files
        .filter((file) => file.includes("/"))
        .map((file) => file.split("/")[0])
        .filter(Boolean),
    ),
  )
    .sort()
    .slice(0, 24);
  const manifestFiles = files
    .filter((file) =>
      /(^|\/)(package\.json|pyproject\.toml|Cargo\.toml|go\.mod|pnpm-workspace\.yaml|turbo\.json|next\.config|tsconfig\.json)$/i.test(
        file,
      ),
    )
    .slice(0, 24);
  return {
    repo,
    commit,
    scannedAt,
    fileCount: files.length,
    totalBytes,
    topLevelDirs,
    manifestFiles,
    readmePath,
    licensePath,
    primaryLanguages: topLanguage(files).slice(0, 5),
    architectureHints: architectureHintsFor(files, readmeText).slice(0, 8),
    diagnostics,
  };
}

export function codingRepoStructureToCandidate(
  structure: CodingRepoStructure,
): NetworkSignalCandidate | undefined {
  const language = structure.primaryLanguages[0];
  return createNetworkSignalCandidate({
    source: { ...codingRepoSource, repo: structure.repo },
    title: `${structure.repo} architecture scan`,
    href: `https://github.com/${structure.repo}/tree/${structure.commit}`,
    summary: [
      `Read-only shallow scan of ${structure.repo} at ${structure.commit}.`,
      `Files: ${structure.fileCount}; manifests: ${structure.manifestFiles.join(", ") || "none"}.`,
      `Top-level dirs: ${structure.topLevelDirs.join(", ") || "none"}.`,
      `Architecture hints: ${structure.architectureHints.join(", ")}.`,
      "No repository code was executed, dependencies were not installed, and tests were not run.",
    ].join(" "),
    repo: structure.repo,
    language,
    candidateKind: "repo_architecture_signal",
    tags: [
      "repo-architecture",
      ...structure.primaryLanguages.map((item) => item.toLowerCase()),
      ...structure.architectureHints.map((item) => item.replace(/\s+/g, "-")),
    ],
    sourceKind: "repo_scan",
  });
}

export function generateCodingRepoScanReport(result: CodingRepoScanResult) {
  const structure = result.structure;
  const candidateLines = result.candidates.length
    ? result.candidates
        .map((candidate) => `- ${candidate.qualityScore}/100 ${candidate.title}`)
        .join("\n")
    : "- No repo candidates generated.";
  return [
    `# Coding Repo Scan: ${structure.repo}`,
    "",
    "## Boundary",
    "This is a read-only shallow repository scan. It does not execute repository code, install dependencies, run tests, open PRs, or write canonical Crystal Pool state.",
    "",
    "## Structure",
    `- commit: ${structure.commit}`,
    `- files: ${structure.fileCount}`,
    `- totalBytes: ${structure.totalBytes}`,
    `- readme: ${structure.readmePath ?? "none"}`,
    `- license: ${structure.licensePath ?? "none"}`,
    `- languages: ${structure.primaryLanguages.join(", ") || "unknown"}`,
    `- manifests: ${structure.manifestFiles.join(", ") || "none"}`,
    `- hints: ${structure.architectureHints.join(", ")}`,
    "",
    "## Candidates",
    candidateLines,
    structure.diagnostics.length ? "\n## Diagnostics" : "",
    ...structure.diagnostics.map((diagnostic) => `- ${diagnostic}`),
  ]
    .filter(Boolean)
    .join("\n");
}
