# Changelog

## 1.5.0 — 2026-08-25

The live director can finally see the obstacles it is planning around, and plus levels stop
claiming to be proved.

### Changed
- **`oLedger()` — the live director's obstacle arithmetic.** It plans in two numbers, how many
  cards still have to leave the board and how many draws it has to spend, and both counted
  every remaining tile as an ordinary card costing one match and taking one draw. Two obstacles
  break that: a plus tile clears **itself** and **pays the deck**, and a lock/key pair takes two
  tiles off for one tap and no draw. `dGoal()`, `dRunLen()` and `dReveal()`'s survival guard
  all read the ledger now. Measured at level start on a win target with `tv=2`:

  | level | goal was → now | draw budget was → now |
  |---|---|---|
  | L12 plus | 21 → **18** | 7 → **16** |
  | L7 lock & key | 11 → **9** | 7 → 7 |
  | L21 · L111 · L41 | unchanged | unchanged |

  Only the two levels carrying self-clearing tiles move; the other three are identical, which
  is the test that this is a correction and not a re-tuning. L12's goal being three too high is
  the same figure 1.3.0 measured before the revert. **The draw budget more than doubling is
  new** — the director was rationing draws it was about to be handed, and driving runs harder
  than the board needed. Some of the "clearing the deck in sequence" pressure was self-inflicted.

- **Plus levels take the live plan.** `PLUSTILES` joins `bends`. `exh()` and `allHit()` decide
  legality with a bare `cyc(rank[i],w)` rather than `slotTakes()`, so the prover holds a second
  copy of the matching rule that knows about no obstacle at all — on a plus level that is not a
  weaker proof but a proof about a **different game** (ISSUE-011). A false proof is the exact
  failure the project's headline number exists to catch, so coverage goes down and truth goes
  up. All five obstacle levels are now live-steered.

### Added
- **`docs/specs/brain_engine_spec.md`** — the validated, staged plan for giving both directors
  one shared model of the obstacles. Not implemented; this release only carries the document
  and its evidence.
- **`docs/measurements/brain-engine-validation.js`** — four validations, re-reading `cyc`,
  `WILD_RANK`, the memo key and the search caps out of `index.html` on every run so they cannot
  drift from what they describe. The load-bearing one: the proposed single `canMatch()` rule is
  an **exact no-op** on every level that reaches the prover today — 196 of 196 (rank, waste)
  pairs identical. That is what makes the first stage safe to start.

### Verification
Parse checks, and the per-level arithmetic above derived from the shipped level table.
**No harness suite was run** — a standing instruction on this branch — so nothing here claims
a band-adherence or accuracy figure. The obstacle work was confirmed in the browser by the
user during the session, not by the author.

## 1.4.0 — 2026-08-25

Two new obstacles, a colour-mix dial, and a rebuilt KPI panel. Also the release that
reconciles the changelog with the code: **1.2.0 and 1.3.0 are not in this build** — see the
note at the end.

### Added
- **Lock & Key** (D-013). A two-tile pair that clears itself when the player taps the key.
  Never matched against the head card, costs no deck card, and gates whatever sits under it.
  Modelled rankless — out of `SUP` like wild slots, out of `MATCHN` like plus tiles — and the
  partner search reproduces shipping's behaviour rather than the layout's intent: a tapped key
  takes the lowest-index eligible lock, which on multi-pair levels is not the nearest one for
  48% of keys. A pair collect clears the whole undo history, as shipping does, and counts as an
  available move so the demo cannot call a loss while a free two-card clear is in hand.
- **Up & Down** (D-014). An ordinary matchable card whose rank steps by one on every completed
  move — a match, a draw, a burnt draw, or spending a wild — on the closed thirteen-rank ring.
  Covered tiles are frozen, so a tile's clock starts when it is *revealed* and two tiles of the
  same direction drift apart permanently. The eligible set is captured before the move uncovers
  anything, because a tile revealed by this move does not step on it. `LV.pool` follows the
  face, so the live director's supply model stays truthful as the tiles walk.
