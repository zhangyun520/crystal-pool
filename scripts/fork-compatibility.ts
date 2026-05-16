import { prisma } from "../src/server/db";
import { runForkCompatibilityCheck } from "../src/server/forkCompatibility";

function getArgValue(args: string[], name: string) {
  const exactIndex = args.indexOf(name);
  if (exactIndex >= 0) return args[exactIndex + 1];
  const prefix = `${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const args = process.argv.slice(2);
  const result = await runForkCompatibilityCheck({
    runId: getArgValue(args, "--run-id"),
  });

  console.log("Crystal Pool fork compatibility check");
  console.log(`- runId: ${result.runId}`);
  console.log(`- runDir: ${result.runDir}`);
  console.log(`- status: ${result.manifest.status}`);
  console.log(`- compatibilityBadge: ${result.manifest.compatibilityBadge}`);
  console.log(`- pass: ${result.manifest.pass}`);
  console.log(`- warn: ${result.manifest.warn}`);
  console.log(`- fail: ${result.manifest.fail}`);
  console.log("- criteria:");
  result.result.criteria.forEach((criterion) => {
    console.log(
      `  - ${criterion.status} ${criterion.id} [${criterion.category}] ${criterion.title}`,
    );
  });
  console.log(`- report: ${result.runDir}/report.md`);
  console.log("- boundary: compatibility evidence only; no canonical promotion");
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
