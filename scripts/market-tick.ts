import { exportPendingMarketAnchor, writeMarketSnapshot } from "../src/server/market";
import { prisma } from "../src/server/db";

async function main() {
  const snapshot = await writeMarketSnapshot();
  const anchor = await exportPendingMarketAnchor({ provider: "local" });

  console.log("Meaning market tick");
  console.log(`- snapshot: ${snapshot.path}`);
  console.log(
    `- signal=${snapshot.overview.depth.signalPrice} buy=${snapshot.overview.depth.buyPressure} challenge=${snapshot.overview.depth.challengePressure}`,
  );
  if (anchor.created) {
    console.log(
      `- anchor: ${anchor.id} events=${anchor.eventCount} hash=${anchor.bundleHash}`,
    );
    console.log(`- bundle: ${anchor.bundlePath}`);
    console.log("- upload: not performed; manual handoff only");
  } else {
    console.log(`- anchor skipped: ${anchor.message}`);
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
