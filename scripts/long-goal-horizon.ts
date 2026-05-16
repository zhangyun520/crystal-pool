import { runLongGoalHorizon } from "../src/server/longGoalHorizon";

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
  const maxSandboxRuns = numberArg("--max-runs", 4);

  const result = await runLongGoalHorizon({
    writeJiEvents: !dryRun,
    createSandboxes,
    maxSandboxRuns,
  });

  console.log("Crystal Pool long-goal horizon");
  console.log(`- runId: ${result.runId}`);
  console.log(`- status: ${result.manifest.status}`);
  console.log(`- proposals: ${result.manifest.proposals}`);
  console.log(`- near: ${result.manifest.near}`);
  console.log(`- next: ${result.manifest.next}`);
  console.log(`- watch: ${result.manifest.watch}`);
  console.log(`- JiEvents written: ${result.manifest.jiEventsWritten}`);
  console.log(`- sandbox runs created: ${result.manifest.sandboxRunsCreated}`);
  console.log(`- report: ${result.runDir}/report.md`);
  console.log("- boundary: observe + propose only; no canonical promotion");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
