import { runEcosystemAutonomyCycle } from "../src/server/ecosystemDaemon";
import { prisma } from "../src/server/db";

type WatchConfig = {
  intervalMs: number;
  maxCycles: number;
};

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

function parseConfig(args: string[]): WatchConfig {
  return {
    intervalMs: parsePositiveInt(getArgValue(args, "--interval-ms"), 60_000),
    maxCycles: parsePositiveInt(getArgValue(args, "--max-cycles"), 10_000),
  };
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const config = parseConfig(process.argv.slice(2));
  console.log(
    `[ecosystem:watch] intervalMs=${config.intervalMs} maxCycles=${config.maxCycles}`,
  );
  for (let cycle = 1; cycle <= config.maxCycles; cycle += 1) {
    const result = await runEcosystemAutonomyCycle();
    console.log(
      `[ecosystem:watch] cycle=${cycle} run=${result.runId} observations=${result.observations.length} proposals=${result.proposals.length}`,
    );
    if (cycle < config.maxCycles) await sleep(config.intervalMs);
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
