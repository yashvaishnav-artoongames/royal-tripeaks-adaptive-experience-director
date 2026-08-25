# The Brain Engine — specification and staged plan

Status: **PROPOSED**, validated by inspection and arithmetic. Not implemented.
Written 2026-08-25 against `index.html` at 1.4.0.

> One place that knows what every obstacle does to a plan, so the directors do not each
> carry their own half-remembered copy of the rules.

---

## 1. The defect this exists to fix

**The matching rule lives twice, and one copy is stale.** VERIFIED.

| where | what it uses | knows about obstacles |
|---|---|---|
| the player's path | `slotTakes(i,w)` → `legals()` | wild, double, plus, lock/key |
| the prover's path | a bare `cyc(rank[i],w)` inside `exh()` and `allHit()` | **nothing** |

So the prover's imaginary player believes:

- a **plus tile** is an ordinary card to spend a match on — ISSUE-011, and until 1.4.0 gated
  it, L12 was *proved* against this. A false proof is the exact failure the project's
  headline number exists to catch.
- a **wild slot** is never playable (`cyc(undefined, w)` is false), so it is a permanent wall.
- a **double** carries one rank, not two.
- a **lock or key** is a permanent blocker, because nothing models the pair collect.
- an **up/down** card sits on its dealt rank forever.

Gating those levels to live (1.4.0) stopped the lying. It did not make the prover correct,
and it means five of five obstacle levels have no proof at all.

A second, smaller instance of the same disease: obstacle knowledge is smeared across
`slotTakes`, `oLedger`, `legals`, `dGoal`, `dRunLen`, `dReveal`, `lkReady`, `udLive`,
`useLevel` and the `bends` boolean. Adding a sixth obstacle means finding all ten.

---

## 2. What the brain is

Three things, in one delimited section of `index.html`.

### 2.1 `OBS` — the facts, declared once

One row per obstacle, carrying only what a *planner* needs. This is the knowledge; the rest
of the engine is lookups against it.

| obstacle | matched? | self-clears | pays deck | bends the rule | provable | taught |
|---|---|---|---|---|---|---|
| Plus Card | no | 1 tile | `Value` | — | yes¹ | no |
| Lock & Key | no | 2 per pair | no | — | yes | no |
| Wild | yes | no | no | answers anything | yes | no |
| Double Value | yes | no | no | two adjacent ranks | yes | no |
| Up & Down | yes | no | no | rank moves per move | **no** | no |

¹ provable only once the granted ranks are pre-committed — see §4.4.

Two separate columns, and the distinction is the whole point of the table:

- **`provable`** — can a fixed-rank search prove this level *in principle*.
- **`taught`** — does `exh()`/`allHit()` model it *today*.

Gating on `provable` alone would reopen ISSUE-011 under a new name: the prover would explore
a game it still has wrong. The gate reads `taught`. `provable && !taught` is the work queue.

### 2.2 `canMatch(i, w, rank, w2)` — the one rule

```
if (plus tile)      return false          // never a match target
if (lock or key)    return false          // answers only its partner
if (wild slot)      return w !== WILD     // a wild will not go onto a wild
if (w === WILD)     return true           // a wild waste takes anything
r = rank[i]; if (r === undefined) return false
if (cyc(r, w))                 return true     // ordinary
if (w2 && cyc(r, w2))          return true     // the waste's second value
if (double slot) {
  s = secondOf(r)
  if (cyc(s, w))               return true     // the card's second value
  if (w2 && cyc(s, w2))        return true     // both doubles
}
return false
```

`slotTakes(i,w)` becomes `canMatch(i, w, LV.rank, wl[3] || 0)`. `exh()` and `allHit()` call
the same function with their local `rank` array. **Nothing else may decide whether a slot
answers a waste.**

### 2.3 `readBoard()` — the one board model

Extends the existing `oLedger()`. Everything a director needs about the current position:

| field | meaning | who needs it |
|---|---|---|
| `work` | cards the player must actually match | `dGoal` |
| `free` | cards that will leave with no match | `dGoal`, the survival guard |
| `grants` | deck cards still to arrive | `dRunLen`, the survival guard |
| `wilds` | rankless slots — guaranteed matches | run planning, dead-end detection |
| `moving` | revealed up/down tiles — ranks not stable | anything planning against a rank |
| `pairs` / `orphans` | completable pairs, and halves that never will | `dGoal` |
| `taught` / `untaught` | which obstacles the prover models | the gate, and the panel |

---

## 3. Validation