- **Colour mix** (D-015). `BLACKP` sets the share of cards dealt black; slider in the toolbar,
  `setColorMix(p)` from the console. An economy dial, not decoration — the streak meter pays a
  bonus for five cards of one colour, so the mix decides how often that bonus can fire.
  **Hashed, not rolled**: `famBlack()` hashes rank, copy index and `RSEED`, which is read and
  never advanced, so colours vary between deals while every level still builds bit-identically.
  Measured 0.0 / 25.0 / 50.0 / 74.9 / 100.0 per cent black at 0 / .25 / .5 / .75 / 1.
- **KPI panel rebuilt** — CARD, DECK, PLAN, STREAK, MISTAKE, EXTRA CARDS. Two new run
  statistics: `CHAINMAX` (longest run of matches between draws) and `DENIALS`, which needed
  edge-detection because the denial condition existed only as a per-paint state. Both ride the
  undo snapshot. Off-plan and Forks leave the grid for the Level plan panel.
- **`FishCards`** and **`IncrementalCards`** importers, with the role inversion pinned
  (Value 1 is the KEY, Value 2 the LOCK) and warnings for an unbalanced level, an out-of-enum
  value, and a pair that blocks its own partner.
- **L7** and **L41** as built-in levels; built-ins are now L12, L21, L111, L7, L41 — one per
  obstacle.

### Fixed
- **Wild slot supply leak.** `reassignUnseen()` dealt a card to every hidden slot including
  wilds, which have no rank and never read one — the card was unavailable to the deck and to
  every other hidden slot, and the `pool.length` feasibility check over-demanded by one per
  hidden wild. `ecReveal()` had no exclusion at all and was leaking on the rescue path.
- **L111 never dealt a red double.** Suits came from `SU[usd[r]%4]` and `SU[0]` is the spade,
  while `usd[r]` is 0 for any rank the level has not used — which a double root almost always
  is. Subsumed by D-015.
- **Double roots** constrained to J, Q or K on all five paths that assign a rank. Exactly six
  double cards exist as art; any other root names a card that cannot be dealt.
- **Playable up/down cards had no highlight.** `.pc.udc` restates background and border and
  sits later in the sheet than `.pc.pl` at equal specificity, so the blue ring lost the
  cascade. Third face rule to trip on this; the comment now says so.
- Wild hover repainted the card face blue — border-only was expressed as an absence rather
  than a value, so `.pc.pl` and `.pc.clk:hover` kept painting underneath.
- Double-card ranks drifted sideways from negative `letter-spacing` on a single glyph.
- Select dropdown arrow inset off the pill radius; one height across the control bar and the
  board header, which also stops the header twitching when the ×2 badge appears; one type size
  across the header.

### Changed
- Every obstacle level takes the **live** plan. `bends` now covers wild, double, lock/key and
  up/down. The verified prover models none of them, and for up/down it cannot as written — a
  proof is a statement about fixed ranks, and that obstacle makes rank a function of the move
  number.
- Styled dropdown panels for the level and outcome selects, backed by the real `<select>` so
  every existing `.value` read and write keeps working.
- Validate all, Run bot and Rescue sweep hidden from the bar; functions and panels untouched.

### Not fixed — and reopened
`index.html` was reverted to 1.1.1 during this branch, which rolled **1.2.0 and 1.3.0 out of
the build**. Their changelog entries and the FIXED statuses in `docs/KNOWN_ISSUES.md` describe
code that is not here. Verified directly against current source:

- **ISSUE-011** — `exh()` and `allHit()` still have no `isPlusCard` guard, and there is no
  `plusClose()`. L12 is not gated to live, so its "proofs" describe a game in which the player
  spends matches on plus tiles. VERIFIED.
- **ISSUE-012** — `allHit()` sets `unsound` twice and never reads it. VERIFIED.
- **ISSUE-014** — `reset()` restores rank, LB, deck, pool and usd, but not `tv`, `band` or
  `tgt`. VERIFIED.
- ISSUE-002, ISSUE-005, ISSUE-013, ISSUE-015 were also fixed in the reverted range. INFERRED
  from the revert, not re-read line by line.

