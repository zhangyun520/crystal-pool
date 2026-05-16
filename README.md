# Crystal Pool

Crystal Pool is a local-first meaning engine where fragments enter as
fluctuations, resonate through edges, cross phase thresholds, crystallize into
patterns, and remain soft enough to laugh.

## Run

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

`OPENAI_API_KEY` is optional. Without it, `/ai-pool` still records director
cycles as `skipped`, so the isolation and audit surface can be tested locally
before live AI mutation is enabled.

## Scripts

```bash
npm run lint
npm test
npm run test:e2e
npm run build
npm run db:print
npm run corpus:worker -- input.jsonl output.jsonl
npm run corpus:long
npm run corpus:watch -- --interval-ms 60000 --max-cycles 100
npm run market:tick
npm run market:anchor -- --provider local
npm run market:anchor-ref -- --anchor-id <id> --provider ipfs --ref <cid>
npm run market:watch -- --interval-ms 60000 --max-cycles 100
npm run ji:event -- --source open-hermes --kind agent.cycle --title <title> --body <body>
npm run ji:ingest
npm run ecosystem:once
npm run ecosystem:watch -- --interval-ms 60000 --max-cycles 100
npm run ecosystem:report
npm run worldline:run -- --worldline HOPEPUNK_REPAIR --mode SONATA
npm run skill:crystallize:once -- --max-items 8
npm run skill:crystallize:watch -- --interval-ms 3600000
npm run skill:crystallize:once -- --domain coding --repo-scan-limit 4
npm run skill:crystallize:watch -- --domain coding --interval-ms 3600000
npm run skill:crystallize:once -- --domain philosophy --max-sandbox-runs 4
npm run skill:crystallize:watch -- --domain philosophy --interval-ms 3600000
npm run coding:repo-scan -- --repo openai/codex
npm run coding:sandbox:once -- --max-runs 4
npm run constitution:check
```

## Domain

- `CrystalNode`: a fragment, concept, meme, or crystallized meaning.
- `CrystalEdge`: a typed relation between fragments.
- `PhaseEvent`: a recorded transition, also called 机.
- `ContributionEvent`: a hashed contribution ledger entry for support,
  challenge, review, verification, build intent, fund intent, fork, or
  feedback.
- `MarketOrder`: a simulated bid, ask, support, or challenge intent. It is not
  money, a token, or a real trade.
- `ChainAnchor`: a local IPFS/Arweave-ready digest bundle for contribution
  events.
- `JiEvent`: a cross-project trigger point from Crystal Pool, Hermes, MV
  projects, GitHub, Chrome, Computer Use, or network crystallization. It enters
  `data/ecosystem/inbox/` and cannot affect the canonical pool until reviewed
  from `/ecosystem`.
- `NetworkCrystallizationSkill`: an hourly observe-and-propose loop that reads
  configured high-quality feeds, scores candidates, links them into a local
  hash chain, and emits reviewable JiEvents without creating canonical nodes.
- `CrystallizationDomain`: the domain lane for long-running crystallization.
  `AI_RESEARCH` tracks research/institutional AI signals; `CODING_AUTOMATION`
  tracks AI coding agents, programming paradigms, modular architecture, design
  patterns, repo evolution, tooling failures, and governance/security signals;
  `PHILOSOPHY_AESTHETICS` tracks hopepunk ethics, humanistic governance,
  soulful data, reliability ethics, worldline narrative, and operational
  interface aesthetics.
- `CodingRepositoryScan`: a read-only shallow clone of allowlisted GitHub repos
  into `data/ecosystem/repo-cache/`. It reads file trees and metadata only. It
  never installs dependencies, executes repo code, runs tests, opens issues, or
  promotes canonical pool state.
- `PoolSpace`: an isolated meaning space. Canonical, AI-directed, and Fugue
  pools do not share direct mutation paths.
- `AIDirectorCycle`: one audited AI mutation pass over the AI-directed pool.
- `HumanSuggestion`: the only human input channel inside the AI-directed pool.
- `SandboxRun`: the business-level sandbox replay record. The current database
  storage remains the historical `FugueRun` table, wrapped by a `SandboxRun`
  adapter. Fugue runs use `FUGUE`; Sonata uses `SONATA` for theme maturation;
  Symphony uses `SYMPHONY` for systemic rehearsal.
- `WorldlineProtocol`: a horizontal sandbox archetype such as
  `OTHERNESS_MIRROR`, `RETURN_HOME`, `DAO_GOVERNANCE`, `GRIMDARK_EMPIRE`,
  `STELLAR_COMMONWEALTH`, `AI_DIRECTED_WORLD`, `HOPEPUNK_REPAIR`, or
  `FORK_DRIFT`. It shapes rehearsal hypothesis and responsibility questions
  without replacing Fugue/Sonata/Symphony semantics.