All four ran against 1.4.0 source. Script: `docs/measurements/brain-engine-validation.js`. It re-reads `cyc`, `WILD_RANK`,
the memo key and the search caps out of `index.html` on every run, so it cannot drift away
from the source it is describing. It finishes in well under a second — it proves arithmetic,
it does not play the game, so it is not one of the harnesses.

### 3.1 `canMatch` is an exact no-op today — VERIFIED

`cyc` and `WILD_RANK` were pulled out of `index.html` verbatim, not retyped, and compared
against the proposed rule over **all 196 (rank, waste) pairs** — every rank 1–13 plus
`undefined`, every waste 1–13 plus WILD, with all obstacle predicates false.

**Differences: 0.**

Every obstacle level is already gated to live, so every level that reaches the prover today
has all those predicates false. The swap therefore cannot change any current behaviour, and
the prover becomes obstacle-aware *by construction*. **This is the whole reason the plan is
safe to start.**

That is a proof by case analysis. There is also an **empirical** guard for it, and it was
built for this exact job: `tools/equiv.js`, deleted in 1.0.2 and recoverable with

```bash
git checkout v1.0.1 -- tools/equiv.js && AED_BASELINE=/path/to/old/index.html node tools/equiv.js
```

It loads two builds into separate VM contexts behind a DOM stub and calls `exh()` and
`allHit()` on **identical captured inputs**, comparing the returns. Its own header explains
why that shape: the generator around the provers is time-boxed, so comparing whole builds
can never be deterministic — comparing the two functions directly isolates the change from
the wall-clock search around it. It plays no games and runs no levels, so it is not one of
the slow suites. **Stage 0 should not land without it showing zero differences.**

### 3.2 The memo key survives — VERIFIED

Key is `((mlo*WR + w)*DJR + dj)*PIPS + mt`, `WR=15`, `PIPS=5`, `DJR = deck+2`.

| after | worst key | fits `2^53`? |
|---|---|---|
| today | 8.05e10 | yes |
| + double (one bit) | 1.61e11 | yes |
| + plus (L12 deck 10→19) | 2.11e11 | yes |
| + up/down, 2 tiles (13²) | 3.57e13 | yes |
| + up/down, 8 tiles (13⁸) | 1.72e20 | **overflows** |

### 3.3 The state count survives for four of five — VERIFIED

| obstacle | new key field | multiplier |
|---|---|---|
| wild | none | ×1 |
| double | one bit | ×2 |
| lock & key | none | ~×1 |
| plus | none — deck length is `f(mask)` | ~×1 |
| up & down | live rank per tile | **13^k** |

Two findings worth keeping:

**Plus is cheaper than it looks.** Which tiles have fired is fully determined by the mask,
so the deck's length is too. No new key field — only a wider `DJR` and a mask-derived length
in the `tv` check.

