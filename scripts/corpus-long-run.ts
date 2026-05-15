import {
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {
  buildCorpusTrailBundle,
  type CorpusTrailBundle,
} from "../src/lib/corpusTrail";
import {
  buildCorpusRunReport,
  corpusRunArtifactNames,
  createCorpusRunManifest,
  planCorpusRun,
  summarizeCorpusRun,
  type CorpusRunFile,
} from "../src/lib/corpusRun";
import {
  createWorkerResult,
  parseJsonl,
  serializeJsonl,
  type CrystalWorkerInput,
  type CrystalWorkerResult,
  type WorkerTarget,
} from "../src/lib/jobManifest";

type LongRunConfig = {
  inboxDir: string;
  runsDir: string;
  processedDir: string;
  maxFiles: number;
  maxCycles: number;
  intervalMs: number;
  watch: boolean;
  keepInput: boolean;
  workerTarget: WorkerTarget;
};

const rootDir = process.cwd();

function getArgValue(args: string[], name: string) {
  const exactIndex = args.indexOf(name);
  if (exactIndex >= 0) return args[exactIndex + 1];
  const prefix = `${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseConfig(args: string[]): LongRunConfig {
  const watch = args.includes("--watch");
  return {
    inboxDir: path.resolve(
      rootDir,
      getArgValue(args, "--inbox") ?? "data/corpus/inbox",
    ),
    runsDir: path.resolve(
      rootDir,
      getArgValue(args, "--runs") ?? "data/corpus/runs",
    ),
    processedDir: path.resolve(
      rootDir,
      getArgValue(args, "--processed") ?? "data/corpus/processed",
    ),
    maxFiles: parsePositiveInt(getArgValue(args, "--max-files"), 25),
    maxCycles: parsePositiveInt(
      getArgValue(args, "--max-cycles"),
      watch ? 10_000 : 1,
    ),
    intervalMs: parsePositiveInt(getArgValue(args, "--interval-ms"), 60_000),
    watch,
    keepInput: args.includes("--keep-input"),
    workerTarget:
      (getArgValue(args, "--worker-target") as WorkerTarget | undefined) ??
      "local",
  };
}

async function ensureDirs(config: LongRunConfig) {
  await Promise.all([
    mkdir(config.inboxDir, { recursive: true }),
    mkdir(config.runsDir, { recursive: true }),
    mkdir(config.processedDir, { recursive: true }),
  ]);
}

async function listInboxFiles(inboxDir: string): Promise<CorpusRunFile[]> {
  const names = await readdir(inboxDir);
  const files = await Promise.all(
    names
      .filter((name) => name.endsWith(".jsonl"))
      .map(async (name) => {
        const filePath = path.join(inboxDir, name);
        const info = await stat(filePath);
        const text = await readFile(filePath, "utf8");
        const itemCount = parseJsonl<CrystalWorkerInput>(text).length;
        return {
          path: filePath,
          name,
          byteEstimate: info.size,
          itemCount,
        } satisfies CorpusRunFile;
      }),
  );
  return files;
}

async function readWorkerInputs(files: CorpusRunFile[]) {
  const batches = await Promise.all(
    files.map(async (file) => ({
      inputs: parseJsonl<CrystalWorkerInput>(
        await readFile(file.path, "utf8"),
      ),
    })),
  );
  return batches.flatMap((batch) => batch.inputs);
}

async function writeRunArtifacts({
  runDir,
  manifest,
  results,
  trailBundle,
  report,
}: {
  runDir: string;
  manifest: unknown;
  results: CrystalWorkerResult[];
  trailBundle: CorpusTrailBundle;
  report: string;
}) {
  await mkdir(runDir, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(runDir, corpusRunArtifactNames.manifest),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(runDir, corpusRunArtifactNames.workerResults),
      `${serializeJsonl(results)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(runDir, corpusRunArtifactNames.trailBundle),
      `${JSON.stringify(trailBundle, null, 2)}\n`,
      "utf8",
    ),
    writeFile(path.join(runDir, corpusRunArtifactNames.report), report, "utf8"),
  ]);
}

async function moveProcessedFiles({
  files,
  processedDir,
  runId,
}: {
  files: CorpusRunFile[];
  processedDir: string;
  runId: string;
}) {
  const targetDir = path.join(processedDir, runId);
  await mkdir(targetDir, { recursive: true });
  await Promise.all(
    files.map((file) => rename(file.path, path.join(targetDir, file.name))),
  );
}

async function runOnce(config: LongRunConfig) {
  await ensureDirs(config);
  const files = await listInboxFiles(config.inboxDir);
  const plan = planCorpusRun({ files, maxFiles: config.maxFiles });

  if (plan.selectedFiles.length === 0) {
    console.log(
      `No corpus inbox JSONL files found in ${path.relative(rootDir, config.inboxDir)}.`,
    );
    return false;
  }

  const workerInputs = await readWorkerInputs(plan.selectedFiles);
  const results = workerInputs.map((input) => createWorkerResult(input));
  const manifest = createCorpusRunManifest({
    plan,
    workerTarget: config.workerTarget,
  });
  const trailBundle = buildCorpusTrailBundle(
    results.map((result) => ({
      snapshot: result.snapshot,
      marks: result.marks,
    })),
  );
  const summary = summarizeCorpusRun({ plan, results });
  const report = buildCorpusRunReport({ summary, manifest, results });
  const runDir = path.join(config.runsDir, plan.runId);

  await writeRunArtifacts({
    runDir,
    manifest,
    results,
    trailBundle,
    report,
  });

  if (!config.keepInput) {
    await moveProcessedFiles({
      files: plan.selectedFiles,
      processedDir: config.processedDir,
      runId: plan.runId,
    });
  }

  console.log(
    [
      `Corpus run ${plan.runId} complete.`,
      `Run dir: ${path.relative(rootDir, runDir)}`,
      `Files: ${summary.inputFiles}`,
      `Items: ${summary.inputItems}`,
      `Marks: ${summary.marks}`,
      `Trajectory events: ${summary.trajectoryEvents}`,
      `Warnings: ${summary.warnings}`,
    ].join("\n"),
  );
  return true;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  const config = parseConfig(process.argv.slice(2));

  for (let cycle = 1; cycle <= config.maxCycles; cycle += 1) {
    await runOnce(config);
    if (!config.watch || cycle >= config.maxCycles) break;
    await sleep(config.intervalMs);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
