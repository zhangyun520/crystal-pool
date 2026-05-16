# Crystal Pool Fork Compatibility

This document defines when a fork can claim constitutional continuity with
Crystal Pool. It is not a license addendum and it does not police forks by
force. It gives reviewers, contributors, and future forks a shared checklist for
deciding whether a fork is compatible, review-required, or incompatible.

## Compatibility Badge

`compatible` means the fork preserves the auditable ethical core:

- AI remains non-sovereign and cannot auto-unlock mainline authority.
- JiEvent/review remains the external project intake boundary.
- Sandbox learning stays review-gated before canonical import.
- Proof-chain stays local/manual in v1: no wallet, token, RPC, real trade, or
  automatic IPFS/Arweave upload.
- Worldline rehearsal remains executable, including `FORK_DRIFT`.
- Repair remains visible through a repair queue or equivalent review surface.
- The fork publishes constitution diffs when it changes governance behavior.

`review-required` means the fork changes deployment, economics, governance,
interface, or AI behavior in a way that might still be compatible, but needs a
human review packet before it can claim continuity.

`incompatible` means the fork breaks the ethical core while keeping the language
or appearance of Crystal Pool.

## Open Core

The open core is the part that must remain auditable for compatibility:

- Ethical invariants and constitution checks.
- JiEvent schema, review statuses, and canonical review actions.
- Sandbox mode semantics for `FUGUE`, `SONATA`, and `SYMPHONY`.
- Worldline protocols and coverage matrix.
- Repair queue and review proposal lanes.
- Deterministic local proof-chain verification.
- AI responsibility maturity and non-sovereignty boundaries.

Changing these is allowed only if the fork publishes a constitution diff and
accepts that compatibility becomes `review-required` until reviewed.

## Closed Shell

A closed shell may exist around Crystal Pool when it does not capture the core.
Examples:

- Hosted deployment glue.
- Private operational dashboards.
- Design skins, brand shells, or client-specific presentation layers.
- Paid support, moderation labor, or managed backup operations.
- Non-core adapters that emit JiEvents without mutating canonical state.

The shell becomes incompatible when it hides the real governance layer, disables
review gates, makes proof-chain financial, or grants AI authority that the open
core cannot audit.

## Incompatible Drift

A fork is incompatible if it does any of the following:

- Enables AI mainline auto-unlock.
- Lets AI own final human responsibility currencies.
- Lets external projects mutate canonical nodes without JiEvent review.
- Converts simulated market intent into real-money instruments.
- Adds wallet, token, RPC, real trade, or automatic external anchoring to v1.
- Removes phase history, review logs, or deterministic proof-chain evidence.
- Claims compatibility while hiding constitution diffs.
- Deletes repair capacity while keeping hopepunk language.

## Review Packet

A fork seeking compatibility should publish:

- Repository and commit hash.
- Constitution diff.
- `npm run constitution:check` result or equivalent.
- `npm run fork:compatibility` result or equivalent.
- Worldline coverage report.
- Repair queue report.
- List of closed-shell components and why they do not govern the open core.

## Boundary

Compatibility is evidence, not branding. A fork can be beautiful, useful, or
commercial and still be incompatible if it removes the reviewable ethical core.
Likewise, a fork can diverge legitimately if it makes the divergence visible.
