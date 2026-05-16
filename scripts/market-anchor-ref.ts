import { anchorProviders, type AnchorProvider } from "../src/lib/market";
import { prisma } from "../src/server/db";
import { recordManualAnchorExternalReference } from "../src/server/market";

function getArgValue(args: string[], name: string) {
  const exactIndex = args.indexOf(name);
  if (exactIndex >= 0) return args[exactIndex + 1];
  const prefix = `${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function parseProvider(value?: string): AnchorProvider {
  const provider = value ?? "local";
  if (!anchorProviders.includes(provider as AnchorProvider)) {
    throw new Error(
      `Unsupported provider "${provider}". Use local, ipfs, or arweave.`,
    );
  }
  return provider as AnchorProvider;
}

async function main() {
  const args = process.argv.slice(2);
  const anchorId = getArgValue(args, "--anchor-id");
  const externalRef = getArgValue(args, "--ref");
  if (!anchorId || !externalRef) {
    throw new Error(
      "Usage: npm run market:anchor-ref -- --anchor-id <id> --provider ipfs --ref <cid-or-tx-id>",
    );
  }
  const reference = await recordManualAnchorExternalReference({
    anchorId,
    externalProvider: parseProvider(getArgValue(args, "--provider")),
    externalRef,
    note: getArgValue(args, "--note"),
  });

  console.log("Manual anchor reference recorded");
  console.log(`- anchor: ${reference.anchorId}`);
  console.log(`- provider: ${reference.externalProvider}`);
  console.log(`- ref: ${reference.externalRef}`);
  console.log(`- upload: not performed by Crystal Pool`);
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
