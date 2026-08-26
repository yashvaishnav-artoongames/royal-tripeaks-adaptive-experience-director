# Known Issues

Confirmed problems only. No speculation. Each was reproduced on the current
`index.html` on 2026-08-24.

> **Statuses below are stale as of 1.4.0.** `index.html` was reverted to 1.1.1 during
> the obstacle branch, rolling 1.2.0 and 1.3.0 out of the build. Every entry marked
> `Fixed: 1.2.0` or `Fixed: 1.3.0` therefore describes code that is **not present** —
> ISSUE-002, 005, 011, 012, 013, 014 and 015. Re-read against current source and confirmed
> still broken: **ISSUE-011** (no `isPlusCard` guard in `exh()`/`allHit()`, no `plusClose()`),
> **ISSUE-012** (`unsound` written twice, never read), **ISSUE-014** (`reset()` does not
> restore `tv`/`band`/`tgt`). The other four are INFERRED from the revert, not re-read.
>
> Entries are left as written rather than edited: the fix happened, then the code carrying
> it was rolled back. Superseding beats rewriting.

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
Severity: HIGH · Status: FIXED · Introduced: 1.0.0 · Fixed: 1.3.0

**Fixed 1.3.0.** `bandRoom()` makes the outcome band the cap on extra-card grants rather
than the loop guard; beyond it the reward pays its configured fallback. Measured over 121 pairs:
verified failures 5 -> **0**, verified runs holding the outcome **950/950**.

With `STREAK_REWARD.type = 'ExtraCards'` (the current default), rewards grow the
deck mid-level. The outcome *type* holds, but the value often lands outside the
band, which the ladder cannot always recover.

LIVE, `tools/reg.js`, 121 level/outcome pairs: **96 pass, 25 fail.** Worst case
`L4 Comfortable Win` — outcome held 10/10, in band **0/10**, deck changed in all
10 runs.

Setting `STREAK_REWARD.type = 'Coins'` avoids it — coins do not touch the deck.
The real fix is unresolved: see Q-001.

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

**Measured 2026-08-25.** Two `reg.js` runs of identical code differed by one pair, and
`buildchk` scored 30/50 then 29/50 on two builds of the same file — a 1–2% noise floor on
every number this project produces.

**Attempted and parked** on `feat/issue-004-deterministic-build`. Replacing the wall-clock
budget in `searchPass` and `quickValidate` with a work budget counted in `exh()` calls is
the right shape — generation runs ahead of the player, so the latency argument for a clock
does not apply there, and work is machine-independent. It failed on calibration: the old
clock capped a *failing* search at ~1.1s per candidate value, while a work budget burns the
whole allowance every time, so all the cost lands on levels that cannot prove. At 400
attempts per value, `streaktest` — thirteen builds — had not finished in 13 minutes against
under a minute for the entire gate. Sizing it needs a measured run per candidate value.

The mid-round half should NOT be converted: `proveFrom`, `reDirect` and `verifiedAbsorb`
run inside a player’s tap, where the deadline protects frame time rather than nothing.

---

**ISSUE-005 — Plus Card tiles rescue losing boards**
Severity: MEDIUM · Status: FIXED · Introduced: 1.0.0 · Fixed: 1.3.0

**Fixed 1.3.0**, by ISSUE-011. With the cleared set closing over tiles, an uncovered tile
is always cleared in the model, so a strand set can no longer contain one. Verified lose pairs
went 29/31 -> **31/31**.

A plus tile clears itself for free and grants draws, so a board authored to
strand cards can be cleared instead. On L12 (3 tiles × 3 = +9 cards on a 10-card
deck) Close Lose lands at 1 stranded against a band of 3–5.

A plus tile can never be part of a strand set — it always fires if uncovered.

---

**ISSUE-006 — `reassignUnseen()` stripped the granted-card tag**
Severity: MEDIUM · Status: FIXED · Introduced: 1.0.0 · Fixed: 1.1.0

The REPLAN rung rebuilt the undrawn deck by pushing 3-element cards, dropping the
`[3]` tag that RULE-012 rests on. After any re-deal, cards a reward or a Plus Card
had granted counted against core rank supply — visible as the bot's
"rank X used 5 times, supply is 4". Fixed by carrying the tag positionally: the
rank and suit are the director's to change, where the card came from is not.

---

**ISSUE-007 — `reDirect()`'s reshaped rung did not preserve a committed Wild**
Severity: MEDIUM · Status: FIXED · Introduced: 1.0.0 · Fixed: 1.1.0

RULE-009 says every ladder rung calls `preserveWilds()`. It was VERIFIED false for
the `reshaped` rung: `reassignUnseen()` rebuilds the tail from the rank pool and
carries no Wilds, so a re-deal ate a Wild the player had earned. Only reachable
with `STREAK_REWARD.type='WildCard'`, which is not the default. Fixed.

---

**ISSUE-008 — `reset()` swept Plus Cards before rebuilding the deck**
Severity: LOW · Status: FIXED · Introduced: 1.0.0 · Fixed: 1.1.0

