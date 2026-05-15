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
- Any new mechanism must define mode semantics, validation rules, report
  templates, tests, and a migration or rollback note before it is considered
  complete.

## Testing

Before finishing a task, run:

- `npm run lint`
- `npm test`
- `npm run build`

If a command is missing, add it or explain why it is not applicable.
