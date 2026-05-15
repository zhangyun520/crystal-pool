import { runEcosystemAutonomyCycle } from "../src/server/ecosystemDaemon";
import { prisma } from "../src/server/db";

async function main() {
  const result = await runEcosystemAutonomyCycle();
  console.log("Ecosystem autonomy cycle");
  console.log(`- runId: ${result.runId}`);
  console.log(`- runDir: ${result.runDir}`);
  console.log(`- observations: ${result.observations.length}`);
  console.log(`- proposals: ${result.proposals.length}`);
  console.log(`- canonicalMutationAllowed: ${result.manifest.canonicalMutationAllowed}`);
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