`plusSweep()` ran while `dk` still held the previous round's array, so a tile with
no blockers would fire at the deal, splice into the stale deck and write it back
through `LV.deck` — and the absorb it recorded was then overwritten by the reset
that followed. Latent: every authored tile has blockers, and `parseLevel` warns
when one does not. Fixed by sweeping after the round state is rebuilt.

---

**ISSUE-009 — the verification gate cannot run on a Windows checkout**
Severity: HIGH · Status: FIXED · Introduced: 1.0.1 · Fixed: 1.1.0

Every harness matched `/<script>\n"use strict";/` against `index.html`. With
`core.autocrlf=true` — the Windows default — git rewrites the working tree to CRLF
on checkout, so the regex found nothing and all five suites died with
`TypeError: Cannot read properties of null (reading '1')` before running a single
case. VERIFIED 2026-08-24: working tree 3770 CRLF lines, committed blob 3654 LF
lines. The repository content and the deployed site were never affected.

This is ISSUE-001's shape exactly — a break that stays invisible because nothing
runs. It went unnoticed through 1.0.2 and 1.0.3, both of which shipped with
"verification not run". Fixed by matching `\r?\n` in all six harnesses. The root
cause is unaddressed: a `.gitattributes` pinning `index.html` to LF would stop the
conversion, and adding a file to the repository root needs a decision.

---

**ISSUE-010 — a Plus Card fire crashed the board under the live director**
Severity: CRITICAL · Status: FIXED · Introduced: 1.0.0 · Fixed: 1.1.2

`plusFire()` clears its tile with `cl.add(i)`, which exposes whatever sat on top of
it. The verified director does not care — `gen()` binds a rank to every slot at build
time. The live director mints on reveal, and nothing revealed those cards: `play()`
calls `dReveal()` *before* `plusSweep()`, and neither `plusFire()` nor `reset()`
reveals at all. `render()` then read `LV.LB[i][2]` on a card with no label and threw:

    Uncaught TypeError: Cannot read properties of undefined (reading '2')
        at render (index.html:3541)
        at play (index.html:1825)

Because the throw lands after `cl.add()` and after the tile has fired and pinged, the
board freezes on its previous paint with the played card already cleared underneath —
so the card looks unresponsive, and a second click appears to "fix" it. The second
click re-enters `play()`, `dReveal()` now sees the exposed cards, and the board jumps
to the correct state. Reported from the live site by the user on L12.

Reproduced 2026-08-24 on the 1.1.1 build, L12 forced live: **30 of 30 rounds threw**,
each at its first tile fire. With the fix, 0 of 30, and the rounds play through all
three tiles.

Latent until 1.1.1: a plus level only reaches the live director if the verified
director cannot prove it, which is rare on L12. The director toggle made it reachable
on demand, which is how it surfaced.

---

**ISSUE-011 — `exh()` lets its imaginary player play Plus Cards**
Severity: HIGH · Status: FIXED · Introduced: 1.0.0 · Fixed: 1.3.0, reverted, **re-fixed properly by the brain engine**

> **Closed for real this time.** The 1.3.0 fix refused tiles and closed the cleared set over
> them, then went out with the revert. The brain engine closes it at the root instead: there is
> now ONE matching rule (`canMatch`) that both the player and the prover call, so the prover
> cannot hold a different opinion about what a plus tile is. Stage 4 then taught it the rest —
> `gen()` pre-commits the granted ranks, `plusClose()` closes the mask over self-firing tiles,
> and the pending-grant queue puts a granted card on top of the deck where the game puts it.
> L12 is verified 5/5, and `docs/measurements/proof-holds.js` confirms all five land exactly on
> target over 25 real play-throughs each. The original note below stands as history.

**Fixed 1.3.0.** `exh()` and `allHit()` refuse plus tiles as `legals()` does, and
`plusClose()` closes the cleared set over self-clearing tiles. Cost: verified WIN pairs 67 -> 64,
all three on L12 (INFERRED - the only level carrying tiles). Those three were never really
verified; they were proving a game in which the player spends matches on plus tiles.

`legals()` refuses a plus tile as a match target — `if(isPlusCard(i))continue;` — and RULE-002
says so explicitly. `exh()`'s legality loop has no such guard, so the verifier explores lines
in which the player *plays* a tile: spending a match on it and taking its rank onto the
waste. It also never models the free clear or the deck growth a firing tile causes.

So on any level carrying `PlusCards`, "proved over every legal line" is a proof about a
different game from the one the player gets. `allHit()` shares the defect, so the recovery
ladder re-proves the same wrong game. Today that is L12 only — 5 of 125 level/outcome pairs —
because L12 is the only level with tiles.

This is the root under ISSUE-005. Fixing the guard alone is not sufficient and may reduce
verified coverage: a level that only proved because tiles were playable would stop proving.
The full fix is to plan against the eventual deck and model the tiles as unlocks, which is a
prover change and needs `tools/equiv.js` to confirm the other 24 levels are untouched.

