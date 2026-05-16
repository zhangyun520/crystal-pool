import { getLatestEcosystemRunSummary } from "../src/server/ecosystemDaemon";
import { prisma } from "../src/server/db";

async function main() {
  const latest = await getLatestEcosystemRunSummary();
  if (!latest?.reportMarkdown) {
    console.log("No ecosystem autonomy report found. Run npm run ecosystem:once first.");
    return;
  }
  console.log(latest.reportMarkdown);
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
