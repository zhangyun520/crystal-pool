import {
  exportPendingMarketAnchor,
  writeMarketSnapshot,
} from "../src/server/market";
import { anchorProviders, type AnchorProvider } from "../src/lib/market";
import { prisma } from "../src/server/db";

function getArgValue(args: string[], name: string) {
  const exactIndex = args.indexOf(name);
  if (exactIndex >= 0) return args[exactIndex + 1];
  const prefix = `${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function parseProvider(args: string[]): AnchorProvider {
  const provider = getArgValue(args, "--provider") ?? "local";
  if (!anchorProviders.includes(provider as AnchorProvider)) {
    throw new Error(
      `Unsupported provider "${provider}". Use local, ipfs, or arweave.`,
    );
  }
  return provider as AnchorProvider;
}

async function main() {
  const provider = parseProvider(process.argv.slice(2));
  const anchor = await exportPendingMarketAnchor({ provider });
  await writeMarketSnapshot();

  if (anchor.created) {
    console.log("Meaning market anchor bundle exported");
    console.log(`- provider: ${provider}`);
    console.log(`- anchor: ${anchor.id}`);
    console.log(`- events: ${anchor.eventCount}`);
    console.log(`- digest: ${anchor.bundleHash}`);
    console.log(`- bundle: ${anchor.bundlePath}`);
    console.log("- upload: not performed; manual handoff only");
    console.log(`- handoff: ${anchor.handoff}`);
  } else {
    console.log(`No pending contribution events for ${provider} anchor.`);
    console.log(`- handoff: ${anchor.handoff}`);
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
