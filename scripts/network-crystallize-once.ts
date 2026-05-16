import { runNetworkCrystallizationCycle } from "../src/server/networkCrystallization";
import { prisma } from "../src/server/db";

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

function parseSources(value: string | undefined) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function main() {
  const args = process.argv.slice(2);
  const result = await runNetworkCrystallizationCycle({
    domain: getArgValue(args, "--domain"),
    maxItems: parsePositiveInt(getArgValue(args, "--max-items"), 8),
    minQuality: parsePositiveInt(getArgValue(args, "--min-quality"), 72),
    query: getArgValue(args, "--query"),
    sourceIds: parseSources(getArgValue(args, "--source")),
    timeoutMs: parsePositiveInt(getArgValue(args, "--timeout-ms"), 15_000),
    writeJiEvents: !args.includes("--dry-run"),
    autoSandbox: args.includes("--no-auto-sandbox") ? false : undefined,
    maxSandboxRuns: parsePositiveInt(
      getArgValue(args, "--max-sandbox-runs") ?? getArgValue(args, "--max-runs"),
      4,
    ),
    repoScanLimit: parsePositiveInt(getArgValue(args, "--repo-scan-limit"), 4),
    skipRepoScan: args.includes("--skip-repo-scan"),
    ignoreKnownEventIds: args.includes("--include-known"),
  });

  console.log("Network crystallization skill");
  console.log(`- domain: ${result.manifest.domain}`);
  console.log(`- runId: ${result.runId}`);
  console.log(`- runDir: ${result.runDir}`);
  console.log(`- candidates: ${result.candidates.length}`);
  console.log(`- chained: ${result.chain.length}`);
  console.log(`- jiEventsWritten: ${result.manifest.jiEventsWritten}`);
  console.log(`- repoScans: ${result.manifest.repoScans}`);
  console.log(`- sandboxRunsCreated: ${result.manifest.sandboxRunsCreated}`);
  console.log(`- reviewProposals: ${result.manifest.reviewProposals}`);
  console.log(`- previousHash: ${result.manifest.previousHash ?? "genesis"}`);
  console.log(`- latestHash: ${result.manifest.latestHash ?? "none"}`);
  console.log(`- report: ${result.runDir}/report.md`);
  if (result.errors.length > 0) {
    console.log(`- sourceErrors: ${result.errors.length}`);
    result.errors.slice(0, 4).forEach((error) => console.log(`  - ${error}`));
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
