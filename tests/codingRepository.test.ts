import { describe, expect, it } from "vitest";
import {
  buildCodingRepoStructure,
  codingRepoStructureToCandidate,
  generateCodingRepoScanReport,
  isCodingRepositoryAllowed,
  languageFromPath,
} from "@/lib/codingRepository";

describe("coding repository intelligence", () => {
  it("keeps repo scans on an explicit allowlist", () => {
    expect(isCodingRepositoryAllowed("openai/codex")).toBe(true);
    expect(isCodingRepositoryAllowed("Aider-AI/aider")).toBe(true);
    expect(isCodingRepositoryAllowed("unknown/exec-me")).toBe(false);
  });

  it("detects languages, manifests, and architecture hints from file trees", () => {
    const structure = buildCodingRepoStructure({
      repo: "openai/codex",
      commit: "abc123",
      scannedAt: "2026-05-16T00:00:00.000Z",
      files: [
        "README.md",
        "package.json",
        "packages/agent/src/runtime.ts",
        "packages/agent/src/sandbox.ts",
        ".github/workflows/ci.yml",
        "tests/agent.spec.ts",
      ],
      totalBytes: 1000,
      readmePath: "README.md",
      readmeText:
        "Agent runtime with sandbox approvals, modular package layout, and tool protocol integration.",
      licensePath: "LICENSE",
    });

    expect(languageFromPath("src/index.ts")).toBe("TypeScript");
    expect(structure.primaryLanguages).toContain("TypeScript");
    expect(structure.manifestFiles).toContain("package.json");
    expect(structure.architectureHints).toContain("agent orchestration");
    expect(structure.architectureHints).toContain("permission and sandbox boundary");
  });

  it("converts repo structures into coding JiEvent candidates", () => {
    const structure = buildCodingRepoStructure({
      repo: "openai/codex",
      commit: "abc123",
      scannedAt: "2026-05-16T00:00:00.000Z",
      files: ["README.md", "package.json", "src/index.ts", "tests/index.test.ts"],
      totalBytes: 1200,
      readmeText: "Agent architecture with review and sandbox boundaries.",
    });
    const candidate = codingRepoStructureToCandidate(structure);

    expect(candidate).toMatchObject({
      sourceKind: "repo_scan",
      domain: "CODING_AUTOMATION",
      candidateKind: "repo_architecture_signal",
      repo: "openai/codex",
    });
    expect(candidate?.summary).toContain("No repository code was executed");
  });

  it("documents the read-only boundary in repo scan reports", () => {
    const structure = buildCodingRepoStructure({
      repo: "Aider-AI/aider",
      commit: "def456",
      scannedAt: "2026-05-16T00:00:00.000Z",
      files: ["README.md", "pyproject.toml", "aider/main.py"],
      totalBytes: 900,
      readmeText: "Pair programming agent with git-aware editing.",
    });
    const candidate = codingRepoStructureToCandidate(structure);
    const report = generateCodingRepoScanReport({
      structure,
      candidates: candidate ? [candidate] : [],
      reportMarkdown: "",
    });

    expect(report).toContain("read-only shallow repository scan");
    expect(report).toContain("does not execute repository code");
    expect(report).toContain("Aider-AI/aider");
  });
});
