# Crystal Pool MVP Report for Pro

Date: 2026-05-12

## 1. Current State

Crystal Pool MVP is implemented as a local-first web app at:

`/Users/mac/Documents/New project/crystal-pool`

The app models meaning fragments as phase-changing nodes:

- `CrystalNode`: fragment, concept, meme, or crystallized meaning.
- `CrystalEdge`: typed weighted relationship between nodes.
- `PhaseEvent`: recorded phase transition, the engineering trace of 机.
- `ha`: anti-dogma annealing signal that softens over-hard crystallization.
- `Hakimi`: anti-fossilization UX assistant.

Current local URL:

`http://localhost:3001`

## 2. Implemented MVP Features

- Next.js App Router, TypeScript, Tailwind, Prisma, SQLite.
- Prisma schema and migration for:
  - `CrystalNode`
  - `CrystalEdge`
  - `Tag`
  - `NodeTag`
  - `PhaseEvent`
- Seed data with 9 core crystal nodes and 8 sample edges.
- Deterministic scoring engine:
  - connection count and relation weight
  - emotion vector
  - phase promotion events
  - isolation and boredom decay
  - fossil/dissolved penalties
  - `ha` as softening/resilience, not simple score inflation
- Node CRUD:
  - create
  - edit
  - delete
  - detail view
  - tags
  - emotion sliders
  - source metadata
- Edge CRUD:
  - create
  - update relation and weight
  - delete
- Phase actions:
  - promote to seed
  - crystallize
  - fossilize
  - dissolve
  - ha soften
  - phase history recorded as `PhaseEvent`
- Pool Surface dashboard:
  - strongest crystals
  - new seeds
  - dissolving/fossilizing nodes
  - ha feed
  - phase map
  - Hakimi watch panel
- Graph page:
  - responsive SVG graph
  - node size reflects score
  - edge thickness reflects weight
  - edge label reflects relation
- Import page:
  - paste long conversation residue
  - deterministic fragment splitting
  - preview selected candidates
  - seed marker detection
  - ha marker detection
  - selected import into pool
- Project memory:
  - `README.md`
  - `AGENTS.md`
  - `.agents/skills/crystal-pool/SKILL.md`
- Tests:
  - crystallization scoring
  - phase transitions
  - import parsing
  - Hakimi suggestions

## 3. Verified Commands

These passed locally:

```bash
npm run db:migrate
npm run db:seed
npm run db:print
npm run lint
npm test
npx tsc --noEmit --incremental false
npm run build
```

Browser smoke test also passed:

- dashboard renders seeded state
- node create/edit/delete works
- edge create/update/delete works
- phase transition creates history
- graph page renders SVG
- import preview detects `seed` and `ha`
- mobile dashboard and import page are usable

## 4. Known Technical Decisions

- Prisma is pinned to `6.19.3`.
- Prisma `7.8.0` was initially tried, but local SQLite migration commands produced an empty schema engine error in this environment.
- The project uses `prisma-client-js` and classic Prisma SQLite workflow for stability.
- `db:migrate` uses `prisma migrate deploy` against the checked-in migration.
- `.env.example` exists with:

```bash
DATABASE_URL="file:./dev.db"
```

## 5. Known Gaps and Risks

- No authentication. This is intentional for MVP.
- No external AI, embeddings, RAG, or semantic search. Intentional for MVP.
- Server actions use multiple writes. They work, but important mutations should eventually be wrapped in `prisma.$transaction`.
- Node deletion is hard delete. This removes node history through cascade. If phase history should be preserved forever, switch to soft delete or archive.
- Graph layout is simple deterministic SVG. It is readable enough for MVP, but not yet a strong graph-exploration interface.
- Import splitting is deterministic and simple. It does not yet support dedupe, merge review, confidence scoring, or batch tagging.
- Validation errors currently fail server-side rather than showing polished inline form errors.
- There is no search, filtering, or sorting UI beyond the dashboard sections.
- There is no export/import backup format yet.
- There is no persistent audit log beyond phase events.

