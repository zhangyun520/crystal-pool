import { prisma } from "../src/server/db";
import { runWorldlineCoverageMatrix } from "../src/server/worldlineCoverage";

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
  const result = await runWorldlineCoverageMatrix({
    runId: getArgValue(args, "--run-id"),
    createMissing: args.includes("--create-missing"),
    maxCreate: parsePositiveInt(
      getArgValue(args, "--max-create") ?? getArgValue(args, "--max-runs"),
      Number.POSITIVE_INFINITY,
    ),
  });

  console.log("Crystal Pool worldline coverage matrix");
  console.log(`- runId: ${result.runId}`);
  console.log(`- runDir: ${result.runDir}`);
  console.log(`- status: ${result.manifest.status}`);
  console.log(`- coverage: ${result.manifest.coveragePercent}%`);
  console.log(`- coveredCells: ${result.manifest.coveredCells}`);
  console.log(`- missingCells: ${result.manifest.missingCells}`);
  console.log(`- sandboxRunsCreated: ${result.manifest.sandboxRunsCreated}`);
  console.log("- missing:");
  result.matrix.missing.slice(0, 12).forEach((cell) => {
    console.log(`  - ${cell.worldlineKey} + ${cell.mode}`);
  });
  if (result.matrix.missing.length === 0) {
    console.log("  - none");
  }
  console.log(`- report: ${result.runDir}/report.md`);
  console.log("- boundary: sandbox coverage only; no canonical promotion");
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
