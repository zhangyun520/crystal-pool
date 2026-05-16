import { type CrystalEdgeCore, type CrystalNodeCore } from "./domain";

export type HakimiSuggestion = {
  nodeId: string;
  title: string;
  reason: string;
  action: "ha_soften";
  severity: "soft" | "watch" | "urgent";
};

const solemnWords = ["永恒", "绝对", "唯一", "终极", "不可动摇", "总纲"];

export function getHakimiSuggestions(
  nodes: CrystalNodeCore[],
  edges: CrystalEdgeCore[],
): HakimiSuggestion[] {
  return nodes
    .flatMap((node) => {
      const connected = edges.filter(
        (edge) => edge.fromId === node.id || edge.toId === node.id,
      );
      const hardens = connected.filter(
        (edge) => edge.relation === "hardens_into",
      ).length;
      const softens = connected.filter(
        (edge) => edge.relation === "ha_softens",
      ).length;
      const reasons: string[] = [];

      if (node.crystallizationScore >= 72 && node.emotionHa <= 2) {
        reasons.push("高结晶度但 ha 很低");
      }
      if (node.phase === "fossil") reasons.push("已经进入 fossil 相");
      if (hardens >= 2 && softens === 0) {
        reasons.push("硬化关系多，但没有 ha_softens 缓冲");
      }
      if (
        node.title.length > 28 ||
        solemnWords.some((word) => node.title.includes(word))
      ) {
        reasons.push("标题过硬或过庄严");
      }

      if (reasons.length === 0) return [];

      const suggestion: HakimiSuggestion = {
        nodeId: node.id,
        title: node.title,
        reason: reasons.join("；"),
        action: "ha_soften",
        severity:
          node.phase === "fossil"
            ? "urgent"
            : node.crystallizationScore >= 72
              ? "watch"
              : "soft",
      };

      return [suggestion];
    })
    .slice(0, 6);
}
