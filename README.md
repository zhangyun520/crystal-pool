# Crystal Pool

> A local-first meaning crystallization engine.

Crystal Pool turns fragments, conversational residue, corpus shards, contributions, and simulated order flow into an observable, auditable, explainable meaning market. It is not a notes app, not a trading system, not an AI black box, not a social platform.

It is a deterministic pool where ideas enter as residue, form nodes, resonate through edges, change phase, accumulate contributions, and surface as meaning clusters with order-flow-like pressure—**while a welfare layer makes sure no voice is drowned by the loudest**.

---

## Status

**v0.0 — Architecture only.** No code yet. The design is canonical; implementation has not started.

- Constitution: [`docs/constitution.md`](docs/constitution.md) — what Crystal Pool will never become.
- Architecture: [`docs/architecture.md`](docs/architecture.md) — what it does, how, and when.
- Roadmap: [v0.1 → v0.2 → v0.3 → v1.0](docs/architecture.md#part-vii--路线图).

If you want to participate: read both documents in full before opening an issue or PR.

---

## Three sentences

1. **Thoughts are not files.** They flow, change phase, contradict, die, and live in bodies.
2. **People are not users.** They have rhythm, pain, silence, the right to leave, and mortality.
3. **Meaning is not flow.** It needs friction, time, and to be seen—not just clicked.

A fourth sentence, added later:

4. **The pool is not a tool.** It is a three-layered life (node / actor / pool); each layer has phases, wounds, and recoveries.

---

## Six currencies, never interchangeable

| Currency | Type | Cadence | Metaphor |
|---|---|---|---|
| **Signal** | flow | seconds | order-book price |
| **Tide** | rationed | daily | UBI |
| **Reputation** | accumulated | months-years | mastery |
| **Witness** | rationed-burned | seconds | attention |
| **Patience** | time-locked | days-months | resolve |
| **Bond** | collateral | quarterly | credit |

No exchange rate. No pool maker. No bridge. Ever. (Constitution §1.5)

---

## Greek-letter lens

We borrow the math of quantitative finance and reverse the ethics:

> Quants use Greek letters to **measure risk so they can avoid it**.
> Crystal Pool uses the same letters to **identify risk so it can be deliberately absorbed**—using welfare instead of hedging.

| Letter | Meaning | Welfare lever |
|---|---|---|
| α | crystallization score | public alpha mandate (no hidden scoring) |
| β | cluster co-movement | counter-echo-chamber (negative β protected) |
| γ | edge-of-phase sensitivity | critical-phase alerts |
| θ | time decay | hospice for fading nodes |
| ν | volatility vulnerability | trauma-informed design |
| ρ | collective rhythm | counter-cyclical Tide |

Details: [`docs/architecture.md` Part XI–XIII](docs/architecture.md).

---

## What Crystal Pool refuses to do

- ❌ Issue tokens. Accept money. Build wallets.
- ❌ Have admins. Let AI decide meaning. Let reputation buy power.
- ❌ Maximize DAU. Reward speed. Punish silence. Run infinite scroll.
- ❌ Centralize body data. Pretend users are healthy by default.
- ❌ Force consensus. Delete history. Hide governance.
- ❌ Diagnose users like a therapist. Surveil collective mood.

The pool is a **companion, not a therapist**. (Constitution §4.5)

Full list: [`docs/constitution.md`](docs/constitution.md).

---

## Architecture at a glance

```
┌────────────────────────────────────────────────────────┐
│ 7. Audit / Anchor       hash chain · snapshot · anchor │
├────────────────────────────────────────────────────────┤
│ 6. Flow Workbench       /flow + inspector + ledger     │
├────────────────────────────────────────────────────────┤
│ 5. Distribution Layer   Signal · Tide · Reputation     │ ← welfare ↔ market
│                         + Witness · Patience · Bond    │
├────────────────────────────────────────────────────────┤
│ 4. Cluster Read Model   deriveMeaningClusters()        │
├────────────────────────────────────────────────────────┤
│ 3. Crystal Graph        node · edge · phase · tag      │
├────────────────────────────────────────────────────────┤
│ 2. Contribution Layer   event hash chain + proposal    │
├────────────────────────────────────────────────────────┤
│ 1. Input / Corpus       residue · ChatGPT · JSONL      │
└────────────────────────────────────────────────────────┘
```

Layer 5 is where market and welfare meet—every other layer must respect that boundary.

---

## Open-source dual core

| Always open | May be closed |
|---|---|
| Crystal Graph, Phase Engine, Contribution Hash Chain, MeaningCluster, Distribution, Scoring | UI themes, cosmetic assets, enterprise SLA, ops tooling |

Contributions accepted via **DCO** (not CLA). Contributors keep their copyright. (Constitution §6.1–6.6)

---

## How to participate

1. Read [`docs/constitution.md`](docs/constitution.md) and [`docs/architecture.md`](docs/architecture.md).
2. Open an issue tagged `discussion` for any new mechanism proposal.
3. New mechanisms must pass the [Do No Harm 9-question check](docs/architecture.md#do-no-harm-check9-问).
4. PRs require sign-off (`git commit -s`) per DCO.

The project is run **inside Crystal Pool itself once v0.1 ships**: every proposed mechanism enters the pool as a `build_intent` node, gets reviewed, and is implemented only if it survives. Until then, GitHub Issues and Discussions stand in.

---

## Status of the larger ecosystem

- **`zhangyun520/open-hermes`** — Cognitive Jelly, the project from which Crystal Pool emerged. Different focus (gamified meaning pet); shares some primitives (residue, contribution attribution).
- **`zhangyun520/crystal-pool`** — this repo. Open-core meaning engine. The **subject** of the fugue.
- **`zhangyun520/crystal-fugue`** (future) — counterpoint sandbox. Always open, always free. Where Pool's mechanisms are tested under augmentation, diminution, inversion, retrograde. See [`docs/fugue-vision.md`](docs/fugue-vision.md). The **answer** of the fugue.
- **`zhangyun520/crystal-pool-hosted`** (future) — optional commercial hosting layer (themes, SLA, ops). Closed-source allowed; never replaces the engine. The **concert hall** of the fugue.

In Bach's terms: **subject, counterpoint, performance**.
In *fuga*'s deepest sense: **dwelling, exploration, return**.

---

## License

[Apache License 2.0](LICENSE) for code.
[CC BY-SA 4.0](LICENSE-DOCS) for `docs/`.

---

## Acknowledgments

The architecture grew out of a long collaborative dialogue across several conversations. The design owes specific debts to:
- F2P game economies (League / Apex / Path of Exile / Genshin)—for showing how to keep 95% of players engaged
- SAMHSA's trauma-informed care framework—for the six pillars of safe systems
- Quantitative finance Greek letters—for a unified risk vocabulary, used in reverse
- Open-source culture (Linux, Git, IETF)—for DCO, fork rights, RFCs

---

## A one-line definition

> **Crystal Pool is a local-first meaning crystallization engine that organizes fragments, residue, phase transitions, relations, contributions, simulated order flow, welfare distribution, body sensing, exit rights, and fork rights into an observable, auditable, explainable, repairable, escapable meaning market—where the market does not eat welfare, the body does not get diagnosed, and the pool itself is treated as a living being.**