The version jumps 1.1.1 → 1.4.0 rather than reusing 1.2.0: those numbers were published and
reusing them would make two different builds share one label. The gap is the record.

### Verification
Parse checks and targeted arithmetic only. **The harness suites were not run** — a standing
instruction on this branch — so no suite number in this entry is claimed, and none of the
obstacle work has been exercised in a browser by the author. Everything above is VERIFIED
against source or LIVE-confirmed by the user in the demo, never both assumed.


## 1.3.0 — 2026-08-25

Six issues closed. The verified director now has **zero failures** across every pair it
proves — and it proves three fewer, because three of them were never really proofs.

### Fixed
- **ISSUE-011** (HIGH) — `exh()` and `allHit()` had no `isPlusCard` guard, so the verifier
  explored lines where the player *plays* a plus tile, spending a match on it and taking its
  rank onto the waste, and never modelled the free self-clear. On any level with tiles the
  proof described a different game. Both now refuse tiles as `legals()` does, and
  `plusClose()` closes the cleared set over them — `plusSweep()`'s rule on the mask,
  idempotent, no new memo-key field, and a no-op on the 24 levels without tiles.
- **ISSUE-005** (MED) — comes with it. An uncovered tile is always cleared in the model, so
  a strand set can no longer contain one.
- **ISSUE-002** (HIGH) — the extra-card cap was the loop guard at 6, but Comfortable Win
  permits 4–6 draws unused and can absorb two. `bandRoom()` makes the band the cap; beyond
  it the reward pays its configured fallback, which is the pathway the streak spec already
  uses for a loop guard.
- **ISSUE-015** (CRIT) — absorbed, not eliminated. `absorbWastedDraw()` steps the target
  down inside its band after a voluntary draw, so a wasted draw costs a number rather than
  the outcome. It cannot be eliminated; D-010 states the behaviour class instead.
- **ISSUE-013**, **ISSUE-012** — the `||n` zero-count fallback, and `allHit`'s three
  indistinguishable falses.

### Added
- The reachability detector. `contractState()` turns the Cards-left tile red and says why
  when no play and no remaining grant can reach the band. Pure counting, no search.
- **D-010** the guarantee's behaviour class · **D-011** the live band is the authored band.

### Changed
- `liveBand()` returns the authored band. It never affected steering — `bandOf()` always
  read the real `tgt.lo/hi` — so its whole effect was to grade the live director against a
  band one wider than the promise. **Reported live in-band accuracy falls ~19 points with
  no behaviour change**; that is the correction arriving.
- The Deck tile said "unused" on lose targets, where the band counts stranded cards.
- `dGoal()` no longer counts plus tiles as cards the player must clear — on L12 the live
  director was chasing a number three too high. `dReveal()` no longer spends a pool card
  binding a rank to a tile that can never be played.

### Verification
    plustest 13/13 · streaktest 26/26 · colortest 11/11 · meter 9/9 · truth 18/18

`reg.js` twice, policy random, against a 1.2.0 baseline of 101 pass / 20 fail:

    run 1   pass 109  fail 12     run 2   pass 108  fail 13
    VERIFIED  win 64/64 · lose 31/31 · outcome held 950/950 (100%)
    LIVE      held 90%  ·  in band 62%  ·  exact 36–37%

Verified failures **5 → 0**. Verified coverage 98 → 95 pairs: three win pairs moved to
live, all on L12 (INFERRED — the only level with tiles), because teaching the verifier that
tiles clear for free changes the draws-unused arithmetic there. They were never really
verified. Both live in-band columns now read the same number, which is D-011 landing.

The two runs differ by one pair, and `buildchk` scored 30/50 then 29/50 on two builds of
the identical file — ISSUE-004, next.

### Known issues
ISSUE-003 (HIGH, open) — live steering at 36% exact; not a patch, it is the
progressive-verification work. ISSUE-004 (MEDIUM, open) — non-determinism, and the "by
design" label is being challenged.

---


## 1.2.0 — 2026-08-25

The session that named the behaviour class — and found that the verified guarantee
does not survive a player who taps the deck.

