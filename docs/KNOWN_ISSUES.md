# Known Issues

Confirmed problems only. No speculation. Each was reproduced on the current
`index.html` on 2026-08-24.

---

**ISSUE-001 — `verifiedAbsorb()` threw on every REBAND**
Severity: CRITICAL · Status: FIXED · Introduced: 1.0.0 · Fixed: 1.0.1

`LV.band=bd` referenced a `const bd` removed when the REBAND loop moved to
`bandOrder()`. Any level reaching that rung died with
`ReferenceError: bd is not defined`.

Reproduced by `tools/reg.js`. Fixed to `LV.band=bandOf()`.

**Why it shipped:** the suites were skipped for speed while iterating. It would
have been caught on the first `reg.js` run. See `CLAUDE.md` — verification is not
optional.

---

**ISSUE-002 — Streak ExtraCards default pushes verified levels outside their band**
Severity: HIGH · Status: OPEN · Introduced: 1.0.0

With `STREAK_REWARD.type = 'ExtraCards'` (the current default), rewards grow the
deck mid-level. The outcome *type* holds, but the value often lands outside the
band, which the ladder cannot always recover.

LIVE, `tools/reg.js`, 121 level/outcome pairs: **96 pass, 25 fail.** Worst case
`L4 Comfortable Win` — outcome held 10/10, in band **0/10**, deck changed in all
10 runs.

Setting `STREAK_REWARD.type = 'Coins'` avoids it — coins do not touch the deck.
The real fix is unresolved: see Q-001.

---

**Re-measured 2026-08-24, second session** — the figures above did not
reproduce. See `docs/measurements/reg_1.0.1.md`. Summary, LIVE, three runs on the
same unmodified build: **91 / 30, 92 / 29, 92 / 29** — never 96 / 25. Of the 30
failures only **3** are this issue (`L4 Close Win`, `L5 Comfortable Win`,
`L16 Close Win`, all verified win targets); 19 contain a non-terminating play
(ISSUE-006), 6 are ISSUE-003 and 2 are ISSUE-005. The stated worst case
`L4 Comfortable Win` at in band 0/10 measured **10/10 exact, PASS**. The original
text is left as written; this note supersedes its numbers, not its diagnosis —
the mechanism it describes is real, its measured scale was overstated.

---

**ISSUE-003 — Live steering misses the exact target**
Severity: HIGH · Status: OPEN · Introduced: 1.0.0

LIVE, 605 runs: verified 302 runs at 100% outcome held and 100% exact target;
live 303 runs at **91% held and 30% exact**. All 27 outcome failures were lose
targets that won, all on the live side.

Live holds no plan and cannot commit to stranding specific cards. A committed
strand set is the candidate fix and carries a supply-starvation risk — Q-002.