- `EthicalInvariant`: a checkable ethics boundary for AI non-sovereignty,
  canonical review, local proof-chain, no real-money instruments, JiEvent
  intake, fork right, soulful data, hopepunk repair, open-core boundaries, and
  reliability as ethics.
- `SoulfulDataAssessment`: a review-only signal that checks provenance, lived
  context, consent boundary, traceability, repairability, non-extractive use,
  and human responsibility before data can be considered healthy pool input.
- `Phase`: `gas`, `liquid`, `seed`, `crystal`, `fossil`, `dissolved`.
- `ha`: anti-dogma annealing signal. It softens over-hard crystallization.
- `Hakimi`: anti-fossilization UX assistant that suggests ha-softening.

## Pool Architecture

- `canonical` is the normal human-operated pool. Node forms, imports, backup
  restore, graph, market, and dashboard views default here.
- `ai` is the AI-directed pool. Humans can observe `/ai-pool`, submit
  suggestions, and inspect `/flow?pool=ai`; only validated AI director
  decisions create nodes, create edges, or change phase.
- `fugue` is the sandbox pool. Fugue runs deterministic counterpoint scenarios,
  Sonata traces a theme through conflict, and Symphony rehearses systemic
  cascades. Sandbox events stay isolated until a learning proposal is explicitly
  promoted into the canonical pool as a `fugue` source node.

## Features

- Add, edit, archive, filter, sort, and inspect crystal nodes.
- Connect nodes with typed weighted edges.
- View the pool dashboard, phase counts, ha feed, and strongest crystals.
- View a responsive SVG concept graph.
- Watch local meaning order flow from `/flow`.
- Record local contribution-chain events and simulated market intents from node
  detail pages.
- View the mixed meaning order book, market tape, signal price, and anchor
  status from `/flow` and `/observe`.
- Run an AI-directed pool from `/ai-pool` with OpenAI Responses API structured
  output, skipped-cycle behavior when the key is missing, human suggestions,
  permission wall, and decision audit log.
- Run Fugue, Sonata, and Symphony sandbox protocols from `/sandbox` (`/fugue`
  redirects for compatibility), review run lists, deterministic replay
  timelines, immutable completed-state badges, and Markdown reports, then
  promote sandbox learnings back into the canonical pool.
- Review cross-project JiEvents from `/ecosystem`, promote them into canonical
  nodes plus deterministic contribution-chain proof events, create sandbox
  rehearsals, draft RFC notes, or dismiss them.
- Inspect the Ethical Kernel from `/observe` and run
  `npm run constitution:check` to verify no wallet, token, RPC, automatic
  upload, automatic AI unlock, or direct external canonical mutation boundary
  has been crossed.
- Run the local autonomy loop with `npm run ecosystem:once` or
  `npm run ecosystem:watch`. It imports JiEvent inbox records and writes
  observations, proposals, manifests, and reports under
  `data/ecosystem/runs/<run-id>/`; it never creates canonical nodes, promotes
  sandbox learning, opens PRs, uploads anchors, or unlocks AI mainline.
- Run the network crystallization skill with
  `npm run skill:crystallize:once` or
  `npm run skill:crystallize:watch -- --interval-ms 3600000`. It searches
  configured RSS/Atom sources, creates `data/ecosystem/network-chain/` proof
  links, writes local run reports, and drops JiEvents into the review inbox.
- Run the coding intelligence lane with
  `npm run skill:crystallize:once -- --domain coding` or
  `npm run skill:crystallize:watch -- --domain coding --interval-ms 3600000`.
  It can shallow clone allowlisted repositories for read-only architecture
  analysis, emit coding JiEvents, and create high-score completed Sandbox
  rehearsals inside the sandbox pool only.
- Record phase transitions and ha-softening events.
- Bulk import pasted conversation residue with deterministic preview.
- Mark local corpus shards from `/corpus` before they become nodes or edges.
- Queue pasted ChatGPT web transcripts or ChatGPT export JSON from `/corpus`.
- Monitor corpus queue, run artifacts, and pool health from `/observe`.
- Export a complete local JSON backup from `/backup`.
- Run deterministic tests for scoring, phase transitions, import parsing, and
  Hakimi suggestions.

## Corpus Trail

`/corpus` is the first marking layer for internet or file corpus work. It
creates deterministic `CorpusSnapshot` and `MeaningMark` records in memory,
explains duplicate/resonance matches against the active pool, and emits worker
JSONL for future parallel runs.

The ChatGPT intake on `/corpus` accepts pasted web transcripts or
`conversations.json` export content and writes local JSONL shards into
`data/corpus/inbox/`. Inbox JSONL is git-ignored by default.

The CLI worker accepts JSONL records shaped like:

```json
{"sourceKind":"manual","sourceRef":"manual:daily","title":"Daily shard","body":"意义是对抗时间的最小单位。"}
```

It emits `crystal-pool.worker-result.v1` JSONL containing snapshots, meaning
marks, suggested relations, and warnings. It does not write to the database.

For unattended local runs, put one or more JSONL shards in
`data/corpus/inbox/` and run:

```bash
npm run corpus:long
```

The long-run CLI writes `manifest.json`, `worker-results.jsonl`,
`trail-bundle.json`, and `run-report.md` under `data/corpus/runs/<run-id>/`,
then moves processed shards to `data/corpus/processed/<run-id>/`. Use
`npm run corpus:watch` for a repeated local loop.

## Jellyfish Ecosystem

Crystal Pool is the mother pool. Other projects act as organs that emit
`JiEvent` observations:

- `open-hermes`: nervous system events such as agent cycles and learned memory.
- `houzuo-nianwu-mv` and `yuehua-mv`: creative tentacles for rendered artifacts,
  publish blockers, publish completions, and audience signals.
- `github`: repo, PR, CI, and release discipline signals.
- `chrome` and `computer`: authenticated or local UI observations.
- `network`: high-quality public source feeds scored and chained by the
  network crystallization skill.

The boundary is strict: adapters write JSONL into `data/ecosystem/inbox/*.jsonl`
or use `npm run ji:event`; they do not mutate the database. Run
`npm run ji:ingest` or press `Import Inbox` on `/ecosystem`, then review each
event. A reviewer can create a canonical `CrystalNode` with a local
`ContributionEvent`, create a Fugue/Sonata/Symphony sandbox run, draft a local
RFC, or dismiss the event.

For the long-running mother-pool loop, use:

```bash
npm run ecosystem:once
npm run ecosystem:watch -- --interval-ms 60000 --max-cycles 100
npm run ecosystem:report
```

The autonomy loop is observe + propose only. It reads JiEvent, Sandbox, AI Pool,
anchor, and repo state, then writes cycle artifacts under
`data/ecosystem/runs/<run-id>/`.

For hourly network crystallization, use:

```bash
npm run skill:crystallize:once
npm run skill:crystallize:watch -- --interval-ms 3600000 --max-cycles 24
npm run skill:crystallize:once -- --domain coding --repo-scan-limit 4
npm run skill:crystallize:watch -- --domain coding --interval-ms 3600000 --max-cycles 24
npm run skill:crystallize:once -- --domain philosophy --max-sandbox-runs 4
npm run skill:crystallize:watch -- --domain philosophy --interval-ms 3600000 --max-cycles 24
npm run philosophy:gap-audit
npm run philosophy:gap-audit -- --create-sandboxes --max-runs 4
npm run coding:repo-scan -- --repo openai/codex
npm run coding:sandbox:once -- --max-runs 4
```

Use `--domain coding` for the `CODING_AUTOMATION` lane and omit it for
`AI_RESEARCH`. Use `--domain philosophy` for the `PHILOSOPHY_AESTHETICS`
lane. The coding lane scans official AI coding, agent protocol,
open-source coding agent, and programming paradigm sources. The philosophy lane
scans curated philosophy, governance, AI culture, and interface-craft sources
for reviewable mechanisms, ethical invariants, design principles, and worldline
rehearsal prompts. Each candidate also receives a typed review proposal such as
`ETHICAL_INVARIANT_PROPOSAL`, `AESTHETIC_SURFACE_PROPOSAL`,
`RFC_DRAFT_PROPOSAL`, `ESSAY_NOTE_PROPOSAL`, or
`ENGINEERING_TASK_PROPOSAL`, so reviewers can route it into the right artifact
instead of treating all signals as generic notes. Repo scan cache and
reports live under git-ignored `data/ecosystem/repo-cache/` and
`data/ecosystem/repo-scans/`. To customize source feeds, create a local,
git-ignored `data/ecosystem/network-sources.json` file shaped as
`{ "sources": [...] }`. Each cycle writes `manifest.json`, `candidates.jsonl`,
`chain.jsonl`, `ji-events.jsonl`, `proposals.jsonl`, `sandbox-runs.jsonl`, and
`report.md` under `data/ecosystem/network-runs/<run-id>/`, plus
domain-specific local chain cursors under `data/ecosystem/network-chain/`.
These artifacts are a reviewable memory chain, not canonical truth.

