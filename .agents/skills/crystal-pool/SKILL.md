---
name: crystal-pool
description: Use this skill when modifying the Crystal Pool app, adding features related to crystal nodes, phase transitions, meaning fragments, ha events, graph relations, or crystallization scoring.
---

# Crystal Pool Domain Guide

Crystal Pool is not a generic notes app. It models meaning formation as phase
transition.

## Core concepts

- CrystalNode: a fragment, concept, meme, or crystallized meaning.
- CrystalEdge: a relation between two nodes.
- PhaseEvent: a recorded transition, also called 机 in the domain language.
- Phase:
  - gas: unformed fluctuation
  - liquid: flowing idea
  - seed: crystallization nucleus
  - crystal: stable public pattern
  - fossil: over-hardened concept
  - dissolved: evaporated or deconstructed idea
- ha: anti-dogma annealing signal. It softens over-hard crystallization and
  reopens state space.
- Hakimi: playful anti-fossilization assistant.
- Actor: local identity alias for contribution-chain entries.
- ContributionEvent: hashed support, challenge, review, verify, build intent,
  fund intent, fork, or feedback entry.
- JiEvent: cross-project trigger point emitted by Crystal Pool, Hermes, MV
  projects, GitHub, Chrome, or Computer Use. It must pass ecosystem review
  before it can change canonical pool state.
- WorldlineProtocol: horizontal Sandbox archetype for otherness, return,
  low-intervention governance, grimdark pressure, stellar pluralism,
  AI-directed responsibility, or hopepunk repair. It shapes rehearsal inputs
  but never replaces `FUGUE`/`SONATA`/`SYMPHONY` mode semantics.
- MarketOrder: simulated bid, ask, support, or challenge intent. It must remain
  local and non-financial unless the user explicitly starts a later real-market
  phase.
- ChainAnchor: local digest bundle prepared for future IPFS/Arweave anchoring.
- NetworkCrystallizationSkill: hourly observe-and-propose search over
  configured high-quality RSS/Atom feeds. It writes local chain artifacts and
  JiEvents only; it never creates canonical nodes directly.
- CodingIntelligenceLane: the `CODING_AUTOMATION` crystallization domain for
  AI coding agents, programming paradigms, modular architecture, design
  patterns, repo evolution, tooling failures, and governance/security signals.
- PhilosophyAestheticsLane: the `PHILOSOPHY_AESTHETICS` crystallization domain
  for hopepunk ethics, humanistic governance, soulful data, reliability ethics,
  worldline narrative, and operational interface aesthetics.
- NetworkReviewProposal: typed observe-and-propose artifact that routes
  crystallization candidates toward observation review, ethical invariant,
  aesthetic surface, RFC draft, essay note, or engineering task review.
- CodingRepositoryScan: read-only shallow clone of allowlisted GitHub repos
  into local gitignored cache. It may inspect file trees, README/docs metadata,
  package manifests, and licenses, but it must not execute repo code, install
  dependencies, run tests, or open GitHub issues/PRs/comments.

## Engineering rules

1. Never treat this as a plain CRUD note app.
2. Preserve phase transition history.
3. Make scoring explainable.
4. Prefer small deterministic modules over hidden magic.
5. Keep AI features optional and separated behind interfaces.
6. Tests should cover scoring, phase transition, import parsing, and graph
   relations.
7. Meaning market work must preserve deterministic hash-chain verification and
   must not introduce wallets, tokens, real-money trading, RPC calls, or
   automatic external uploads in v1.
8. Cross-project ecosystem work must enter through JiEvent inbox/review and
   must not let adapters mutate the canonical pool directly.
9. Long-running ecosystem CLI work is observe + propose unless explicitly
   changed. It may write local run artifacts and import JiEvent records, but it
   must not promote canonical nodes, unlock AI mainline, upload anchors, publish
   artifacts, or open PRs automatically.
10. Network search/crystallization work must be review-gated through JiEvent,
    deterministic local chain artifacts, and `/ecosystem`; it must not treat
    fetched source text as canonical truth.
11. Coding intelligence work may create completed Sandbox rehearsals for
    high-score signals, but it must stay sandbox-only and must not promote
    canonical nodes or learning automatically.
12. Philosophy/aesthetics intelligence work may create completed Sandbox
    rehearsals, RFC/essay/design proposals, or review signals, but it must not
    turn external sources into doctrine or bypass JiEvent review.

## Good feature pattern

When adding a feature:

- define the domain object
- add database schema
- add pure logic
- add UI
- add tests
- update README
