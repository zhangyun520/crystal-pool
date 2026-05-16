import { execFile } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  buildCodingRepoStructure,
  codingRepoStructureToCandidate,
  codingRepositoryAllowlist,
  generateCodingRepoScanReport,
  isCodingRepositoryAllowed,
  normalizeRepositoryName,
  type CodingRepoScanResult,
  type CodingRepoStructure,
} from "@/lib/codingRepository";
import { type NetworkSignalCandidate } from "@/lib/networkCrystallization";

const execFileAsync = promisify(execFile);
const ecosystemDir = path.join(process.cwd(), "data", "ecosystem");
const repoCacheDir = path.join(ecosystemDir, "repo-cache");
const repoScansDir = path.join(ecosystemDir, "repo-scans");

function repoParts(repo: string) {
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error(`Invalid GitHub repository "${repo}".`);
  return { owner, name };
}

function repoCachePath(repo: string) {
  const { owner, name } = repoParts(repo);
  return path.normalize(`${repoCacheDir}/${owner}/${name}`);
}

function repoScanPath(repo: string, commit: string) {
  const { owner, name } = repoParts(repo);
  return path.normalize(`${repoScansDir}/${owner}/${name}/${commit.slice(0, 12)}`);
}

async function git(args: string[], cwd = process.cwd()) {
  const { stdout } = await execFileAsync("git", args, {
    cwd,
    env: {
      ...process.env,
      GIT_ASKPASS: "true",
      GIT_TERMINAL_PROMPT: "0",
    },
    maxBuffer: 1024 * 1024 * 12,
    timeout: 30_000,
  });
  return stdout.trim();
}

async function pathExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureShallowClone(repo: string) {
  const dir = repoCachePath(repo);
  await mkdir(path.dirname(dir), { recursive: true });
  if (await pathExists(path.join(dir, ".git"))) {
    await git(["fetch", "--depth", "1", "origin", "HEAD"], dir);
    await git(["checkout", "--detach", "FETCH_HEAD"], dir);
  } else {
    await git([
      "clone",
      "--depth",
      "1",
      "--filter=blob:none",
      `https://github.com/${repo}.git`,
      dir,
    ]);
  }
  return dir;
}

async function listRepoFiles(dir: string) {
  const output = await git(["ls-files"], dir);
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

async function repoCommit(dir: string) {
  return git(["rev-parse", "HEAD"], dir);
}

async function fileSize(root: string, file: string) {
  try {
    return (await stat(path.join(root, file))).size;
  } catch {
    return 0;
  }
}

async function repoTrackedSize(root: string, files: string[]) {
  const sizes = await Promise.all(files.slice(0, 6_000).map((file) => fileSize(root, file)));
  return sizes.reduce((sum, size) => sum + size, 0);
}

async function readFirstExisting(root: string, candidates: string[]) {
  for (const candidate of candidates) {
    try {
      return {
        path: candidate,
        text: (await readFile(path.join(root, candidate), "utf8")).slice(0, 12_000),
      };
    } catch {
      // keep looking for the next conventional metadata file
    }
  }
  return undefined;
}

function jsonl(items: unknown[]) {
  return items.map((item) => JSON.stringify(item)).join("\n") + (items.length ? "\n" : "");
}

export async function scanCodingRepository({
  repo,
  maxRepoBytes = 80 * 1024 * 1024,
}: {
  repo: string;
  maxRepoBytes?: number;
}): Promise<CodingRepoScanResult> {
  const normalized = normalizeRepositoryName(repo);
  if (!isCodingRepositoryAllowed(normalized)) {
    throw new Error(
      `Repository ${normalized} is not allowlisted for coding intelligence scans.`,
    );
  }

  const root = await ensureShallowClone(normalized);
  const [commit, files] = await Promise.all([repoCommit(root), listRepoFiles(root)]);
  const totalBytes = await repoTrackedSize(root, files);
  const readme = await readFirstExisting(root, [
    "README.md",
    "README.mdx",
    "readme.md",
    "docs/README.md",
  ]);
  const license = await readFirstExisting(root, [
    "LICENSE",
    "LICENSE.md",
    "COPYING",
    "NOTICE",
  ]);
  const diagnostics: string[] = [];
  if (totalBytes > maxRepoBytes) {
    diagnostics.push(
      `Repo tracked file size ${totalBytes} exceeds max ${maxRepoBytes}; candidates skipped.`,
    );
  }

  const structure: CodingRepoStructure = buildCodingRepoStructure({
    repo: normalized,
    commit,
    scannedAt: new Date().toISOString(),
    files,
    totalBytes,
    readmePath: readme?.path,
    readmeText: readme?.text,
    licensePath: license?.path,
    diagnostics,
  });
  if (totalBytes > maxRepoBytes) structure.skipped = true;
  const candidates: NetworkSignalCandidate[] = structure.skipped
    ? []
    : [codingRepoStructureToCandidate(structure)].filter(
        (candidate): candidate is NetworkSignalCandidate => Boolean(candidate),
      );
  const reportMarkdown = generateCodingRepoScanReport({
    structure,
    candidates,
    reportMarkdown: "",
  });
  const runDir = repoScanPath(normalized, commit);
  await mkdir(runDir, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(runDir, "repo-structure.json"),
      `${JSON.stringify(structure, null, 2)}\n`,
    ),
    writeFile(path.join(runDir, "repo-signals.jsonl"), jsonl(candidates)),
    writeFile(path.join(runDir, "report.md"), reportMarkdown),
  ]);

  return { structure, candidates, reportMarkdown };
}

export async function scanCodingRepositories({
  repos = [...codingRepositoryAllowlist],
  maxRepos = 4,
  maxRepoBytes = 80 * 1024 * 1024,
}: {
  repos?: readonly string[];
  maxRepos?: number;
  maxRepoBytes?: number;
} = {}) {
  const selected = repos.map(normalizeRepositoryName).filter(isCodingRepositoryAllowed).slice(0, maxRepos);
  const results: CodingRepoScanResult[] = [];
  const errors: string[] = [];
  for (const repo of selected) {
    try {
      results.push(await scanCodingRepository({ repo, maxRepoBytes }));
    } catch (error) {
      errors.push(`${repo}: ${error instanceof Error ? error.message : "scan failed"}`);
    }
  }
  return {
    results,
    candidates: results.flatMap((result) => result.candidates),
    errors,
  };
}