`npm run philosophy:gap-audit` is the internal companion to the public-source
philosophy lane. It asks what Crystal Pool still lacks to fully realize its
hopepunk, humanist, AI-non-sovereign, soulful-data, reliability, fork,
worldline, and artistic-interface commitments. Each run writes
`manifest.json`, `gap-audit.json`, `evidence.json`, `ji-events.jsonl`,
`sandbox-inputs.jsonl`, `rfc-drafts.md`, `design-proposals.md`,
`engineering-tasks.md`, and `report.md` under
`data/ecosystem/philosophy-goal-audits/<run-id>/`. By default it writes
reviewable JiEvents into the local inbox; use `--dry-run` to skip inbox writes,
or `--create-sandboxes` to create sandbox-only rehearsals. It never creates
canonical nodes, unlocks AI mainline, uploads anchors, or changes governance by
itself.

`npm run coding:sandbox:once` deliberately reuses known coding candidates when
needed, so sandbox rehearsals can be regenerated after a local database reset
without duplicating JiEvent inbox records.

Worldlines are generic rehearsal archetypes, not branded lore libraries:

```bash
npm run worldline:run -- --worldline OTHERNESS_MIRROR --mode SYMPHONY
npm run worldline:run -- --worldline RETURN_HOME --mode SONATA
npm run worldline:run -- --worldline GRIMDARK_EMPIRE --mode FUGUE
npm run worldline:run -- --worldline HOPEPUNK_REPAIR --mode SONATA
npm run worldline:run -- --worldline FORK_DRIFT --mode SYMPHONY
```

`HOPEPUNK_REPAIR` treats hope as accountable repair infrastructure: mutual aid,
bounded care, visible repair, and refusal to outsource responsibility.

`FORK_DRIFT` rehearses what happens when a fork copies parameters but weakens
review gates, proof boundaries, open-core commitments, or AI responsibility
limits.

## Philosophy and Ethics

The public ethics statement lives in
[`docs/philosophy/soulful-data-hopepunk-engineering.md`](docs/philosophy/soulful-data-hopepunk-engineering.md).
It frames Crystal Pool as hopepunk engineering: not optimism, but repair
capacity under pressure.

For follow-up discussion with other AI systems, use
[`docs/philosophy/ai-discussion-brief.md`](docs/philosophy/ai-discussion-brief.md).
It maps the philosophy to code surfaces, hard boundaries, and review questions.

The MV sibling projects include a lightweight local emitter:

```bash
cd ../houzuo-nianwu-mv
npm run ji:rendered -- --title "Render complete" --body "Rendered local MP4" --ref label=render,path=renders/houzuo-nianwu-dynamic-mv.mp4

cd ../yuehua-mv
npm run ji:blocked -- --title "Upload blocked" --body "Platform verification requires human confirmation"
```

These scripts do not upload, publish, or write Crystal Pool canonical data.

## Meaning Market

`/flow` includes a simulated meaning market. It aggregates contribution events,
virtual orders, node scores, phase, ha, and edge counts into a deterministic
signal price and market depth. This is a local coordination surface only: no
wallets, no token issuance, no real assets, and no external upload happens in
v1.

Contribution events form a SHA-256 hash chain over canonical JSON. To export an
IPFS/Arweave-ready proof bundle for pending events, run:

```bash
npm run market:tick
```

Artifacts are written under `data/market/anchors/`,
`data/market/snapshots/`, and `data/market/logs/`; those directories are
git-ignored. `npm run market:watch` repeats the local tick loop for long-running
observation.

## Anchoring Boundary

Crystal Pool has a local proof-chain design, not a live blockchain integration.
`ContributionEvent.eventHash` links deterministic contribution payloads through
`previousHash`. `ChainAnchor` stores a digest range and points to an exported
JSON proof bundle. The supported providers mean:

- `local`: write a local proof bundle only.
- `ipfs`: write an IPFS-ready JSON bundle for later manual upload.
- `arweave`: write an Arweave-ready JSON bundle for later manual upload.

No wallet, token, RPC call, CID creation, transaction id, or automatic external
anchoring is performed in this phase. After a human manually uploads a bundle
outside Crystal Pool, `/observe` can record the returned CID, Arweave
transaction id, or local proof reference as ChainAnchor archival metadata
without changing historical contribution hashes. The same local metadata update
is available from `npm run market:anchor-ref`.

## Hardening-01 Notes

- Archive replaces hard delete for nodes. Archived nodes are hidden from the
  default dashboard, graph, and node list, but remain visible through direct
  detail links and `status=archived` or `status=all` filters.
- `/nodes` accepts `q`, `phase`, `tag`, `status`, `sort`, and `dir` query
  params.
- `/backup/export.json` includes `schemaVersion`, `exportedAt`, `nodes`,
  `edges`, `tags`, `nodeTags`, and `phaseEvents`, including archived nodes.

## Codex Skill

This repo includes `.agents/skills/crystal-pool/SKILL.md`. Use it when adding
features related to nodes, graph relations, phase transitions, crystallization
scoring, import parsing, ha-softening, or Hakimi behavior.
