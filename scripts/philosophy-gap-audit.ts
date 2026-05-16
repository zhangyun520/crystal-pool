import { prisma } from "../src/server/db";
import { runPhilosophyAestheticsGoalAudit } from "../src/server/philosophyAestheticsGoal";

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
  const result = await runPhilosophyAestheticsGoalAudit({
    runId: getArgValue(args, "--run-id"),
    writeJiEvents: !args.includes("--dry-run"),
    createSandboxes: args.includes("--create-sandboxes"),
    maxSandboxRuns: parsePositiveInt(
      getArgValue(args, "--max-sandbox-runs") ?? getArgValue(args, "--max-runs"),
      4,
    ),
  });

  console.log("Crystal Pool philosophy/aesthetics goal audit");
  console.log(`- runId: ${result.runId}`);
  console.log(`- runDir: ${result.runDir}`);
  console.log(`- coverageScore: ${result.audit.coverageScore}/100`);
  console.log(`- covered: ${result.audit.covered}`);
  console.log(`- partial: ${result.audit.partial}`);
  console.log(`- gaps: ${result.audit.gaps}`);
  console.log(`- criticalOpen: ${result.audit.criticalOpen}`);
  console.log(`- jiEventsWritten: ${result.manifest.jiEventsWritten}`);
  console.log(`- sandboxRunsCreated: ${result.manifest.sandboxRunsCreated}`);
  console.log("- openItems:");
  result.audit.topItems.forEach((item) => {
    console.log(
      `  - ${item.status} ${item.id} [${item.proposalKind}] ${item.title}`,
    );
  });
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
