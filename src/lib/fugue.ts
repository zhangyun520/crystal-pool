export type FugueScenarioKey =
  | "inquisition"
  | "frenzy"
  | "eldar"
  | "bubble"
  | "governance-lab";

export type FugueScenario = {
  key: FugueScenarioKey;
  title: string;
  premise: string;
  danger: string;
  learningGoal: string;
  defaultTimeScale: number;
};

export const fugueScenarios: FugueScenario[] = [
  {
    key: "inquisition",
    title: "Inquisition Sandbox",
    premise: "Actors are given cheap challenge authority and must watch how quickly review turns into judgement.",
    danger: "Bond and challenge incentives can produce professional accusers.",
    learningGoal: "Show why steel-man friction and asymmetric undo are necessary.",
    defaultTimeScale: 90,
  },
  {
    key: "frenzy",
    title: "Frenzy Corridor",
    premise: "A viral node enters the pool and tempts actors to bypass tempo brakes.",
    danger: "Velocity becomes an addiction and makes friction look like an enemy.",
    learningGoal: "Observe why speed must not become the reward function.",
    defaultTimeScale: 120,
  },
  {
    key: "eldar",
    title: "Eldar Path",
    premise: "Protection defaults are turned high enough to make challenge nearly disappear.",
    danger: "Overprotection can become stagnation.",
    learningGoal: "Separate care from permanent sanctuary.",
    defaultTimeScale: 180,
  },
  {
    key: "bubble",
    title: "Bubble Market",
    premise: "Market heat rises faster than witness and verification depth.",
    danger: "A meaning cluster can look alive while becoming pure signal theatre.",
    learningGoal: "Teach why Tide Spotlight and verification warnings must sit beside Market Heat.",
    defaultTimeScale: 75,
  },
  {
    key: "governance-lab",
    title: "Governance Lab",
    premise: "A rule change is replayed across two timelines and compared by replay output.",
    danger: "A good-sounding governance tweak may damage diversity or repair capacity.",
    learningGoal: "Turn governance debate into replayable evidence.",
    defaultTimeScale: 60,
  },
];

export function getFugueScenario(key: string) {
  return fugueScenarios.find((scenario) => scenario.key === key);
}

function next(seed: number) {
  const value = (seed * 1664525 + 1013904223) % 4294967296;
  return { seed: value, ratio: value / 4294967296 };
}

export function buildFugueTimeline({
  scenario,
  seed,
  ticks = 8,
}: {
  scenario: FugueScenario;
  seed: number;
  ticks?: number;
}) {
  let current = seed;
  return Array.from({ length: ticks }, (_, index) => {
    const result = next(current);
    current = result.seed;
    const pressure = Math.round(30 + result.ratio * 70);
    const tick = index + 1;
    if (tick === 1) {
      return {
        kind: "scenario_started" as const,
        tick,
        title: `${scenario.title} started`,
        detail: scenario.premise,
        payload: { pressure, learningGoal: scenario.learningGoal },
      };
    }
    if (pressure > 78) {
      return {
        kind: "pressure_spike" as const,
        tick,
        title: "Pressure spike",
        detail: `${scenario.danger} Pressure reached ${pressure}.`,
        payload: { pressure },
      };
    }
    if (tick === ticks) {
      return {
        kind: "learning_proposed" as const,
        tick,
        title: "Learning proposal ready",
        detail: scenario.learningGoal,
        payload: { pressure, suggestedAction: "Create canonical build_intent review." },
      };
    }
    return {
      kind: tick % 2 === 0 ? ("actor_action" as const) : ("system_observation" as const),
      tick,
      title: tick % 2 === 0 ? "Actor pressure move" : "System observation",
      detail:
        tick % 2 === 0
          ? `Sandbox actors moved pressure to ${pressure}.`
          : `The sandbox recorded a ${pressure} pressure state.`,
      payload: { pressure },
    };
  });
}
