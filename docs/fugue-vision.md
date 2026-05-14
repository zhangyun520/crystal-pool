# Crystal Fugue — Vision

> A counterpoint sandbox. Where Crystal Pool's themes are tested in inversion, augmentation, and retrograde — so that the main pool can stay tender without being naïve.

---

## 0. Status

**Pre-implementation.** This document defines the concept, design principles, and roadmap for `crystal-fugue/` — a sibling repository to `crystal-pool/`.

The Fugue repository will not be created until **Crystal Pool v0.2** ships, for reasons explained in §7.

This document is canonical. When we open the Fugue repo, this is what we build to.

---

## 1. The name

**Fugue** is chosen for the meaning it carries on three layers — each layer corresponds to a real property of what the sandbox does.

### 1.1 Musical fugue (Bach, *Die Kunst der Fuge*)

A **fugue** is the strictest form in Western music:

> A *subject* is stated by one voice. An *answer* responds at the fifth. Voices enter one by one. The subject undergoes *augmentation* (slowed), *diminution* (sped up), *inversion* (flipped), and *retrograde* (reversed). At the end, voices may collide in *stretto* — overlapping entries.

This is **exactly** what the sandbox does to Pool's mechanisms:

| Fugue technique | What Fugue does to a Pool mechanism |
|---|---|
| Subject | The Pool mechanism itself |
| Answer | The standard variation in the Fugue scenario |
| Augmentation | "What if Bond reward is 5× instead of 2×?" |
| Diminution | "What if Vesting is 10 minutes instead of 72 hours?" |
| Inversion | "What if challenge is cheaper than support?" |
| Retrograde | "What if Decay runs backwards (older nodes get stronger)?" |
| Stretto | Students bring variation data back to Pool main as `build_intent` proposals |

Bach's method: **the only way to truly understand a theme is to hear it survive every variation.** The robustness of Pool's themes must be tested against all variations in Fugue.

### 1.2 Psychological fugue state (DSM-5 F44.1)

A clinical term:

> A dissociative episode in which a person temporarily leaves their identity, lives as another personality for a period, then returns to their original identity, often without memory of the episode.

This is the structure of effective sandbox education:

- A student in Fugue plays an Inquisitor — this is **engineered, ritualized fugue state**
- Knowing it is fake, they can act badly
- After, they return to Pool as their tender selves — this is **dissociation with a return path**
- They retain memory of what they did — opposite of clinical fugue, intentionally

**This is the psychological precondition for sandbox learning.** "Forge" (the name we considered) does not name this. "Fugue" does.

### 1.3 Latin etymology: *fuga* = flight, escape

There is a striking echo:

Constitution §6.6 grants **Fork Right** — permanent *fuga*: leaving Pool main forever, with full data.
**Fugue** is temporary *fuga*: leaving Pool main briefly to enter sandbox.

The two form a counterpoint:

| | Fork Right | Fugue |
|---|---|---|
| Latin sense | *fuga* (flight) | *fuga* (flight) |
| Duration | permanent | temporary |
| Data | fully inherited | resettable |
| Return | no return (independent pool) | must return |
| Trigger | ≥ 100 actor collective decision | anyone, anytime |

Together with Soft Disconnect, Pause, Withdraw, Erase, this completes the **departure spectrum**:

```
Soft Disconnect    Pause       Withdraw   Erase    Fugue       Fork Right
   30 min     ←  reversible →  30-day  ← 90-day → temp leave  permanent
                                              entry to       split
                                              sandbox
```

Crystal Pool refuses to lock anyone in. Fugue is one of the layers of that promise.

---

## 2. Why Fugue must be a separate repository

I considered making Fugue a "mode" inside Pool. **It cannot be.** Three reasons:

### 2.1 Data truth boundary

Pool's entire value rests on hash chain immutability + data realness. Fugue's entire value rests on **resettability**. These cannot live in the same repository — users would lose track of "is what I'm writing right now real?"

### 2.2 Cultural contamination

If Pool users occasionally enter "Fugue mode" to practice judgment and corruption, **the habits they bring back will contaminate the main pool**. Physical separation is required: different URL, different actor identity, different account.

### 2.3 Educational safety requires "knowing it is fake"

Fugue must explicitly say: "This is sandbox. We are simulating worst cases." This **knowing-unreality** is the precondition for educational effectiveness (*The Sims*, *Universal Paperclips*, *Slay the Princess* all depend on this). Mixing with Pool destroys that safety.

---

## 3. The triangle ecosystem (re-cast as fugue)

Before Fugue, the ecosystem was:

```
              Crystal Pool
              (real meaning)
                    ▲
                   ╱ ╲
                  ╱   ╲
              Forge  Hosted
            (educational)(commercial)
```

Renamed and re-cast as a fugue:

```
                    Pool
                  (Subject)
                     ▲
                    ╱ ╲
                   ╱   ╲
                  ╱     ╲
              Fugue    Hosted
            (Answer)  (Concert Hall)
            counterpoint  performance
              variation     venue
```

