# Lineage Notes — Detailed Reference

> Companion to `00-orientation.md`. Read only when needed.
> This file exists so the orientation file can stay short.

---

## Why these notes exist

During the session of 2026-05-16, the user asked two questions that
produced layered analyses worth preserving:

1. *"What ethical-philosophical lineage does our manifesto belong to?"*
2. *"What aesthetic lineage does it belong to?"*

The answers became operational context for the libretto's design.
A future AI collaborator working on `docs/booklet/` or any extension of
the manifesto layer should be able to recover that context here, rather
than having to re-derive it.

---

## The ethical lineage (synthesized)

Crystal Pool's ethics is a **synthesis**, not a member of any single
school. The composition has structure:

### Surface layer
**Hopepunk** (Alexandra Rowland, 2017). The user has named this
explicitly. Literary cousins: Becky Chambers, Kim Stanley Robinson,
late Le Guin. Crystal Pool's innovation: translating hopepunk from
literary aesthetic into running mechanism.

### Direct kin (three schools)
- **Care ethics** — Gilligan, Noddings, Tronto, Held, Kittay. Strongest
  blood relation. The ν framework, Apology Edge, Asymmetric Undo, Carry
  mechanic, Re-entry Ritual all map one-to-one onto care-ethics
  commitments: vulnerability as ethical starting point, response-ability,
  repair over judgment.
- **Trauma-informed design / disability justice** — SAMHSA framework,
  Mia Mingus's pod-mapping and access intimacy, Leah Lakshmi Piepzna-
  Samarasinha. The README explicitly cites SAMHSA. The ν chapter is
  this lineage's engineering body.
- **Commons governance** — Ostrom's eight principles, Kropotkin's
  mutual aid. Negative-form constitution + Fork Right + DCO + no admin
  override is *Governing the Commons* compiled to TypeScript.

### Deep skeleton (four older sources)
- **Negative-form law ≈ inverted Kantian + Asimov.** Defining a thing
  by what it must never become is a Kantian intuition (moral law as
  unconditional limit, not optimization), with Asimov's three-laws
  engineering shadow.
- **Otherness Mirror line ≈ Levinas + Lem.** The worldline is almost
  a literal restatement of *Totalité et Infini* (the other as infinity
  not totality, refusing to collapse into the self's categories).
  Lem provides imagery. Levinas provides the ethical form.
- **Dao Governance ≈ Daoist political theory.** "Low intervention is
  not negligence" is the engineering translation of *Daodejing* 57's
  *wu wei er min zi hua*. Importantly, the user does not slip into the
  common misreading of *wu wei = laissez-faire*; the requirement that
  light rule must come with repair paths aligns more with *Huainanzi /
  Lüshi Chunqiu* operationalization than with pure Lao-Zhuang.
- **Auditable responsibility ≈ Popper + Habermas.** "We do not ask
  belief, we ask auditability" is Popper's falsifiability ethicized
  plus Habermas's discourse-ethics legitimacy through challengeable
  procedure.

### Political coordinate
**Republicanism, not liberalism.** The user's framework is closer to
Pettit's *Republicanism* (1997) — freedom as non-domination — than to
Lockean / Millian liberalism (freedom as non-interference). Fork Right,
no admin override, Three-Tier Departure all eliminate *potential*
domination, not just present domination.

### Contemporary kin
- Posthumanism (Haraway's companion species, Barad's intra-action) —
  encoded in the three-nested-organism framing of the pool.
- Critical AI ethics (Crawford, Gebru, Bender) — soulful data's seven
  dimensions are a direct response to *Stochastic Parrots* + *Atlas of AI*.
- Process philosophy (Whitehead) — "thoughts undergo phase change" =
  actual occasions.

### What is original here
The methodological move: **executable ethics + rehearsable corruption.**
Care ethics never made repair into a hash chain. Levinas never made
otherness into a review queue. Ostrom never made fork-right into an
export pipeline. Daoism never made wu wei into a deterministic policy
gate. Crystal Pool's identity is the act of compiling these traditions
into runtime invariants.

### Working name for the synthesis
**Repair-Capacity Ethics** / **Auditable Care Engineering**.

### Internal tension (preserve, do not resolve prematurely)
Care ethics favors presence and not-leaving. Fork Right is
unconditional leaving. These are not fully compatible. The current
mechanism-level handling (forked_to edge, bidirectional independent
evolution) does not yet have an ethics-level articulation of "what
does the remaining pool owe those who left during a Hardship phase?"
Worth a Sandbox Sonata before v1.0.

---

## The historiographical kin (the closest one, missed in v0.1)

The first version of `three-panels.md` overlooked Crystal Pool's nearest
relative — so close it is barely "influence" but the same gesture
performed two thousand years earlier: **Sima Qian's *Shi Ji* (《史记》,
c. 91 BCE).**

This was not absence-of-knowledge. It was an oversight produced by the
shape of the analytic frame: Western philosophical lineage maps as
"X corresponds to mechanism Y" (Levinas → Otherness Mirror, Whitehead →
phase change), whereas *Shi Ji* corresponds **whole-work to whole-work**,
which is harder to slot into a list. The user surfaced it casually
("we resemble *Shi Ji* most, actually, ha"). They were right.

