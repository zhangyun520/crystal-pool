import {
  exportPendingMarketAnchor,
  writeMarketSnapshot,
} from "../src/server/market";
import { anchorProviders, type AnchorProvider } from "../src/lib/market";
import { prisma } from "../src/server/db";

type WatchConfig = {
  intervalMs: number;
  maxCycles: number;
  provider: AnchorProvider;
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
  const provider = getArgValue(args, "--provider") ?? "local";
  if (!anchorProviders.includes(provider as AnchorProvider)) {
    throw new Error(
      `Unsupported provider "${provider}". Use local, ipfs, or arweave.`,
    );
  }
  return {
    intervalMs: parsePositiveInt(getArgValue(args, "--interval-ms"), 60_000),
    maxCycles: parsePositiveInt(getArgValue(args, "--max-cycles"), 10_000),
    provider: provider as AnchorProvider,
  };
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCycle(config: WatchConfig, cycle: number) {
  const snapshot = await writeMarketSnapshot();
  const anchor = await exportPendingMarketAnchor({ provider: config.provider });
  const anchorDetail = anchor.created
    ? `anchor=${anchor.id} events=${anchor.eventCount}`
    : "anchor=none";
  console.log(
    `[market:watch] cycle=${cycle} signal=${snapshot.overview.depth.signalPrice} orders=${snapshot.overview.totals.openOrders} ${anchorDetail}`,
  );
}

async function main() {
  const config = parseConfig(process.argv.slice(2));
  console.log(
    `[market:watch] provider=${config.provider} intervalMs=${config.intervalMs} maxCycles=${config.maxCycles}`,
  );
  for (let cycle = 1; cycle <= config.maxCycles; cycle += 1) {
    await runCycle(config, cycle);
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
