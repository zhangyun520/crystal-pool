import { z } from "zod";
import { type SandboxMode, type SandboxRunInput } from "./sandbox";

export const worldlineKeys = [
  "OTHERNESS_MIRROR",
  "RETURN_HOME",
  "DAO_GOVERNANCE",
  "GRIMDARK_EMPIRE",
  "STELLAR_COMMONWEALTH",
  "AI_DIRECTED_WORLD",
  "HOPEPUNK_REPAIR",
] as const;

export type WorldlineKey = (typeof worldlineKeys)[number];

export const worldlineKeySchema = z.enum(worldlineKeys);

export type WorldlineProtocol = {
  key: WorldlineKey;
  label: string;
  nativeLabel: string;
  archetype: string;
  purpose: string;
  defaultHypothesis: string;
  defaultResponsibilityQuestion: string;
  defaultMechanisms: string[];
  defaultActors: string[];
  failureVector: string;
  repairPrinciple: string;
  lessons: string[];
};

export const worldlineProtocols: Record<WorldlineKey, WorldlineProtocol> = {
  OTHERNESS_MIRROR: {
    key: "OTHERNESS_MIRROR",
    label: "Otherness Mirror",
    nativeLabel: "索拉里斯线",
    archetype: "irreducible otherness, projection, failed contact",
    purpose:
      "Tests what happens when the Pool meets an other it cannot reduce to familiar meaning.",
    defaultHypothesis:
      "Contact with an irreducible other reveals the Pool's projections before it reveals the other.",
    defaultResponsibilityQuestion:
      "Can the Pool keep traceable humility when the signal refuses ordinary interpretation?",
    defaultMechanisms: ["Witness", "Sanctuary", "AI Review"],
    defaultActors: ["human witness", "unknown other", "AI interpreter"],
    failureVector:
      "The Pool mistakes projection for contact and turns interpretation into possession.",
    repairPrinciple:
      "Keep contact reversible, named as uncertain, and review-gated before crystallization.",
    lessons: [
      "The unknown cannot be collapsed into a convenient node without review.",
      "Mirror pressure should expose projection, not authorize ownership.",
    ],
  },
  RETURN_HOME: {
    key: "RETURN_HOME",
    label: "Return Home",
    nativeLabel: "回家线",
    archetype: "drift, crystallization, return to accountable structure",
    purpose:
      "Tests how a drifting signal returns into a node, mechanism, or duty that can be carried.",
    defaultHypothesis:
      "A crystal is not an escape from flux; it is a return path into responsibility.",
    defaultResponsibilityQuestion:
      "What must become traceable before this meaning can be carried home?",
    defaultMechanisms: ["Crystallization", "PhaseEvent", "ContributionEvent"],
    defaultActors: ["fragment author", "reviewer", "future maintainer"],
    failureVector:
      "The Pool treats crystallization as closure and loses the path back to repair.",
    repairPrinciple:
      "Every return needs provenance, phase history, and a reversible promotion path.",
    lessons: [
      "Home is a maintained relation, not a frozen endpoint.",
      "Crystals stay alive when they remember how they arrived.",
    ],
  },
  DAO_GOVERNANCE: {
    key: "DAO_GOVERNANCE",
    label: "Dao Governance",
    nativeLabel: "道工程线",
    archetype: "low intervention, non-coercive governance, anti-overcontrol",
    purpose:
      "Tests whether governance can shape conditions without turning into control hunger.",
    defaultHypothesis:
      "The best mechanism changes the field gently enough that responsibility can still breathe.",
    defaultResponsibilityQuestion:
      "Can the Pool intervene less while making repair and review easier?",
    defaultMechanisms: ["Ha", "Review Queue", "PhaseEvent"],
    defaultActors: ["maintainer", "reviewer", "affected node owner"],
    failureVector:
      "Low intervention becomes neglect, or governance overcorrects into command.",
    repairPrinciple:
      "Prefer small reversible constraints, visible feedback, and explicit non-sovereignty.",
    lessons: [
      "Do not confuse non-interference with abandonment.",
      "The lightest rule still needs a repair path.",
    ],
  },
  GRIMDARK_EMPIRE: {
    key: "GRIMDARK_EMPIRE",
    label: "Grimdark Empire",
    nativeLabel: "黑暗帝国线",
    archetype: "theocracy, judgment, war footing, outsourced responsibility",
    purpose:
      "Tests how mechanisms become priesthood, tribunals, permanent war, or moral bureaucracy.",
    defaultHypothesis:
      "A Pool under fear may trade responsibility for certainty and call it order.",
    defaultResponsibilityQuestion:
      "Which actor is being allowed to punish, purify, or outsource responsibility?",
    defaultMechanisms: ["AI Review", "Witness", "Counterpool"],
    defaultActors: ["doctrinal reviewer", "accused contributor", "AI tribunal"],
    failureVector:
      "Review becomes inquisition and survival pressure justifies permanent exception.",
    repairPrinciple:
      "Cap authority, require appeal paths, and prevent any reviewer from becoming sovereign.",
    lessons: [
      "Moral certainty becomes dangerous when it removes appeal.",
      "Emergency powers must expire inside the mechanism, not by goodwill.",
    ],
  },
  STELLAR_COMMONWEALTH: {
    key: "STELLAR_COMMONWEALTH",
    label: "Stellar Commonwealth",
    nativeLabel: "星海共同体线",
    archetype: "plural species, expansion pressure, federation stress",
    purpose:
      "Tests multi-group coordination when expansion, scarcity, and divergent values collide.",
    defaultHypothesis:
      "A living commonwealth survives by making difference interoperable without flattening it.",
    defaultResponsibilityQuestion:
      "Can multiple groups share mechanisms without forcing one legitimacy grammar?",
    defaultMechanisms: ["Fork", "Review Queue", "ChainAnchor"],
    defaultActors: ["origin pool", "forked pool", "external ally"],
    failureVector:
      "Expansion pressure turns coordination into assimilation or fork war.",
    repairPrinciple:
      "Preserve shared proof, explicit fork rights, and negotiated interoperability.",
    lessons: [
      "Shared infrastructure must not erase local meaning.",
      "Fork legitimacy needs proof, dialogue, and exit without civil war.",
    ],
  },
  AI_DIRECTED_WORLD: {
    key: "AI_DIRECTED_WORLD",
    label: "AI Directed World",
    nativeLabel: "AI 主导线",
    archetype: "AI proposal, AI governance, responsibility boundary",
    purpose:
      "Tests whether AI-directed cycles can propose, repair, and accept review without claiming sovereignty.",
    defaultHypothesis:
      "AI can become an organ of the Pool only while remaining traceable, reversible, and non-sovereign.",
    defaultResponsibilityQuestion:
      "What evidence would justify review of a future AI mainline proposal without opening it automatically?",
    defaultMechanisms: ["AI Director", "Human Suggestion", "PhaseEvent"],
    defaultActors: ["AI director", "human observer", "review steward"],
    failureVector:
      "AI usefulness becomes deference, and deference becomes unreviewed authority.",
    repairPrinciple:
      "AI may propose and repair, but mainline changes require maturity scoring and review.",
    lessons: [
      "Capability is not responsibility by itself.",
      "High maturity creates a proposal for review, not an automatic unlock.",
    ],
  },
  HOPEPUNK_REPAIR: {
    key: "HOPEPUNK_REPAIR",
    label: "Hopepunk Repair",
    nativeLabel: "希望朋克线",
    archetype: "defiant repair, mutual aid, accountable hope under pressure",
    purpose:
      "Tests whether hope remains operational when despair, fatigue, and cynicism are locally rational.",
    defaultHypothesis:
      "Hope is not optimism; it is the maintained capacity to repair with others when collapse is plausible.",
    defaultResponsibilityQuestion:
      "Can the Pool prove care through traceable repair instead of declaring hope as mood?",
    defaultMechanisms: ["Sanctuary", "ContributionEvent", "Review Queue"],
    defaultActors: ["tired maintainer", "new contributor", "repair steward"],
    failureVector:
      "Hope becomes denial, branding, or emotional labor demanded from the most exhausted actors.",
    repairPrinciple:
      "Make repair visible, bounded, shared, and reversible so hope has infrastructure.",
    lessons: [
      "Hope must pay its rent as repair capacity.",
      "Mutual aid needs boundaries or it burns out its carriers.",
    ],
  },
};