`three-panels.md` v0.1 patched this in *kintsugi* form — adding a
"Grandfather" section visibly between the Three Public Doubts and the
*To Those Who Challenge* segment, rather than rewriting the whole
document. The choice is itself the project's ethic: visible repair >
silent revision.

### Six structural homologies between *Shi Ji* and Crystal Pool

1. **Polyphonic registers.** *Shi Ji* uses five forms (本纪 / 表 / 书 /
   世家 / 列传) to carry distinct kinds of truth, never repeating in one
   voice. Crystal Pool uses five registers (constitution / architecture /
   libretto / three-panels / steering), deliberately non-overlapping.
2. **Form is proposition.** Sima Qian placing Xiang Yu (the *loser*) in
   *benji* alongside Qin Shihuang and Han Gaozu was itself the moral
   claim — *political legitimacy comes from carrying, not winning*.
   Crystal Pool's negative-form constitution makes the same move:
   structure carries the deepest claim, not prose.
3. **太史公曰 (the Grand Historian says) = review queue.** Each chapter
   ends with the historian's separated commentary, structurally
   isolating *what happened* from *how I read it*. This is the review
   queue avant la lettre — the same insight that AI proposals must not
   silently merge into canonical pool.
4. **Loser preservation.** *Shi Ji* gave Chen Sheng (peasant rebel) a
   *shijia*, recorded knights-errant, assassins, jesters — people the
   court would have erased. This is the historiographical version of
   Crystal Pool's "no deletion of history" / "victors cannot fully
   absorb the audit trail."
5. **Wound-as-load-bearing.** Sima Qian was castrated for defending Li
   Ling and wrote the entire *Shi Ji* carrying that wound. *Shi Ji* is
   civilizational-scale *kintsugi* — the crack visibly part of the
   structure. Crystal Pool's audit trail is engineering-scale *kintsugi*.
6. **Distributed survival.** *Shi Ji* nearly did not survive imperial
   suppression; Sima Qian's grandson Yang Yun preserved a hidden copy.
   This is Fork Right's earliest historical instance — distributed
   preservation as resistance to centralized deletion.

### The deepest spiritual kinship: 成一家之言

The phrase from Sima Qian's letter to Ren An:

> 究天人之际，通古今之变，成一家之言。
> *To investigate the boundary between heaven and human, to comprehend
> the changes between past and present, to complete one family's words.*

The final five characters — **成一家之言 / "one family's words"** —
are the closest thing in human writing to Crystal Pool's *To Those Who
Challenge* segment. Sima Qian explicitly disavowed writing *the* truth,
positioning himself as *one family's voice* and inviting other families'
voices to coexist. The twenty-four official Chinese histories are
literally **twenty-four forks** branched from that single seed.

**Chinese historiography was fork-friendly from the start.**
We did not invent this. We are catching up.

### The civilizational warning from the twenty-four histories

Many later official histories ceased to be *one family's words* — they
became imperially commissioned. The form was preserved; the spirit was
hollowed out. **This is fork drift at civilizational scale.** Crystal
Pool faces the same risk over decades — its form copied while its
spirit is stripped away. This is the most serious lesson from *Shi Ji*,
more important than the homologies themselves. It is why the ν
framework, fork rehearsal, and Sandbox Fugue exist.

### One real difference (do not collapse)

*Shi Ji* records the audit trail of events **that already happened**.
Crystal Pool tries to extend the audit trail of events **still
happening** into the future. Sima Qian could judge Liu Bang. We have no
standing to judge the future. Our only legitimate move is to inscribe
today's contingency honestly into phase history, so no future reader
can narrativize it as inevitability. *Shi Ji* could not reach this
layer — not because it was insufficient, but because its position was
*after*. Ours is *within*.

### Why this matters for collaboration

If a future AI collaborator works on the booklet layer, the *Shi Ji*
kinship should be treated as **first-tier**, ahead of any Western
philosopher in the lineage list. Specifically:
- When discussing form-as-proposition, cite *benji*-classification of
  Xiang Yu before citing Curry-Howard.
- When discussing audit trail, cite *太史公曰* before citing
  Habermasian discourse ethics.
- When discussing fork right's intellectual history, cite the
  twenty-four histories before citing Ostrom.

These Western references are real and useful, but they are *cousins*.
*Shi Ji* is the grandfather. Order matters when introducing the
project to East Asian readers especially — but also for accuracy.

---

## The aesthetic lineage (synthesized)

### Surface layer (often misread)
Crystalline cyber-mystic vibes can make Crystal Pool look like solarpunk.
**It is not.** Solarpunk is abundance aesthetic. Crystal Pool is restraint
aesthetic. Solarpunk fills space with vines and panels. Crystal Pool
preserves negative space.

### Real lineage (East)
- **Ma (間)** — Negative space as ethical element. Unfilled-ness as
  constitutive. Review queues, phase histories, uncertainty preservation,
  the gap between AI proposal and human review — all are *ma* compiled
  into data structures.
