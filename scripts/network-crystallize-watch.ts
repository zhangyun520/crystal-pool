import { runNetworkCrystallizationCycle } from "../src/server/networkCrystallization";
import { prisma } from "../src/server/db";

type WatchConfig = {
  intervalMs: number;
  maxCycles: number;
  maxItems: number;
  minQuality: number;
  query?: string;
  sourceIds?: string[];
  timeoutMs: number;
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

function parseSources(value: string | undefined) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseConfig(args: string[]): WatchConfig {
  return {
    intervalMs: parsePositiveInt(getArgValue(args, "--interval-ms"), 3_600_000),
    maxCycles: parsePositiveInt(getArgValue(args, "--max-cycles"), 10_000),
    maxItems: parsePositiveInt(getArgValue(args, "--max-items"), 8),
    minQuality: parsePositiveInt(getArgValue(args, "--min-quality"), 72),
    query: getArgValue(args, "--query"),
    sourceIds: parseSources(getArgValue(args, "--source")),
    timeoutMs: parsePositiveInt(getArgValue(args, "--timeout-ms"), 15_000),
  };
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const config = parseConfig(process.argv.slice(2));
  console.log(
    `[network:crystallize:watch] intervalMs=${config.intervalMs} maxCycles=${config.maxCycles}`,
  );

  for (let cycle = 1; cycle <= config.maxCycles; cycle += 1) {
    const result = await runNetworkCrystallizationCycle(config);
    console.log(
      `[network:crystallize:watch] cycle=${cycle} run=${result.runId} candidates=${result.candidates.length} chained=${result.chain.length} jiEvents=${result.manifest.jiEventsWritten} latestHash=${result.manifest.latestHash ?? "none"}`,
    );
    if (result.errors.length > 0) {
      console.log(
        `[network:crystallize:watch] cycle=${cycle} sourceErrors=${result.errors.length}`,
      );
    }
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