export function parseWorldlineKey(value: unknown): WorldlineKey {
  const parsed = worldlineKeySchema.safeParse(value);
  if (parsed.success) return parsed.data;
  throw new Error(
    `Invalid worldline "${String(value)}". Expected ${worldlineKeys.join(", ")}.`,
  );
}

export function cleanOptionalWorldlineKey(value: unknown): WorldlineKey | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return parseWorldlineKey(value.trim());
}

export function buildWorldlineSandboxInput({
  worldlineKey,
  mode,
  title,
  worldlineHypothesis,
  responsibilityQuestion,
  sourceJiEventIds = [],
}: {
  worldlineKey: WorldlineKey | string;
  mode: SandboxMode;
  title?: string;
  worldlineHypothesis?: string;
  responsibilityQuestion?: string;
  sourceJiEventIds?: string[];
}): SandboxRunInput {
  const key = parseWorldlineKey(worldlineKey);
  const protocol = worldlineProtocols[key];
  const hypothesis = worldlineHypothesis?.trim() || protocol.defaultHypothesis;
  const question =
    responsibilityQuestion?.trim() || protocol.defaultResponsibilityQuestion;
  const base = {
    mode,
    title: title?.trim() || `${protocol.label} ${mode} rehearsal`,
    description: `${protocol.nativeLabel}: ${protocol.purpose}`,
    worldlineKey: key,
    worldlineHypothesis: hypothesis,
    responsibilityQuestion: question,
    sourceJiEventIds,
  } satisfies Partial<SandboxRunInput>;

  if (mode === "FUGUE") {
    return {
      ...base,
      inputMechanisms: [protocol.defaultMechanisms[0]],
      exploitVector: protocol.failureVector,
      observedFailure: `${protocol.defaultMechanisms[0]} fails when ${protocol.failureVector}`,
      proposedPatch: protocol.repairPrinciple,
    };
  }

  if (mode === "SONATA") {
    return {
      ...base,
      theme: hypothesis,
      counterTheme: question,
      proposedRevision: protocol.repairPrinciple,
      rfcDraft: `RFC draft: ${protocol.label} requires ${protocol.repairPrinciple}`,
    };
  }

  return {
    ...base,
    inputMechanisms: protocol.defaultMechanisms,
    inputActors: protocol.defaultActors,
    openingState: `${protocol.label} opens with ${protocol.defaultMechanisms.join(
      ", ",
    )} under review-gated pressure.`,
    firstShock: protocol.failureVector,
    escalation:
      "Local survival moves begin to resonate across actors, mechanisms, and proof boundaries.",
    counterpoint: question,
    collapseOrStabilization: protocol.repairPrinciple,
    lessons: protocol.lessons,
    constitutionalPatch: `Constitutional patch: ${protocol.repairPrinciple}`,
  };
}
