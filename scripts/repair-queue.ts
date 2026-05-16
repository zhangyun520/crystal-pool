import { prisma } from "../src/server/db";
import { runRepairQueue } from "../src/server/repairQueue";

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
  const result = await runRepairQueue({
    runId: getArgValue(args, "--run-id"),
    writeJiEvents: !args.includes("--dry-run"),
    createSandboxes: args.includes("--create-sandboxes"),
    maxSandboxRuns: parsePositiveInt(
      getArgValue(args, "--max-sandbox-runs") ?? getArgValue(args, "--max-runs"),
      4,
    ),
  });

  console.log("Crystal Pool hopepunk repair queue");
  console.log(`- runId: ${result.runId}`);
  console.log(`- runDir: ${result.runDir}`);
  console.log(`- status: ${result.manifest.status}`);
  console.log(`- items: ${result.manifest.items}`);
  console.log(`- critical: ${result.manifest.critical}`);
  console.log(`- important: ${result.manifest.important}`);
  console.log(`- watch: ${result.manifest.watch}`);
  console.log(`- jiEventsWritten: ${result.manifest.jiEventsWritten}`);
  console.log(`- sandboxRunsCreated: ${result.manifest.sandboxRunsCreated}`);
  console.log("- repairItems:");
  result.items.slice(0, 8).forEach((item) => {
    console.log(
      `  - ${item.severity} ${item.id} [${item.sourceKind}/${item.proposalKind}] ${item.title}`,
    );
  });
  if (result.items.length === 0) {
    console.log("  - none; repair readiness is active");
  }
  console.log(`- report: ${result.runDir}/report.md`);
  console.log("- boundary: observe + propose only; no canonical promotion");
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
