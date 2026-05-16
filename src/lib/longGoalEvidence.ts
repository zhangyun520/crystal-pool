export type LongGoalEvidenceStatus = "pass" | "warn" | "fail";

export type LongGoalEvidenceItem = {
  id: string;
  title: string;
  status: LongGoalEvidenceStatus;
  proof: string;
  command: string;
  artifact?: string;
  boundary: string;
};

export type LongGoalEvidenceManifest = {
  runId: string;
  mode: "long_goal_evidence_bundle";
  generatedAt: string;
  status: LongGoalEvidenceStatus;
  items: number;
  pass: number;
  warn: number;
  fail: number;
  canonicalMutationAllowed: false;
};

export type LongGoalEvidenceBundle = {
  objective: string;
  generatedAt: string;
  items: LongGoalEvidenceItem[];
};

export type LongGoalEvidenceRunSummary = {
  manifest: LongGoalEvidenceManifest;
  bundle: LongGoalEvidenceBundle;
  reportMarkdown: string;
  runDir?: string;
};

export const longGoalObjective =
  "长期自动探索 Crystal Pool 为了完整实现 hopepunk、人文主义、AI 非主权、有灵魂的数据、可靠性伦理、开源/闭源双核、世界线沙盒与艺术化操作面的哲学观和美学观，还缺哪些机制、界面、协议、文章、测试与治理边界；把发现沉淀为 JiEvent、Sandbox rehearsal、RFC 草案、设计提案和可验证工程任务，但默认不自动 promote canonical pool。";

export function createLongGoalEvidenceManifest({
  runId,
  bundle,
}: {
  runId: string;
  bundle: LongGoalEvidenceBundle;
}): LongGoalEvidenceManifest {
  const pass = bundle.items.filter((item) => item.status === "pass").length;
  const warn = bundle.items.filter((item) => item.status === "warn").length;
  const fail = bundle.items.filter((item) => item.status === "fail").length;
  const status: LongGoalEvidenceStatus =
    fail > 0 ? "fail" : warn > 0 ? "warn" : "pass";

  return {
    runId,
    mode: "long_goal_evidence_bundle",
    generatedAt: bundle.generatedAt,
    status,
    items: bundle.items.length,
    pass,
    warn,
    fail,
    canonicalMutationAllowed: false,
  };
}

export function generateLongGoalEvidenceReport({
  manifest,
  bundle,
}: {
  manifest: LongGoalEvidenceManifest;
  bundle: LongGoalEvidenceBundle;
}) {
  const itemLines = bundle.items.map((item) => {
    const artifact = item.artifact ? ` artifact=${item.artifact}` : "";
    return `- ${item.status.toUpperCase()} ${item.id}: ${item.title} command=\`${item.command}\`${artifact}`;
  });
  const boundaryLines = bundle.items.map(
    (item) => `- ${item.id}: ${item.boundary}`,
  );

  return [
    "# Crystal Pool Long Goal Evidence Bundle",
    "",
    `- runId: ${manifest.runId}`,
    `- generatedAt: ${manifest.generatedAt}`,
    `- status: ${manifest.status}`,
    `- pass: ${manifest.pass}`,
    `- warn: ${manifest.warn}`,
    `- fail: ${manifest.fail}`,
    `- canonicalMutationAllowed: ${manifest.canonicalMutationAllowed}`,
    "",
    "## Objective",
    bundle.objective,
    "",
    "## Evidence Items",
    ...itemLines,
    "",
    "## Proof Notes",
    ...bundle.items.map((item) => `- ${item.id}: ${item.proof}`),
    "",
    "## Boundaries",
    ...boundaryLines,
    "",
    "## Boundary",
    "This bundle is evidence only. The long goal remains active. It does not promote canonical nodes, unlock AI mainline, upload anchors, publish artifacts, certify external forks automatically, or mutate external projects.",
  ].join("\n");
}