**Up/down cannot be keyed on a move counter.** A tile is frozen until *revealed*, so its live
rank is `start + step × (moves since ITS reveal)`. Two lines can reach the same mask having
made different numbers of moves, and the mask does not record when each tile was uncovered —
reveal time is not recoverable from the state. The live rank must be carried per tile, hence
13^k. At k=2 that is ×169 against a 250k cap; at k=8 (L1499's shape) it is ×8.2e8. **This is
a property of the obstacle, not of the implementation.** Up/down stays live.

### 3.4 What each stage unlocks — VERIFIED against the level table

| after stage | verified levels |
|---|---|
| today | none |
| 1 · wild | L21 |
| 2 · double | L21, L111 |
| 3 · lock & key | L21, L111, L7 |
| 4 · plus | L12, L21, L111, L7 |

L41 stays live throughout, by design.

---

## 4. The staged plan

Each stage is one obstacle on one level, so each can be argued in the browser on its own
before the next begins. No stage depends on a later one.

### Stage 0 — build the brain (no behaviour change)

`OBS`, `canMatch`, `readBoard`, `provable()`, `proverTaught()`. Point `slotTakes`, `legals`,
`exh`, `allHit`, `dGoal`, `dRunLen` and `dReveal` at them. Replace the hand-maintained
`bends` boolean with `!proverTaught()`, all five `taught` flags false — so the gate holds
exactly where 1.4.0 left it.

Also: surface `readBoard()` in the Level plan panel. A brain you cannot inspect is plumbing.

**Verify:** `equiv.js` reporting zero differences against a 1.4.0 baseline (§3.1), plus
`brain-engine-validation.js`, plus every level still building and behaving as it does now.
If `equiv.js` shows a single difference, the no-op claim is wrong and nothing else in this
plan can be trusted — stop there.

### Stage 1 — teach wild · unlocks L21

Two changes only: `canMatch` already handles the slot, and `exh`/`allHit` must set the waste
to `WILD_RANK` when the played slot is a wild — today they would write `rank[i]`, which is
`undefined`, and `(mlo*WR + undefined)` is `NaN`. That would poison the memo silently.

**Watch for:** a wild is legal against everything, so branching widens sharply. Expect `fk`
(fork count) up and the 250k cap closer.

**Verify:** L21 across all five outcomes; `exh` must not report `bad`.

### Stage 2 — teach double · unlocks L111

Add the second value to the waste. Only one bit is needed: the second value is *derived*
(`secondOf(primary)`), so the state needs "is the waste a double", not another rank.
`WR` 15 → 30, or a separate `×2` factor.

**Verify:** L111 across all five outcomes; confirm both branch orders in `slotTakes` are
reachable — the ordinary rule is tried before the fallbacks, and that ordering decides which
branch a tap resolves on.

### Stage 3 — teach lock & key · unlocks L7

Add a move to the recursion: when a revealed key and a revealed lock both exist, one option
is "collect the pair" — two tiles out of the mask, no draw spent, the waste untouched. No new
key field.

Reproduce the lowest-index partner search here too, or the proof describes a game where the
player chooses the pairing and the player does not.

**Verify:** L7 across all five outcomes. Watch the `tv` arithmetic — a pair collect changes
cards-left without changing the draw index.

### Stage 4 — teach plus · unlocks L12, closes ISSUE-011 properly

Pre-commit the granted ranks at build time (they are chosen by `supplyPick()` at runtime
today, which is exactly why no deck can be pre-committed). Then:

- `plusClose(mask)` — close the cleared set over any tile whose blockers are all cleared.
  `plusSweep()`'s rule on a bitmask, idempotent.
- `DJR` widens to `DECKN + PLUSTOTAL + 2`.
- The `tv` check reads a deck length derived from the mask, not a constant.

**Verify:** L12 across all five outcomes. Expect coverage below the pre-revert 1.3.0 figures;
the difference is proofs that were never real.

### Stage 5 — up & down: do not attempt

Recorded as a decision, with §3.3's arithmetic as the reason. Revisit only if `exh` gains an
iterative-deepening or per-level cap, and even then only for k≤2.

---

## 5. Risks

| risk | why it matters | mitigation |
|---|---|---|
| Wild's branching blows the 250k cap | `bad` → falls through to re-deal → live. Safe, but no coverage gained. | Stage 1 alone; measure forks before Stage 2. |
| The `taught` flags drift from reality | a flag set true before the code models it *is* ISSUE-011 again | flip a flag only in the same commit that teaches it |
| Nothing measures band adherence | `reg.js` and the sweeps left in 1.0.2 | any stage claiming an accuracy number needs a harness back first — `git checkout v1.0.1 -- tools/reg.js`, and expect CRLF trouble (see below) |
| `equiv.js` cannot run | it is the only guard on the Stage 0 no-op | recover from `v1.0.1`; if it will not run, Stage 0 rests on case analysis alone and Stage 1 should wait |
| `canMatch` gets bypassed | the defect returns silently | the section comment says nothing else may decide legality; grep for `cyc(` in the provers as a check |

## 5a. Before recovering any harness

Every harness in the deleted `tools/` extracts the script with
`/<script>\n"use strict";([\s\S]*?)<\/script>/`. This clone has `core.autocrlf=true`, so
`index.html` is CRLF in the working tree, the match returns `null`, and the harness dies at
line 4 with `TypeError: Cannot read properties of null (reading '1')` before running a single
case. A recovered `equiv.js` or `reg.js` will hit this immediately. The fix is one character
per harness — `\r?\n` — and it must be reapplied on every recovery, because the copies in
`v1.0.1` predate that repair. **Never read an early exit as a pass.**

## 6. Out of scope

Teaching the DDE-style cost estimators, and the six-obstacle question (a slot in two
obstacle lists). The importer already refuses those combinations.

---

## 7. Open questions for the morning

1. **Stage 0 alone, or Stage 0+1 together?** Stage 0 is a proven no-op; Stage 1 is the first
   real behaviour change and the first that needs a browser session.
2. **Should `readBoard()` show in the panel always, or only on obstacle levels?** It is
   informative on a plain level too — `work` and `free` are just equal there.
3. **Is a harness worth restoring first?** Stages 1–4 each change which director owns a
   level. Nothing currently measures whether the outcome still lands in band. `tools/README.md`
   records how to bring `reg.js` back from git history for a single run.