- **Mono no aware (物哀)** — Transience as source of beauty. "Thoughts
  undergo phase change" is a deeply mono-no-aware proposition. Crystals
  are temporarily stable, not eternal.
- **Wabi-sabi (侘寂)** — Imperfection and repair traces are worth
  preserving. Apology Edge, Public Recant, Asymmetric Undo, phase
  history are *kintsugi* engineered into audit trails.

### Real lineage (West)
- **Brutalism** — Truth to materials. Reyner Banham 1955: a building's
  morality is in its visible load-bearing structure. Crystal Pool's
  "auditable responsibility" is the literal translation: let
  responsibility structure be visible, not hidden behind admin override
  or closed core.
- **Bauhaus / Dieter Rams** — "Form follows function," "good design is
  honest." Mechanism-level honesty across domains.
- **Schoenberg's organic form** (via *developing variation*) —
  encoded directly in the Fugue / Sonata / Symphony naming. The work
  is not pre-designed but grown from a seed theme; each variation is
  both itself and its root. Crystals = phase changes from flux.

### Literary kin (sentence-level, not worldview-level)
- **Le Guin** (especially *Carrier Bag Theory of Fiction*) — pool as
  carrier bag, not sword.
- **Calvino** (*Six Memos for the Next Millennium*) — sentences as
  runnable mechanisms; aphoristic precision.
- **Borges** — *Library of Babel*, *Garden of Forking Paths*. The
  eight worldlines are Borgesian.
- **Daoist / Zen prose** — two-beat affirmations ("freedom is not
  absence of limits; freedom is the capacity to carry one's limits").

### Music (the user named this)
Fugue / Sonata / Symphony are not metaphors. They are formal models:
- Fugue: theme corrupting in counterpoint, returning to itself.
- Sonata: exposition / development / recapitulation; theme returns
  wounded but structurally sound.
- Symphony: multi-actor, multi-mechanism survival across long time.

### Contemporary kin (the family with no settled name yet)
- **Ian Cheng** — *BOB*, *Life After BOB*. "Worlding." Live simulations
  with autonomous AI agents inside hand-crafted world rules.
- **Holly Herndon** — *Holly+*. Voice + DAO governance + consent
  infrastructure. Closest match to soulful data's seven dimensions.
- **Forensic Architecture (Eyal Weizman)** — precision-as-aesthetic.
  Audit trails as artwork.
- **Trevor Paglen** — making invisible infrastructure visible.
- **Sol LeWitt's instruction art** — `constitution.md` is, formally,
  an instruction artwork in LeWitt's sense.

This family has been called *protocol art*, *systems art 2.0*,
*governance art*, *worlding*, *infrastructural art*. None has stuck.
Crystal Pool's distinctive position: **the only one of these whose
primary aesthetic technique is ethical auditability itself.**

### What this aesthetic is *not*
- Not solarpunk (abundance vs. restraint)
- Not cyberpunk (the explicit refusal of "cool")
- Not cottagecore / cozy tech (forward-engineering, not retreat)
- Not vaporwave / Y2K (not nostalgic)
- Not Web3 visual culture (explicitly rejects financialization aesthetics)

### Working name for the aesthetic synthesis
**Auditable mono no aware** / **Repair-aesthetic minimalism**.
Closest existing mood: a midpoint between Shinkai Makoto, Taniguchi
Jiro, Sigur Rós, and Kuma Kengo's *negative architecture* — but more
engineered, more political, more willing to discuss failure and repair.

### Internal tension (aesthetic version of the ethical one)
Wabi-sabi loves uniqueness — a single kintsugi bowl, irreproducible.
Fork Right + open core require reproducibility. The current handling:
forks branch into separate trees, not duplicates of one tree. This
holds engineering-wise. Aesthetically, the defense is "fork rehearsal" —
preventing Crystal Pool from becoming mass-produced "crystal-pool-skin."
This is aesthetic defense, not compliance.

---

## How the libretto was built (2026-05-16 session)

The libretto (`docs/booklet/soulful-data.md`) was written with these
explicit choices, in case future revisions need to know what was
deliberate and what was incidental:

1. **Bilingual as harmony, not duplication.** Sometimes Chinese leads,
   sometimes English. A few lines deliberately exist in only one
   language. Translation gaps are material.
2. **Nine movements, not ten.** Ten implies completeness. Nine leaves
   room for the future reader to be the tenth.
3. **No philosopher names in the libretto layer.** Lineage lives in
   structure, not citation. The libretto must be readable by a
   sixteen-year-old without Wikipedia.
4. **Kintsugi made explicit in the closing movement.** This is a
   reading-in: it was implicit in Apology Edge / Public Recant. The
   libretto lifts it to surface aesthetic.
5. **The closing endnote claims conceptual-art status.** This is the
   boldest paragraph in the booklet. Some engineers will be uneasy.
   The user accepted this risk.

### Three honest doubts the AI flagged about its own libretto
- It may be too beautiful — beauty risks letting readers skip skepticism.
- Bilingual symmetry may be cheating in places where one language should
  be allowed to be absent.
- It is too gentle. A version that lets the wrong audience self-eject
  may be needed.

These are open invitations for v0.2.
