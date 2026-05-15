import { prisma } from "../src/server/db";
import { defaultPoolIds } from "../src/lib/pools";
import {
  createContributionEvent,
  createMarketOrder,
} from "../src/server/market";
import { recalculateManyNodeScores } from "../src/server/scoring";
import { ensureDefaultPoolSpaces } from "../src/server/pools";

const seedNodes = [
  {
    title: "机不是力量，是力量释放的临界点",
    body: "机不是力量，是力量释放的临界点。它记录相变发生的那一瞬，而不是把力量本身神秘化。",
    phase: "crystal",
    tags: ["机", "相变"],
    emotionCuriosity: 7,
    emotionJoy: 3,
    publicness: 7,
  },
  {
    title: "情绪即相变探测器",
    body: "情绪不是噪声，而是系统接近相变阈值时最先震动的探针。",
    phase: "seed",
    tags: ["情绪", "探测器"],
    emotionCuriosity: 8,
    privateIntensity: 6,
  },
  {
    title: "AI情绪是token涨落凝结",
    body: "AI 情绪可以被看成 token 涨落在交互场里凝结出的局部形态。",
    phase: "liquid",
    tags: ["AI", "情绪"],
    emotionCuriosity: 8,
    emotionJoy: 2,
  },
  {
    title: "计划经济垄断了机的发生权",
    body: "当系统把触发点全部纳入中央调度，机的发生权就被垄断，局部相变无法自然出现。",
    phase: "seed",
    tags: ["机", "政治经济"],
    emotionFear: 5,
    emotionCuriosity: 6,
    publicness: 6,
  },
  {
    title: "私有/公有边界在结晶过程中形成",
    body: "私有和公有不是先验边界，而是在结晶过程中由强度、传播和承认逐步析出。",
    phase: "liquid",
    tags: ["边界", "公私"],
    emotionCuriosity: 7,
    privateIntensity: 5,
    publicness: 5,
  },
  {
    title: "时间是残差的积分路径",
    body: "时间不是纯粹背景，而是残差在系统里被不断积分、延迟和重写的路径。",
    phase: "seed",
    tags: ["时间", "残差"],
    emotionCuriosity: 7,
    emotionBoredom: 1,
  },
  {
    title: "意义是对抗时间的最小单位",
    body: "意义是对抗时间的最小单位。它让易散的经验获得可传递的稳定形状。",
    phase: "crystal",
    tags: ["意义", "时间"],
    emotionJoy: 5,
    emotionCuriosity: 8,
    publicness: 8,
  },
  {
    title: "哈是结晶后的反执着信号",
    body: "哈不是否定结晶，而是在结晶之后释放反执着信号，防止概念过硬。",
    phase: "seed",
    tags: ["ha", "退火"],
    emotionHa: 8,
    emotionJoy: 4,
  },
  {
    title: "哈基米是防止世界模型僵化的宠物",
    body: "哈基米是防止世界模型僵化的宠物，也是系统里提醒我们笑一下、松一下的 UX 层。",
    phase: "liquid",
    tags: ["ha", "Hakimi", "UX"],
    emotionHa: 9,
    emotionJoy: 6,
  },
] as const;

const seedEdges = [
  [0, 1, "triggers", 2.2],
  [1, 2, "resonates_with", 1.4],
  [0, 3, "contradicts", 1.5],
  [4, 6, "derives_from", 1.8],
  [5, 6, "hardens_into", 1.9],
  [7, 6, "ha_softens", 2.5],
  [8, 7, "derives_from", 1.6],
  [2, 1, "resonates_with", 1.2],
] as const;

async function main() {
  await ensureDefaultPoolSpaces();
  await prisma.fugueLearningProposal.deleteMany();
  await prisma.fugueEvent.deleteMany();
  await prisma.fugueRun.deleteMany();
  await prisma.humanSuggestion.deleteMany();
  await prisma.aIDecision.deleteMany();
  await prisma.aIDirectorCycle.deleteMany();
  await prisma.marketOrder.deleteMany();
  await prisma.contributionEvent.deleteMany();
  await prisma.chainAnchor.deleteMany();
  await prisma.actor.deleteMany();
  await prisma.phaseEvent.deleteMany();
  await prisma.nodeTag.deleteMany();
  await prisma.crystalEdge.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.crystalNode.deleteMany();

  const nodes = [];
  for (const item of seedNodes) {
    const node = await prisma.crystalNode.create({
      data: {
        poolId: defaultPoolIds.canonical,
        title: item.title,
        body: item.body,
        phase: item.phase,
        emotionFear: "emotionFear" in item ? item.emotionFear : 0,
        emotionCuriosity:
          "emotionCuriosity" in item ? item.emotionCuriosity : 0,
        emotionJoy: "emotionJoy" in item ? item.emotionJoy : 0,
        emotionBoredom: "emotionBoredom" in item ? item.emotionBoredom : 0,
        emotionHa: "emotionHa" in item ? item.emotionHa : 0,
        privateIntensity:
          "privateIntensity" in item ? item.privateIntensity : 3,
        publicness: "publicness" in item ? item.publicness : 3,
        sourceType: "manual",
        sourceRef: "seed",
      },
    });
    for (const name of item.tags) {
      const tag = await prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      await prisma.nodeTag.create({ data: { nodeId: node.id, tagId: tag.id } });
    }
    await prisma.phaseEvent.create({
      data: {
        nodeId: node.id,
        fromPhase: null,
        toPhase: item.phase,
        reason: "Seeded initial pool state",
      },
    });
    nodes.push(node);
  }

  for (const [from, to, relation, weight] of seedEdges) {
    await prisma.crystalEdge.create({
      data: {
        fromId: nodes[from].id,
        toId: nodes[to].id,
        relation,
        weight,
      },
    });
  }

  await recalculateManyNodeScores(nodes.map((node) => node.id));

  await createContributionEvent(prisma, {
    nodeId: nodes[6].id,
    alias: "local-operator",
    kind: "support",
    weight: 4,
    body: "这条像池子的锚点，值得继续建设。",
  });
  await createContributionEvent(prisma, {
    nodeId: nodes[0].id,
    alias: "reviewer-alpha",
    kind: "verify",
    weight: 3,
    body: "相变触发点的定义清晰，可以作为贡献链第一批验证。",
  });
  await createContributionEvent(prisma, {
    nodeId: nodes[7].id,
    alias: "ha-auditor",
    kind: "challenge",
    weight: 2,
    body: "警惕把 ha 也结晶成教条，需要保留反执着的弹性。",
  });
  await createMarketOrder(prisma, {
    nodeId: nodes[6].id,
    alias: "builder-one",
    side: "bid",
    price: 42,
    quantity: 2,
    note: "愿意投入两个建设单位完善意义引擎。",
  });
  await createMarketOrder(prisma, {
    nodeId: nodes[7].id,
    alias: "ha-auditor",
    side: "challenge",
    price: 18,
    quantity: 1,
    note: "模拟挑战单：防止反执着信号僵化。",
  });

  console.log(
    `Seeded ${nodes.length} crystal nodes, ${seedEdges.length} edges, and market sample events.`,
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