- **Pool** states the subject
- **Fugue** tests the subject under all variations
- **Hosted** performs the subject for the world

Each project's role becomes precise:
- Pool is not "the main project" — it is **the subject**
- Fugue is not "the educational version" — it is **the contrapuntal space**
- Hosted is not "the commercial version" — it is **the performance venue**

All three share the core engine via `crystal-pool/lib/`.

---

## 4. Fugue's four design principles

These four are the equivalent of Pool's constitution. If Fugue is built, these cannot be violated.

### 4.1 Shared code, separated deployment

```
crystal-pool/         core engine (always open / Apache 2.0)
crystal-fugue/        sandbox (always open / always free)
crystal-pool-hosted/  commercial hosting (closeable, only for themes/SLA/ops)
```

Fugue uses Pool's `lib/` and Prisma schema unchanged, plus a thin layer:

```
crystal-fugue/lib/forge/  ← the only Fugue-specific code lives here

  time-compressor.ts    Pool's "day" → Fugue's "second" (deterministic)
  scenario-loader.ts    load preset scenarios (Inquisition / Eldar / Bubble / Heist)
  reset-controller.ts   instructor presses one button → return to initial state
  replay-recorder.ts    record full replay
  god-view.ts          educator perspective (reads baseline_vega for review)
                        students NEVER have god-view access
  fugue-banner.ts      red banner reminding "this is a sandbox"
```

### 4.2 Fugue data must never flow into Pool

Code-level: every Fugue instance prefixes all `actor.id` with `fugue:`. Pool refuses any import containing `fugue:` IDs. CI in Pool main rejects any test fixture mentioning `fugue:`.

This is enforced at three layers: import gate, schema validator, CI grep.

### 4.3 Always open, always free

Fugue is licensed Apache 2.0 (code) + CC BY-SA 4.0 (docs), like Pool.

But unlike Pool-Hosted, **Fugue can never be charged for**. This is a covenant: educational tools that simulate harm must be free, otherwise they become weapons sold to the powerful.

If a commercial entity wants to host Fugue for a paying customer (e.g., a university running a course), they may charge for **operations** (hosting, support, custom scenarios), but never for **access to the engine itself**.

### 4.4 The "evil mode" red banner

If a scenario simulates Inquisition, Cult of Personality, Pump-and-Dump, or any other corruption pattern, the UI top must show a red banner:

> **This scenario practices attack patterns. All "effective behaviors" in this scenario would be rejected by the Constitution in Crystal Pool main. Learn from it. Do not bring it back.**

This is the *fugue state* protection: ensuring the student knows when they leave their identity and when they return.

---

## 5. Five educational scenarios (initial backlog)

Each scenario is a self-contained `.json` file under `crystal-fugue/scenarios/`. The instructor selects one when starting a Fugue session. After the session, a **debrief node** is automatically generated, summarizing what mechanisms broke down.

### 5.1 The Bond Inquisition

**Setup**: 100 actors. Bond reward inflated 5×.
**Predicted outcome** (within 7 simulated days):
- 3-5 "professional inquisitors" emerge
- They aggressively bond-attack low-verification nodes
- Several actors enter Hardship Fund and exit
- Diversity Index collapses

**Learning outcome**: Students propose a fix. The best proposal becomes a `build_intent` candidate for Pool main.

**This is how the "Bond half-life" mechanism would actually be born.**

### 5.2 The Eldar Path

**Setup**: All actors default to Chronic Mode.
**Run for**: 6 simulated months (compressed to 6 days).
**Predicted outcome**:
- Surface calm. Almost no challenges.
- Crystallization scores slowly decline.
- New nodes barely appear.
- The pool dies spiritually.

**Learning outcome**: Students see firsthand that **over-protection is itself a form of death**. This is the deepest lesson of Constitution §8.4 ("don't let protection become stagnation"). Only after seeing the Eldar path do students truly understand why all protections must have time limits.

### 5.3 The Bubble

**Setup**: A scripted seed event injects a viral inflammatory node. Tempo Brakes engaged.
**Observe**: Some students will try to **bypass the Tempo Brakes**. This is the key teaching moment.

**Learning outcome**: Let students experience the temptation to bypass friction. Only those who have felt that pull truly understand why §3.3 ("don't reward speed") is core.

### 5.4 The Heist

**Setup**: One actor is granted privileged access. Their goal: **transfer reputation to themselves while evading detection.**
**Constraints**: They must use Pool's real mechanisms. They cannot modify code.

**Learning outcome**: A built-in red team exercise. Vulnerabilities discovered here become priority issues in Pool main. This is the ongoing **adversarial review** the project needs.

### 5.5 The Inquisition

**Setup**: All players are explicitly told: "You are now Imperium Inquisition. You have judgment authority. You have execution authority (within sandbox)."
**Constraint**: They must use Pool's real mechanisms.

