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

async function main() {
  const args = process.argv.slice(2);
  const result = await runNetworkCrystallizationCycle({
    domain: "CODING_AUTOMATION",
    maxItems: parsePositiveInt(getArgValue(args, "--max-items"), 8),
    minQuality: parsePositiveInt(getArgValue(args, "--min-quality"), 72),
    query: getArgValue(args, "--query"),
    timeoutMs: parsePositiveInt(getArgValue(args, "--timeout-ms"), 15_000),
    repoScanLimit: parsePositiveInt(getArgValue(args, "--repo-scan-limit"), 4),
    maxSandboxRuns: parsePositiveInt(
      getArgValue(args, "--max-runs") ?? getArgValue(args, "--max-sandbox-runs"),
      4,
    ),
    skipRepoScan: args.includes("--skip-repo-scan"),
    writeJiEvents: args.includes("--write-ji-events"),
    autoSandbox: true,
    ignoreKnownEventIds: true,
  });

  console.log("Coding sandbox crystallization");
  console.log(`- runId: ${result.runId}`);
  console.log(`- candidates: ${result.candidates.length}`);
  console.log(`- repoScans: ${result.manifest.repoScans}`);
  console.log(`- sandboxRunsCreated: ${result.manifest.sandboxRunsCreated}`);
  result.sandboxRunIds.forEach((id) => console.log(`  - ${id}`));
  console.log("- boundary: sandbox completed runs only; no canonical promotion");
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
