# Contributing to Crystal Pool

Crystal Pool is a deliberately constrained system. The constitution defines what we will never become; the architecture defines what we will build and when.

**Read both before you contribute.**

- [`docs/constitution.md`](docs/constitution.md)
- [`docs/architecture.md`](docs/architecture.md)

---

## What kind of contributions are welcome

| Welcome | Not welcome |
|---|---|
| Bug fixes that align with the constitution | Features that maximize engagement, retention, or DAU |
| New mechanisms that pass the Do No Harm 9-check | Black-box scoring, AI-driven decisions about meaning |
| Documentation improvements | Token economies, wallets, real money flows |
| Tests, especially deterministic property tests | Personalized recommendation algorithms |
| Translations of constitution / architecture | Mechanisms that surveil collective mood or individual rhythm |
| Reference UI improvements | Centralized admin tools or god-mode operations |

If you are unsure whether a change is welcome, open an issue tagged `discussion` first.

---

## How to propose a new mechanism

Crystal Pool's design grows by passing through gates. New mechanisms follow this path:

1. Open an issue tagged `mechanism-proposal` with:
   - **Problem**: What does this mechanism solve?
   - **Mechanism**: What does it do?
   - **Constitution check**: Which constitution clause does it serve? Does it violate any?
   - **Do No Harm answers**: Walk through all 9 questions ([Part XII of architecture](docs/architecture.md#do-no-harm-check9-问))
   - **Greek-letter mapping**: Does this affect α/β/γ/θ/ν/ρ? Which lever?
   - **Phase**: v0.2 / v0.3 / v1.0?

2. Wait at least 7 days for community discussion. New mechanisms cannot be merged in haste—this is intentional friction.

3. If maintainers agree the proposal is sound, open a PR. The PR must:
   - Reference the issue
   - Include deterministic tests
   - Pass the constitution-check CI

4. **Once v0.1 ships, this entire process moves inside the pool itself**: proposals will enter as `build_intent` nodes, undergo Self-Critique Cycle review, and be implemented only after surviving the pool's own governance.

Until then, GitHub Issues + Discussions are the substitute.

---

## Sign-offs (DCO, not CLA)

We use the Developer Certificate of Origin instead of a CLA. This means:

- You keep the copyright on your contribution.
- You confirm the right to submit it under Apache 2.0.

Every commit must include:

```
Signed-off-by: Your Name <you@example.com>
```

`git commit -s` adds this automatically.

By signing off, you affirm the [DCO](https://developercertificate.org/).

---

## Code style

- TypeScript strict mode for all source.
- All scoring / cluster / distribution code must be **deterministic**: same inputs → same outputs, no Date.now() or Math.random() at the algorithm boundary.
- All public APIs documented in `docs/`.
- All mechanisms have unit tests covering their constitution intent—not just the happy path.
- Database schemas append-only where possible (PhaseEvent, ContributionEvent, ChainAnchor never deleted).

---

## Forbidden patterns (CI will reject)

- Any `setInterval` or polling that surveils user behavior.
- Importing real-money payment SDKs.
- Importing wallet / Web3 / RPC libraries in `core/`.
- Calling external AI APIs in `core/scoring/` or `core/meaning-clusters/`.
- `assertNoCrossCurrencyConversion` violations.
- Mutations to `CrystalEdge` or `phase` outside `apply-graph-effect.ts`.
- Disabling `governance/constitution-check.ts`.

---

## Getting help

- Documentation issues: open an issue tagged `docs`.
- Architecture questions: open a discussion in `Discussions → Architecture`.
- Mechanism proposals: open an issue tagged `mechanism-proposal`.

---

## Code of Conduct

The pool is a companion, not a battleground. Disagree with mechanisms, not with people. Steel-man before you challenge. Apologize publicly when you are wrong—it is rewarded with Reputation, not punished.

If conflict arises:
1. Take a 30-minute soft disconnect.
2. Reread your message.
3. If still unsure, ask a maintainer to mediate.

We do not tolerate harassment, doxxing, or coordinated attacks on individuals or groups. Violations result in account suspension; severe cases result in permanent ban with all contributions retained but author marked `erased`.

---

## License

By contributing, you agree your contribution is licensed under [Apache 2.0](LICENSE) for code and [CC BY-SA 4.0](LICENSE-DOCS) for documentation.
