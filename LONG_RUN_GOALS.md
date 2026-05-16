# Crystal Pool Long-Run Goals

Crystal Pool is moving in narrow, repeatable loops: implement one reliable slice,
run the gates, inspect the browser, reseed the pool, then continue.

## Current North Star

Make Crystal Pool a local-first daily residue engine: paste fragments every day,
review candidates before they become nodes, preserve every phase intervention,
explain why meanings crystallize, and keep the system soft enough to revise.

## Run Order

1. Daily Residue Loop
   - Candidate review queue.
   - Create, merge, edge-only, and dismiss batch actions.
   - Deterministic duplicate and resonance explanations.
2. Meaning Explainability
   - Why this score now.
   - Score drivers, last meaningful change, phase-fit reasons.
   - Clear phase suggestions that never auto-change history.
3. Backup Restore Usability
   - File restore entry.
   - Dry-run preview with counts, warnings, and blocking errors.
   - Explicit confirmation before replacing local data.
4. Graph Experience
   - Phase, relation, and tag filters.
   - Selected-node side panel.
   - Hover and selection states without replacing the SVG graph.
5. Local Suggestion Engine
   - Better keyword overlap and tag suggestions.
   - Merge and split hints.
   - No automatic creation of nodes, edges, or phase events.
6. Corpus Trail / Parallel Marking
   - Mark licensed web/file corpus shards as snapshots and meaning marks.
   - Use JSONL worker input/output so jobs can run locally or on legitimate
     free-tier workers.
   - Record trajectory events across repeated snapshots before any database
     write happens.
   - Run `npm run corpus:long` for one queue pass or `npm run corpus:watch`
     for a repeated local CLI loop.
   - Observe queue depth, worker results, trajectory events, and pool health
     from `/observe`.
   - Queue ChatGPT web transcripts or export JSON through `/corpus` without
     committing private inbox shards.
7. Optional AI Layer
   - Provider interface behind `ENABLE_AI_SUGGESTIONS`.
   - Disabled by default.
   - AI suggests relation, tag, or summary only.
8. Hakimi Deepening
   - Actionable anti-fossilization assistant.
   - Detect over-hard concepts and suggest ha-softening.
   - Stay playful, but preserve user control.

## Exploration Backlog

- Residue heat: show which imports keep returning across days.
- Contradiction ledger: surface unresolved contradictions as useful tension.
- Reheating queue: find old low-ha crystals that deserve revision.
- Merge memory: make every merge visibly explain what was preserved and what was
  archived.
- Pool health: balance phase counts, isolated nodes, dense clusters, and fossil
  risk.
- Meaning flow tape: watch phase changes, corpus runs, edges, and node updates
  as a local order-flow board from `/flow`.
- Corpus legality ledger: keep source, license, and capture notes attached to
  every shard before parallel processing.
- Worker swarm manifests: generate small shards for GitHub Actions, Oracle
  Always Free, local machines, or Cloudflare Workers without assuming any one
  provider.
