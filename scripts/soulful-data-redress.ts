import { runSoulfulDataRedressPackets } from "../src/server/soulfulDataRedress";

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function numberArg(name: string, fallback: number) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const createSandboxes = hasFlag("--create-sandboxes");
  const maxPackets = numberArg("--max-packets", 8);
  const maxSandboxRuns = numberArg("--max-runs", 4);

  const result = await runSoulfulDataRedressPackets({
    writeJiEvents: !dryRun,
    createSandboxes,
    maxPackets,
    maxSandboxRuns,
  });

  console.log("Crystal Pool soulful-data redress packets");
  console.log(`- runId: ${result.runId}`);
  console.log(`- packets: ${result.manifest.packets}`);
  console.log(`- draft: ${result.manifest.draft}`);
  console.log(`- readyForReview: ${result.manifest.readyForReview}`);
  console.log(`- JiEvents written: ${result.manifest.jiEventsWritten}`);
  console.log(`- sandbox runs created: ${result.manifest.sandboxRunsCreated}`);
  console.log(`- report: ${result.runDir}/report.md`);
  console.log("- boundary: redress guidance only; no canonical promotion");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