---

**ISSUE-012 — `allHit()` sets `unsound` and never reads it**
Severity: MEDIUM · Status: FIXED · Introduced: 1.0.0 · Fixed: 1.3.0

**Fixed 1.3.0.** `HITFAIL` counts a missed line, an exhausted budget and an unsound radix
separately. Same single return value - every rung must try something else either way.

`allHit` returns `false` for three different reasons — a line genuinely misses, the 90,000
state cap was exhausted, or a memo-key field overflowed its radix — and the caller cannot
tell them apart. The `unsound` flag exists to mark the third case and is never read; the
final line is a bare `return f(...)`. The `false` is also memoised, so an exhausted branch
poisons the table for the rest of the call.

Conservative in direction: it never claims a proof it does not have. But every ladder rung
treats "cannot prove" and "does not hold" identically, and a level that drops to LIVE because
the search ran out of budget is indistinguishable from one that genuinely cannot be proved.

---

**ISSUE-013 — `addExtraCards()` retargets for cards it never added**
Severity: MEDIUM · Status: FIXED · Introduced: 1.0.0 · Fixed: 1.3.0

**Fixed 1.3.0.** The `||n` fallback belongs to the live branch, which legitimately has an
empty `added`; a genuinely empty grant now raises no event at all.

The grant loop breaks early when `supplyPick()` returns undefined, so it can add fewer cards
than asked — including none. But the event it raises computes `amount = added.length || n`,
so when **zero** cards were added the fallback reports `n`, and `verifiedAbsorb(n)` moves the
target for a deck that did not grow. The `||` is reading 0 as absent.

---

**ISSUE-014 — `reset()` did not restore the round's target state**
Severity: HIGH · Status: FIXED · Introduced: 1.0.0 · Fixed: 1.2.0

`reset()` restored the deal — rank, labels, deck, pool, suit counters — but not the fields the
recovery ladder moves while a round runs: `LV.tv` (walked by `retarget`), `LV.deckLen` (grown
by every supply change on a live level), `LV.band` (rewritten by a reband) and `LV.wildAt`
(queued by `insertWild`).

So replaying a level inherited the previous round's drift. On a live level the granted deck
growth accumulated on every Replay, and the target drifted with it — by the tenth pass the
level being measured was not the level that was built. Measured effect on `reg.js`: 96 pass /
25 fail became 104 / 17 with the fields restored, non-terminating runs 79 → 13, rank-supply
violations 55 → 1, and the live side read 73% held / 19% exact instead of 93% / 31%.

Fixed by capturing the four fields into `LV.base` at build and restoring them in `reset()`.

---

**ISSUE-015 — the verified guarantee does not survive a voluntary draw**
Severity: CRITICAL · Status: FIXED · Introduced: 1.0.0 · Measured: 1.2.0 · Fixed: 1.3.0

**Absorbed, not eliminated, in 1.3.0.** `absorbWastedDraw()` steps the target down inside
its band, so a wasted draw costs a number rather than the outcome. It cannot be eliminated: a
player who empties the deck forces 0 unused whatever the card values are, and D-010 states the
behaviour class the guarantee actually covers. **The draw-rate sweep has not been re-run since
the fix, so how much of the 2-5% range it recovers is UNKNOWN.**

`exh()` recurses into a draw only when `lg.length===0`, so "proved over every legal
line" means *every line in which the player plays whenever a play is available*. The
game offers a Draw Anyway button and real solitaire players tap the deck at will, so
the guarantee's behaviour class excludes ordinary play.

Measured over 121 level/outcome pairs × 10 plays, varying the rate at which the player
draws with a play available:

    draw rate   verified WIN pairs passing   outcome held   reg pass/fail
       0% ctl          62 / 67                   100%          101 / 20
       2%              41 / 67                    97%           74 / 47
       5%              28 / 67                    92%           62 / 59
      10%               6 / 67                    82%           38 / 83
      25%               0 / 67                    51%           18 / 103

Two percent is one early draw in fifty decisions. The 0% control scores 101/20,
identical to the `random` policy, so the collapse is caused by the draws and not by
the policy's extra `rnd()` consumption.

`miss1()` calls `reDirect()` to re-prove, but a spent draw cannot be un-spent: once
the draw budget is gone a win target is arithmetically unreachable and no re-plan
recovers it. Lose targets are far more robust — wasting draws helps you lose. The live
director is unaffected at every rate and **overtakes verified past roughly 5%**.

Proving against unlimited voluntary draws is impossible, not merely hard: a player who
empties the deck forces "0 unused" whatever the card values are. The available fix is
absorption, not proof — treat a wasted draw as a supply change of −1 and send it
through the existing ladder, so `retarget()` steps the target down inside its band. That
covers wasted draws up to the band width, which spans the 2–5% range where real players
sit. Last Card Win has zero band width and cannot absorb any.