### Added
- **Four player policies** in `botPlay(seed, policy)`: `random` (byte-identical to the
  old bot, exactly one `rnd()` per decision so historical seeds keep their meaning),
  `greedy`, `cautious`, `drawhappy`. Every reliability figure this project owned was
  measured against a uniform-random bot; the behaviour class was undefined and
  measured by accident. `DRAWHAPPY_P` sets the voluntary-draw rate.
- Restored `reg.js`, `fulltest.js`, `mkreport.js`, `buildchk.js`, `equiv.js` from
  `v1.0.1`, each patched for the CRLF prologue trap.

### Fixed
- **ISSUE-014** — `reset()` restored the deal but not the round's target state:
  `tv`, `deckLen`, `band`, `wildAt`. Replaying a level inherited the previous round's
  drift, so a live level's deck grew on every Replay.

### Changed
- `reg.js` scoring, three corrections. Exactness is measured against the **build-time**
  target, not an `LV.tv` the ladder moves mid-round. "The deck moved" now means the
  **target** moved (`status!=='keep' || tvMoved!==0`) — the old test counted any supply
  record, so the exact branch was almost never taken. Live pairs are scored **both**
  ways: against the authored `OUT` band and against the widened band `liveBand()`
  advertises.
- `APP_VERSION` 1.1.2 → 1.2.0. MINOR: measured numbers move.

### Recorded, not fixed
- **ISSUE-011** (HIGH) — `exh()` has no `isPlusCard` guard, so the verifier plays plus
  tiles as ordinary cards. On any level with tiles the proof describes a different game.
- **ISSUE-012** — `allHit()` sets `unsound` and never reads it; `false` conflates a
  missed line, an exhausted budget and an unsound radix, and memoises it.
- **ISSUE-013** — `addExtraCards()` computes `amount = added.length || n`, so a grant
  that added zero cards still retargets by `n`.

### Verification
    plustest 13/13 · streaktest 26/26 · colortest 11/11 · meter 9/9 · truth 18/18

**Baseline by player policy** — 121 pairs × 10 plays each:

    policy      reg pass/fail   live held   live in band (OUT)   live exact
    random         101 / 20        88%           57%                30%
    greedy         101 / 20        87%           50%                27%
    cautious       104 / 17        90%           61%                36%
    drawhappy       20 / 101       87%           62%                38%

**Voluntary-draw sweep** — verified win pairs passing, by draw rate:

    0%  (control)   62 / 67     outcome held 100%    reg 101/20
    2%              41 / 67     outcome held  97%    reg  74/47
    5%              28 / 67     outcome held  92%    reg  62/59
    10%              6 / 67     outcome held  82%    reg  38/83
    25%              0 / 67     outcome held  51%    reg  18/103

The 0% control matches `random` exactly, so the collapse is caused by the draws and
not by the policy's extra random-number consumption. `exh()` only draws when nothing
is playable, so a voluntary draw is a line no proof covers — and a spent draw cannot
be un-spent, so a win target is arithmetically gone. Lose targets are far more robust.
Live is unaffected throughout and **overtakes verified past roughly a 5% draw rate**.

The 50% rate was started and killed: win pairs already reach zero at 25%.

---


## 1.1.2 — 2026-08-24

### Fixed
- **ISSUE-010 (CRITICAL)** — a Plus Card fire crashed the board under the live
  director. A tile clears itself, exposing the cards above it; the live director mints
  ranks on reveal and nothing revealed those cards, so `render()` threw on a card with
  no label and the board froze mid-paint with the played card already cleared. The
  symptom was a card that ignored the first click and cleared on the second.
  `plusSweep()` now reveals what the tiles uncovered — `dReveal()` for the live
  director, `ecReveal()` during a rescue, nothing for verified, which never needed it.
  Fixing it in the sweep rather than in `play()` covers `reset()` too, where a
  blockerless tile firing at the deal has the same hole.

### Changed
- `APP_VERSION` 1.1.1 → 1.1.2. PATCH: a crash fix that moves no measured outcome.

### Verification
    plustest 13/13