## 6. Recommended Next Step Options

### Option A: Product Hardening First

Best if the goal is to keep the MVP stable and usable.

Tasks:

- Wrap multi-write server actions in transactions.
- Add soft delete/archive for nodes instead of hard delete.
- Add inline form validation errors.
- Add filters/search on `/nodes`.
- Add basic Playwright browser tests for main workflows.
- Add backup/export to JSON.

Why:

This makes Crystal Pool trustworthy as a daily local tool.

### Option B: Meaning Engine First

Best if the goal is to deepen the core concept.

Tasks:

- Improve scoring explanation UI with a score breakdown.
- Add suggested phase changes without auto-applying them.
- Add relation suggestions using local keyword overlap.
- Add duplicate/resonance detection in import flow.
- Add node merge and split workflows.
- Add “why this crystallized” timeline.

Why:

This makes the project feel less like CRUD and more like a meaning crystallization engine.

### Option C: Graph and Pool Experience First

Best if the goal is to make the browser experience feel alive.

Tasks:

- Replace simple SVG layout with a better interactive graph.
- Add relation filters and phase filters.
- Add graph hover/detail panels.
- Add pool surface density and phase visual language.
- Add local animations for phase transitions.
- Add a better Hakimi panel with actionable suggestions.

Why:

This makes the product visually and experientially distinct.

### Option D: Optional AI Layer

Best if the goal is to move toward semantic assistance.

Tasks:

- Create an AI provider interface.
- Add feature flag `ENABLE_AI_SUGGESTIONS`.
- Keep local keyword fallback.
- Suggest edges but never auto-create them.
- Add tests for fallback behavior.
- Add UI for accepting/rejecting suggestions.

Why:

This lets AI propose resonance while keeping the user in control of crystallization.

## 7. My Recommended Roadmap

1. Hardening pass:
   - transactions
   - soft delete/archive
   - form validation UX
   - search/filter
   - JSON backup/export

2. Meaning engine pass:
   - score breakdown UI
   - phase suggestion engine
   - import dedupe
   - node merge/split

3. Graph experience pass:
   - interactive graph
   - filters
   - hover panels
   - better visual phase grammar

4. Optional AI pass:
   - provider interface
   - local fallback
   - edge suggestions
   - approval workflow

5. Hakimi pass:
   - stronger anti-fossilization heuristics
   - playful but non-disruptive suggestions
   - one-click ha-soften flows

## 8. Prompt to Ask Pro

```text
I have a working MVP called Crystal Pool.

It is a local-first Next.js + TypeScript + Prisma + SQLite app for collecting text fragments and evolving them into a meaning crystallization pool.

Implemented:
- CrystalNode, CrystalEdge, Tag, NodeTag, PhaseEvent models
- deterministic crystallization scoring
- phases: gas, liquid, seed, crystal, fossil, dissolved
- edge relations: resonates_with, contradicts, triggers, derives_from, hardens_into, dissolves_into, ha_softens
- node CRUD
- edge CRUD
- phase transition events
- ha-softening
- dashboard / pool surface
- graph page
- bulk import preview/import
- Hakimi anti-fossilization panel
- seed data and tests

Verified:
- npm run db:migrate
- npm run db:seed
- npm run db:print
- npm run lint
- npm test
- npm run build
- browser smoke test for create/edit/delete, edge update, phase history, graph, import preview

Known gaps:
- no auth
- no AI yet
- no search/filter
- hard delete removes history
- multi-write actions should be transactional
- graph is simple SVG
- import parser is deterministic but basic
- no JSON backup/export
- no score breakdown UI

Question:
What should the next engineering phase be?

Please choose a priority order among:
1. hardening and reliability
2. deeper meaning/scoring engine
3. better graph/pool UX
4. optional AI suggestions
5. Hakimi anti-fossilization layer

Then propose 5 to 10 narrow, testable engineering tasks with Goal / Context / Constraints / Done when.
```

