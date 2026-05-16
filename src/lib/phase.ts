import { clamp, type CrystalNodeCore, type Phase } from "./domain";

export type PhaseTransitionResult = {
  node: CrystalNodeCore;
  event: {
    nodeId: string;
    fromPhase: Phase;
    toPhase: Phase;
    reason: string;
  };
};

export function transitionNodePhase(
  node: CrystalNodeCore,
  targetPhase: Phase,
  reason: string,
): PhaseTransitionResult {
  return {
    node: {
      ...node,
      phase: targetPhase,
      updatedAt: new Date(),
    },
    event: {
      nodeId: node.id,
      fromPhase: node.phase,
      toPhase: targetPhase,
      reason,
    },
  };
}

export function applyHaSoften(
  node: CrystalNodeCore,
  reason = "Ha soften: reopen state space",
): PhaseTransitionResult {
  const targetPhase = node.phase === "fossil" ? "liquid" : node.phase;

  return {
    node: {
      ...node,
      phase: targetPhase,
      emotionHa: clamp(node.emotionHa + 2, 0, 10),
      updatedAt: new Date(),
    },
    event: {
      nodeId: node.id,
      fromPhase: node.phase,
      toPhase: targetPhase,
      reason,
    },
  };
}