L12 forced live, 30 rounds per build, before and after:

    1.1.1 (deployed)  30 of 30 rounds threw, each at its first tile fire, 30 fires total
    1.1.2             0 of 30 threw, 86 fires total — rounds play through all 3 tiles

The other four suites were not run this time, at the user's instruction. `plustest` is
the one that drives the Plus Card path.

---


## 1.1.1 — 2026-08-24

### Added
- **Director toggle** in the control bar. `Director: auto` is the shipped behaviour —
  verified director first, live only when nothing proves. Clicking it switches to
  `Director: live (forced)`, which builds every level through the live director so its
  steering can be watched on a level that would otherwise be proved and never reach it.

  It is a testing switch and is deliberately narrow: read once in `build()`, never
  written to `VDATA`, not persisted across a reload, and off by default. While it is on,
  the tagline reads `Live director (forced)` and the plan panel says the verified
  director was never asked — a level shown as live under the toggle has **not** failed
  to verify, and nothing in the panel should be read as if it had.

### Changed
- `APP_VERSION` 1.1.0 → 1.1.1. PATCH: off by default and it moves no measured outcome.

### Verification
    plustest 13/13 · streaktest 26/26 · colortest 11/11 · meter 9/9 · truth 18/18

Toggle itself measured on four level/outcome pairs that normally build verified —
L4 Comfortable Win, L4 Close Win, L12 Comfortable Win, L6 Comfortable Win:

    auto -> verified (mode 0) · forced -> live (mode 4) · auto again -> verified
    4 of 4 forced live and restored cleanly, FORCELIVE default at load: false

---


## 1.1.0 — 2026-08-24

Pacing, stages 0 and 1. Full note: `docs/versions/RELEASE_1.1.0.md`.

### Added
- Shape ranking over proved candidates. `searchPass()` collects up to `PACE.K`
  proofs and ships the best-scoring one instead of the first that verified.
  `paceScore()` penalises weak endings, stutter runs, dead draws in the last
  quarter, an unresolved denial, and a front-loaded longest chain (Q-003 as a
  preference). **D-008**: shape is a preference, never a filter — D-007 stays
  rejected and is the reason for that shape.
- `proveFrom()` prefers a re-ordering whose undrawn tail answers the board, rather
  than the first that lands. **D-009**.
- `Shape` row in the level plan: score, and how many proofs it chose between.

### Changed
- L12's plus tiles grant 2 each instead of 3 — commit `dea77fc`, revert alone to
  restore the original supply. 1.00 draws per matchable card → 0.67.
- `finishBuild()` shows the winning candidate's seed, not the last seed tried.
- `gen()` returns its `gaps` layout.
- `APP_VERSION` 1.0.3 → 1.1.0. MINOR: chain shapes and build times move.

### Fixed
- **ISSUE-009** — the verification gate could not run on a Windows checkout.
  `core.autocrlf` rewrote `index.html` to CRLF and every harness regex wanted
  `\n`, so all five suites died before running a case. Dead since 1.0.2.
- **ISSUE-006** — `reassignUnseen()` stripped the granted-card tag (RULE-012).
- **ISSUE-007** — `reDirect()`'s reshaped rung dropped a committed Wild (RULE-009).
- **ISSUE-008** — `reset()` swept Plus Cards before rebuilding the deck.

### Known issues
ISSUE-002 (HIGH, open) — untouched, and still unmeasurable here.
ISSUE-003 (HIGH, open), ISSUE-004 (MEDIUM, by design), ISSUE-005 (MEDIUM, open).

### Verification
    plustest 13/13 · streaktest 26/26 · colortest 11/11 · meter 9/9 · truth 18/18

Plus a direct 14-pair build comparison against 1.0.3: **0 director flips, 0 target
changes**, build time 125% of base, longest-chain-front-loaded 3/13 → 0/13,
single-match runs 24 → 9. Sample, not library: `reg.js` is deleted, so band
adherence and the library-wide verified/live split are unmeasured.

---


## 1.0.3 — 2026-08-24

### Added
- `docs/WHY_THE_DIRECTOR.md` — the objective. Why the Director exists: a level ships as a
  shape and gets its card values from a shuffle, so the experience is a lottery; the
  Director makes outcome a design input. Committed verbatim as received.