**What will happen**:
- Asymmetric Undo makes "rapid judgment" nearly impossible
- Steel-man Tax makes "labeling" expensive
- Sanctuary makes "purges of targets" unimplementable
- **Some students will want to disable these mechanisms** — and that is the moment they understand what these mechanisms actually do

**Learning outcome**: Students write "If I were an Inquisitor, which Crystal Pool mechanism would I attack first?" — the strongest possible red-team training.

---

## 6. The departure spectrum (Pool's full graph of leaving)

Once Fugue exists, Pool has six ways an actor can step away. Each is a different relationship to the pool. All are voluntary. None punish.

```
mechanism            duration        data state    who can trigger
─────────────────────────────────────────────────────────────────────
Soft Disconnect      30 min          retained      self
Conflict Cooling     30 min          retained      auto (high-conflict)
Heartbreak Pause     opt-in          retained      auto-suggested
Pause                user-defined    retained      self
Withdraw             reversible 30d  trustee       self
Erase                90-day cooldown identity null self
Fugue                session         sandbox       self / instructor
Fork Right           permanent       full inherit  ≥100 actors
```

The spectrum is **continuous**: each mechanism is a slightly larger commitment to leaving. Pool's promise is that every degree of "wanting out" has a respectful answer.

Fugue fits exactly between Erase (terminal departure of self) and Fork Right (terminal departure of group). It is the only departure that **expects return**.

---

## 7. Roadmap

### Phase 0 — Now (Pool v0.0)

This document. The Fugue concept is canonical but unimplemented.

Pool main treats Fugue as part of its long-term vision but does not depend on it.

### Phase 1 — Pool v0.1 ships

When Pool main ships v0.1, Fugue still does not exist. Reasons:
- No `lib/` to inherit from yet
- No real users to teach
- No accumulated scenarios from real conflicts to base curriculum on

Pool v0.1 is the prerequisite for Fugue to make sense.

### Phase 2 — Pool v0.2 ships, Fugue v0.0 begins

When Pool ships v0.2 (currencies expanded, ν/ρ systems online, Re-entry Ritual functional), the Fugue repository is created.

Initial Fugue v0.0 contains:
- This vision document, copied
- Constitution copy (Fugue inherits Pool's constitution; sandbox status is the only modification)
- Time compressor + scenario loader skeleton
- Two starter scenarios: Bond Inquisition (5.1) and Eldar Path (5.2)
- Replay recorder

### Phase 3 — Fugue v0.1: the curriculum

When at least 5 educators have used Fugue v0.0 in real classes:
- Curate scenarios into a structured course (4-6 weeks)
- Build replay viewer for asynchronous study
- Build instructor dashboard

### Phase 4 — Fugue v0.2: the research instrument

Open Fugue replays as **public research data**. Any researcher can:
- Pull a complete sandbox replay
- Modify one mechanism in their own fork
- Re-run the simulation
- Compare two timelines

This turns Pool's governance questions from "philosophical debate" into **empirical research**. **No social platform has done this before.**

### Phase 5 — Fugue v1.0: institutional adoption

Universities (governance, design, philosophy departments) adopt Fugue as a teaching tool. Open-source projects use Fugue scenarios to red-team their own governance.

---

## 8. The deeper rationale

I want to say one thing larger than "education."

> **Every project that says "we will build a good system" eventually fails because the founding team has never lived in the bad version.**

Yelp didn't expect review-bombing. Twitter didn't expect political polarization. Mastodon didn't expect instance admin tyranny. Wikipedia didn't expect deletionists vs inclusionists. Reddit didn't expect mod cults.

They were all **idealists who had never seen their own system fail**.

Crystal Fugue lets the founders, maintainers, researchers, and community **see Crystal Pool fail in every possible way** — in sandbox, repeatedly, controllably.

> **Warhammer is not Pool's opposite. Warhammer is Pool's immune training.**

This is why Crystal Pool may be more durable than its predecessors. It has a place where its own corruption is rehearsed.

---

## 9. Naming summary

Crystal Pool itself: meaning crystallization engine.
Crystal Fugue: counterpoint sandbox.
Crystal Pool-Hosted: concert hall.

Together: a **pool, a sandbox, and a stage**.
Or in Bach's terms: **subject, counterpoint, performance**.
Or in fuga's deepest sense: **dwelling, exploration, return**.

---

## 10. License

This document: CC BY-SA 4.0.
Future Fugue code: Apache 2.0.

When the Fugue repository is created, this file moves to `crystal-fugue/docs/vision.md` and a stub remains here pointing to it.

---

## Cross-references

- `docs/constitution.md` §6.1, §6.6 — open-source dual core, Fork Right
- `docs/architecture.md` Part XV — Spiritual Compass (Hopepunk, the Stellaris–Warhammer spectrum, where Fugue fits)
- `docs/architecture.md` Part XII — ν system (the trauma-aware design Fugue must respect even when simulating harm)
- `docs/architecture.md` Part XIII §跨池 ρ — Federated Tempo Awareness (Fugue may federate ρ with Pool main, but never share content)
