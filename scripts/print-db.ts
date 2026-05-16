import { prisma } from "../src/server/db";

async function main() {
  const nodes = await prisma.crystalNode.findMany({
    include: {
      tags: { include: { tag: true } },
      outgoingEdges: { include: { to: true } },
    },
    orderBy: { crystallizationScore: "desc" },
  });
  const [contributionCount, orderCount, anchorCount] = await Promise.all([
    prisma.contributionEvent.count(),
    prisma.marketOrder.count(),
    prisma.chainAnchor.count(),
  ]);

  console.log("Crystal Nodes");
  for (const node of nodes) {
    const tags = node.tags.map((item) => item.tag.name).join(", ") || "none";
    console.log(
      `- ${node.title} [${node.phase}] score=${node.crystallizationScore} tags=${tags}`,
    );
    for (const edge of node.outgoingEdges) {
      console.log(`  -> ${edge.relation} (${edge.weight}) ${edge.to.title}`);
    }
  }
  console.log(
    `Meaning Market: ${contributionCount} contribution events, ${orderCount} simulated orders, ${anchorCount} anchor bundles`,
  );
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