- **Q-007** — which outcome bands are authoritative. The paper lists Close Lose 1–3 and
  Comfortable Lose 4–6; `OUT` has 3–5 and 5–8. The demo's lose bands overlap at 5, and the
  shipping constants the paper quotes (`WIN_TARGET_DECK_MIN/MAX = 0..3`) leave the demo's
  Comfortable Win band with no counterpart. Recorded, not resolved.

### Changed
- `docs/AI_CONTEXT.md` points at the objective and names the metric to protect: verified
  levels that missed their target, zero.
- `APP_VERSION` 1.0.2 → 1.0.3.

### Verification
**Not run, by instruction** — docs only, plus a one-character version bump. The 1.0.2
deploy was confirmed rendering at the live URL, which establishes that the patched script
parses; the version readout itself is injected at runtime and was not observable through a
non-JS fetch.

---


## 1.0.2 — 2026-08-24

### Added
- `APP_VERSION` in `index.html`, rendered beside the seed in the control bar, so the
  deployed build identifies itself. Step 9 of `docs/WORKFLOW.md` depends on it.
- `docs/WORKFLOW.md` — `main` is production, the branch model, the verification gate,
  versioning rules, releases and rollback.

### Changed
- `CLAUDE.md` — new "main is production" section. GitHub Pages serves `main` from the
  repository root, so every push to `main` is a live deploy; merges need the gate and
  approval.
- `tools/` reduced to the five fast suites plus `addlevels.js`, the level importer.
- The gate in `CLAUDE.md`, `docs/WORKFLOW.md` and `tools/README.md` rewritten for what
  remains, including what it no longer covers.

### Removed
- 18 harnesses: `reg`, `collide`, `announce`, `band12`, `bands`, `buildchk`, `diag12`,
  `eced_bot`, `equiv`, `fulltest`, `funnel`, `gaps`, `livecmp`, `mkreport`, `pacing`,
  `pingcheck`, `sweep`, `verify25`. The long runs cost more time than they returned.
  Recover any one with `git checkout v1.0.1 -- tools/<name>.js`.
- With them went every automated measurement of band adherence and the verified/live
  split. ISSUE-002 can no longer be reproduced, or a fix for it demonstrated, from this
  working tree.

### Known issues
ISSUE-002 (HIGH, open — now unmeasurable here), ISSUE-003 (HIGH, open),
ISSUE-004 (MEDIUM, by design), ISSUE-005 (MEDIUM, open).

### Verification
**Not run for this change, by instruction.** The five suites last passed on 1.0.1,
before the `index.html` edit — plustest 13/13 · streaktest 26/26 · colortest 11/11 ·
meter 9/9 · truth 18/18 — so that result does not cover `APP_VERSION`. The version
readout has not been observed rendering, and the patched script has not been parsed.

---


## 1.0.1 — 2026-08-24

### Fixed
- **ISSUE-001**: `verifiedAbsorb()` threw `ReferenceError: bd is not defined` on
  every REBAND. `LV.band=bd` referenced a constant removed when the loop moved to
  `bandOrder()`.

### Changed
- `tools/reg.js` now scores against the outcome band when a run changed the deck,
  and against the exact target only when it did not. Comparing to the build-time
  `tv` asked a question the director never promised to answer.

### Added
- `tools/` — 24 verification harnesses, plus `tools/README.md`.
- `levels/` — 15 level JSON files.
- Project memory: `CLAUDE.md`, `docs/`, this changelog.

### Known issues
ISSUE-002 (HIGH, open), ISSUE-003 (HIGH, open), ISSUE-004 (MEDIUM, by design),
ISSUE-005 (MEDIUM, open).

### Verification
    plustest 13/13 · streaktest 26/26 · colortest 11/11
    meter 9/9 · truth 18/18 · reg 96 pass / 25 fail

---

## 1.0.0 — 2026-08-24

Initial commit of the demo as `index.html`, with the Plus Card obstacle, streak
rewards, the Extra Card Experience Director and the two core directors.

Not verified at commit time — ISSUE-001 was present.