An attempted partial fix (closing two gaps in `dDraw`'s dead-card selection) was
measured and **reverted**: it fixed 4 runs and broke 3.

---

**ISSUE-004 — Level generation is non-deterministic**
Severity: MEDIUM · Status: OPEN (by design) · Introduced: 1.0.0

`searchPass` and `build` carry `Date.now()` deadlines, so whether a marginal
level verifies depends on machine speed and load. `tools/reg.js` can report a
different result for the identical build.

Consequence: **whole-build comparison is not a valid test.** Compare
`exh`/`allHit` on identical inputs instead — `tools/equiv.js`.

---

**ISSUE-005 — Plus Card tiles rescue losing boards**
Severity: MEDIUM · Status: OPEN · Introduced: 1.0.0

A plus tile clears itself for free and grants draws, so a board authored to
strand cards can be cleared instead. On L12 (3 tiles × 3 = +9 cards on a 10-card
deck) Close Lose lands at 1 stranded against a band of 3–5.

A plus tile can never be part of a strand set — it always fires if uncovered.

---

**ISSUE-006 — `reset()` does not restore `LV.deckLen`, so a live level's deck
grows without bound across repeated plays**
Severity: HIGH · Status: OPEN · Introduced: 1.0.0

VERIFIED in code. `genLive()` sets `deckLen: DRAWS` once (`index.html:1226`).
`onGameplaySupplyChanged()` increments it for any live level
(`index.html:2120`), as does `insertWild()` (`index.html:2177`). `reset()`
restores `LV.rank`, `LV.LB`, `LV.deck`, `LV.pool` and `LV.usd` from `LV.base`
— but **not `LV.deckLen`**, and not `LV.wildAt`. Its comment says "put the level
back exactly as it was built"; for a live level it does not.

`deckLeft()` returns `LV.deckLen - di` on a live level, so the inflated count is
what the outcome is scored against.

LIVE, measured on `L17 Close Win` (live, DRAWS = 16), ten consecutive plays of one
build — the deck at the start of each play is the deck at the end of the last:

    play  deckLen in  deckLen out  pool left  result
      1        16          21          5      WIN v=3     <- authored tv, correct
      2        21          27          0      no result (600-move cap)
      5        33          39          0      no result
     10        47          48          0      no result

`L22 Comfortable Win`, band 4–6: `W5 W5 W5 W6 W9 W10 W16 W19 W24 W29`.
`L10 Last Card Win`, band 0–0: `W1 W0 W0 W0 W0 W4 W9 -- W18 W20`.
The drift is monotone, which is the signature of accumulated state rather than
of a director making poor choices.

Consequences, in order of how they surface:

1. The rank pool is exhausted, because `deckLen` grew and the pool did not.
   `addExtraCards()` tops up **only the count** on a live level
   (`index.html:2143-2145`); `plusFire()` by contrast does top up `LV.pool`
   (`index.html:1977`). The asymmetry is the defect.
2. `dReveal()` then fabricates supply to avoid a blank card —
   `r=ALL[rnd()]; LV.pool[r]=(LV.pool[r]||0)+1` (`index.html:1267-1268`). This
   is the direct cause of every `rank X used 5 times, supply is 4` report:
   60 of them in one run. Note that the same line keeps `LV.pool` non-negative,
   so `botPlay`'s "live pool went negative" guard never fires — the two
   invariants disagree, and the one that passes is satisfied by the act that
   breaks the other.
3. `dDraw()` returns `null` once nothing is free; `draw()` then does
   `stack.pop(); return;` and changes nothing, while `deckLeft()` is still
   positive. `botPlay` therefore loops — no win, no loss — to its 600-move cap.
   `reg.js` skips a play with no result (`if(!o.res)continue;`) but still
   requires 10/10, so a single non-terminating play forces the pair to fail.
   19 of the 30 failures are this.

**Why it matters beyond the harness.** In the demo a level is played once, so a
player never sees the cross-play accumulation. But 19 of the 30 reg.js failures
attributed to ISSUE-002 are this, so the headline measurement of the project's
highest-priority issue is mostly measuring this instead. Item 1 and item 2 are
real at first play as well: a live level that earns extra cards is drawing
against a pool that was never widened for them.

Setting `STREAK_REWARD.type='Coins'` masks all three, because nothing enters the
deck — 0 non-terminating plays and 0 supply violations. That is evidence for the
cause, not a fix.

---

**ISSUE-007 — `reset()` does not restore `LV.tv`, so the target ratchets to the
band ceiling**
Severity: MEDIUM · Status: OPEN · Introduced: 1.0.0

VERIFIED in code. `verifiedAbsorb()` writes `LV.tv` on every rung
(`index.html:2079, 2082, 2091, 2100, 2105`). `LV.base` never carries `tv`
(`index.html:1583-1585`), so `reset()` cannot restore it.

`retarget()` moves `tv` with a growing deck only while the result stays inside
the band, so the movement is one-way: up for a win target, and once at the
ceiling it stops. The value never returns to the authored one.

LIVE, ExtraCards run: **29 of 121 pairs** ended with a `tv` different from the
one they were built with, every one of them moved toward the band edge and
stayed:

    L3  Close Win        tv 1 -> 3   band 1-3
    L20 Comfortable Win  tv 4 -> 6   band 4-6
    L12 Close Lose       tv 5 -> 3   band 3-5   (via REBAND, which moves lose targets too)

Two consequences:

- `reg.js` compares `o.res.v === lv.tv`, and `lv` **is** the live `LV` object, so
  its `exact` column is measured against a target that moved during the previous
  play. The column is not measuring what it appears to measure.
- The ten plays of a pair are not independent samples. Play 10 starts from a
  different target than play 1, so the ladder takes different rungs.

This does not by itself fail a pair — `reg.js` scores on the band whenever the
deck moved — but it makes the `exact` figures in any repeated-play measurement
unreliable, including the "100% exact / 30% exact" figures under ISSUE-003.

---

**ISSUE-008 — `supplyPick()` does not choose granted ranks the way the streak
spec requires**
Severity: MEDIUM · Status: OPEN · Introduced: 1.0.0

VERIFIED, both sides. `docs/specs/streak_reward_spec.md` §13 requires that the
rank of a granted card be chosen by "the current active director … using its
existing adaptive candidate system", and that it "preserve the intended level
outcome where possible" and "maintain current pacing", and explicitly: "Do not
create a second card-selection algorithm just for streak rewards."

`supplyPick()` (`index.html:2192-2200`) is a uniform random draw among ranks
under a supply cap. It is neither the verified director's candidate system nor
the live director's `dDraw()`, it is board-unaware, and it is a second
algorithm.

INFERRED, not measured: this is why the ladder has so much to absorb. A granted
card whose rank matches nothing currently reachable is a forced dead draw — the
player must burn a draw on it, so a win target's "draws unused" is unchanged and
ADJUST can hold the authored `tv` by ordering it to the front of the unseen
region. A granted card that happens to be playable opens forks that `exh()` must
prove over, which is what pushes the ladder down to REBAND and LIVE. Measured
rung census for the ExtraCards run is in `docs/measurements/reg_1.0.1.md`.

`docs/OPEN_QUESTIONS.md` Q-004 records the board-awareness gap for Plus Card
emitted ranks. It is the same function and the same gap, but Q-004 does not name
it as a spec conflict, and `addExtraCards()` reaches it too.

---

**ISSUE-009 — `APP_VERSION` does not exist, so the `docs/WORKFLOW.md` version
gate cannot be applied**
Severity: LOW · Status: OPEN · Introduced: 1.0.1 (documentation)

VERIFIED. `docs/WORKFLOW.md` requires, at step 6 of its loop, "bump
`APP_VERSION` and add a `CHANGELOG` entry"; states as its review check that
"`APP_VERSION` in `index.html` and the top entry of `CHANGELOG.md` must agree";
and at step 9 says "the deployed build now identifies itself. The header shows
`v1.0.1` beside the seed."

`index.html` contains no `APP_VERSION`, and no version string of any kind —
`grep -niE "version|v1\.|APP_VER"` over the file returns nothing. The element
beside the seed, `id="sd"` (`index.html:393`), is written only as `'seed '+sd`
(`index.html:1508`).

So three things in the workflow cannot currently be done: the bump, the
agreement check, and the post-deploy confirmation. `CLAUDE.md` carries the same
requirement in its "main is production" section.

Not fixed here — this session was asked not to modify `index.html`. The change
is a single constant plus one span of header text, and by `docs/WORKFLOW.md`'s
own table it is a PATCH: it moves no measured outcome.
