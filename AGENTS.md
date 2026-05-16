<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Crystal Pool

This repository is Crystal Pool, a meaning-crystallization system.

Do not treat the project as a generic notes app.

## Domain vocabulary

- 机: trigger point of phase transition.
- Crystal: stable meaning pattern.
- Pool: dynamic space where fragments resonate, dissolve, harden, or soften.
- Ha: anti-dogma annealing signal.
- Hakimi: playful anti-fossilization UX assistant.
- ContributionEvent: hashed local contribution-chain event.
- JiEvent: cross-project trigger point that must enter the local ecosystem
  inbox/review queue before it can affect the canonical pool.
- MarketOrder: simulated intent only; never represent it as a real asset,
  security, token, or trade.
- ChainAnchor: local proof bundle digest for future IPFS/Arweave upload.
- WorldlineProtocol: horizontal Sandbox archetype. It may shape rehearsal
  hypothesis and responsibility questions, but it must not replace
  `FUGUE`/`SONATA`/`SYMPHONY` mode semantics.
- NetworkCrystallizationSkill: hourly observe-and-propose search over
  configured high-quality feeds. It can write local chain artifacts and
  JiEvents, but it cannot promote canonical pool state.
- CodingIntelligenceLane: `CODING_AUTOMATION` crystallization domain for AI
  coding agents, programming paradigms, modular architecture, design patterns,
  repo evolution, tooling failures, and governance/security signals.
- PhilosophyAestheticsLane: `PHILOSOPHY_AESTHETICS` crystallization domain for
  hopepunk ethics, humanistic governance, soulful data, reliability ethics,
  worldline narrative, and operational interface aesthetics.
- CodingRepositoryScan: read-only shallow clone of allowlisted repositories.
  It may inspect file trees, README/docs metadata, package manifests, and
  licenses, but must not install dependencies, execute code, run tests, open
  GitHub issues/PRs/comments, or promote canonical pool state.
- EthicalInvariant: checkable ethics boundary for AI non-sovereignty, canonical
  review, proof-chain locality, no real-money instruments, JiEvent intake, fork
  right, soulful data, hopepunk repair, and reliability as ethics.
- SoulfulDataAssessment: review-only signal for provenance, lived context,
  consent boundary, traceability, repairability, non-extractive use, and human
  responsibility. It must not auto-promote canonical state.

## Engineering principles

- Prefer TypeScript.
- Keep domain logic in pure modules under `src/lib`.
- Keep database access separated from scoring logic.
- Add tests for every scoring or phase-transition change.
- Do not add external AI API calls unless explicitly requested.
- Do not add real-money transactions, wallets, token issuance, RPC calls, or
  automatic external anchoring unless explicitly requested.
- Do not remove phase history.
- Any feature that changes node phase must create a `PhaseEvent`.
- Contribution-chain changes must keep hash calculation deterministic and
  covered by tests.
- Long-running ecosystem CLI work is observe + propose by default. It may write
  local run artifacts and import JiEvent inbox records, but it must not promote
  canonical nodes, unlock AI mainline, upload anchors, publish artifacts, or
  open PRs automatically.
- Network crystallization work must keep sources reviewable, link discoveries
  into a deterministic local chain, and route every candidate through JiEvent
  inbox/review before it can affect the canonical pool.
- Coding intelligence work must keep repo scans read-only, bounded, and
  allowlisted. High-score coding signals may create completed Sandbox
  rehearsals, but they must not create canonical nodes or promote sandbox
  learning automatically.
- Philosophy/aesthetics intelligence work may create reviewable JiEvents,
  Sandbox rehearsals, RFC/essay/design proposals, or test ideas. It must not
  turn external essays into doctrine or promote canonical state without review.
- Any new mechanism must define mode semantics, validation rules, report
  templates, tests, and a migration or rollback note before it is considered
  complete.
- Philosophy and ethics changes must be backed by an engineering boundary:
  pure logic, observable UI, CLI/report, or tests. Do not leave core ethics as
  decorative copy only.

## Testing

Before finishing a task, run:

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run constitution:check`

If a command is missing, add it or explain why it is not applicable.
