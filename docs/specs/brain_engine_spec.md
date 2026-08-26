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

That is a proof by case analysis. It was also confirmed **empirically** — see below.

#### The empirical guard, and the trap it walked into first

`docs/measurements/prover-equivalence.js` (recovered from `tools/equiv.js` at `v1.0.1`, which
was built for exactly this job) loads two builds into separate VM contexts behind a DOM stub
and calls `exh()` and `allHit()` on **identical captured inputs**. Its own header explains the
shape: the generator around the provers is time-boxed, so comparing whole builds can never be
deterministic — comparing the two functions directly isolates the change from the wall-clock
search around it.

```bash
git show HEAD:index.html > /tmp/baseline.html
AED_BASELINE=/tmp/baseline.html node docs/measurements/prover-equivalence.js
```

**On first run it captured zero cases and reported agreement.** That is a vacuous pass and
exactly the ISSUE-001 shape — a green result from a harness that never ran. The cause: every
built-in level now carries an obstacle, so every one is steered live, so `genLive` returns an
empty deck, and the capture loop skips any level whose deck is empty. **There is no
obstacle-free level left in the built-in table for the prover to own.**

The script therefore strips the obstacle fields from `LEVELS` in *both* contexts before
capturing — same real geometry, no obstacles, so the prover owns the levels and the
comparison is real. With that in place, against a 1.5.0 baseline:

```
captured 24 real (rank, deck, target) inputs
comparisons (7 deck growths each) : 168
identical                         : 168
differing                         : 0
```

Two things follow. Stage 0 is confirmed a no-op by measurement as well as by case analysis.
And **adding one obstacle-free level back to the built-in table would make this guard work
without the strip** — worth doing before Stage 1, since stages 1–4 each change the prover and
this is the only thing watching them.

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

**Plus — this claim was WRONG, and Stage 4 found it.** The original text said: *which tiles
have fired is fully determined by the mask, so the deck's length is too. No new key field.*
The first half holds. The second does not. `plusFire()` splices grants at **`di` — the current
draw position** (`dk.splice(di,0,…)`), so the deck's *length* is a function of the mask but its
*order* is a function of the path: two lines reaching the same mask, having fired the same
tiles at different draw indices, hold different decks. Modelling plus exactly needs the
**pending-grant queue** in the state, which is very much a new key field. See §4.4.

**Up/down cannot be keyed on a move counter.** A tile is frozen until *revealed*, so its live
rank is `start + step × (moves since ITS reveal)`. Two lines can reach the same mask having
made different numbers of moves, and the mask does not record when each tile was uncovered —
reveal time is not recoverable from the state. The live rank must be carried per tile, hence
13^k. At k=2 that is ×169 against a 250k cap; at k=8 (L1499's shape) it is ×8.2e8. **This is
a property of the obstacle, not of the implementation.** Up/down stays live.

### 3.4 What each stage unlocks — PREDICTED, and the first one was wrong

The original prediction, from the level table alone:

| after stage | predicted verified levels |
|---|---|
| today | none |
| 1 · wild | L21 |
| 2 · double | L21, L111 |
| 3 · lock & key | L21, L111, L7 |
| 4 · plus | L12, L21, L111, L7 |

**Stage 1 shipped and L21 did not become verified.** Measured with
`docs/measurements/director-ownership.js`:

```
level   obstacles     verified   live   why live
L21     wild                 0      5   verify 41740, supply 260
L6      none                 5      0
```

The gate opened exactly as intended — `why live` says `verify`, meaning the prover **ran** and
rejected 41,740 candidate deals, where the untaught levels say `gate refused, prover never
ran`. So Stage 1 is mechanically correct and still buys no coverage.

The likely reason is the thing that makes a wild a wild: it is legal against **anything**, so
every position carrying one branches far wider, and `exh()` demands that *every* legal line
land on the exact target. Widening the branching multiplies the ways a line can miss. Teaching
the prover the rule was necessary; it was not sufficient, and the difference between those two
is the lesson of this stage.

#### The measurement — TAKEN, and it settles the question

`exh()` returned null for five different reasons and the failure ledger called all of them
`verify`. `EXHWHY` now counts them apart, and
`docs/measurements/exh-decline-reasons.js` reports them per level:

```
level  obstacles  ver     cap  radix  winmiss  losemiss  floors   proved
L21    wild       0/5       0      0    38546     70405       2        0
L6     none       5/5       0      0     3101      6830      18        9
L12/L111/L7/L41  (gate refused, prover never ran)

Totals   cap 0   structural 118882   floors 20   proved 9
```

**Not one candidate deal, on any level, ever ran out of search budget.** Every refusal is
structural: a deal that cannot hold its target on *every* legal line. **Raising the 250k cap
would change nothing**, and that is now measured rather than assumed.

The comparison against the control is the sharp part. L6 took ~9,900 refusals to find 9
proofs — roughly one in eleven hundred. L21 took ~109,000 refusals, **eleven times as many
attempts, and found none at all.**

#### What that means for the plan

The binding constraint is not the prover's knowledge, and it is not its budget. It is that
`exh()`'s guarantee — *every legal line lands on the exact number* — gets harder to satisfy in
proportion to how much choice the obstacle hands the player. A wild is the extreme case: it is
legal against anything, so it multiplies the lines that must all agree.

So **teaching the prover an obstacle and getting coverage back are two different projects.**
Stage 1 finished the first for wild and demonstrated that the second does not follow.

Two consequences worth deciding before stages 2–4:

1. **Stage 2 (double) faces a milder version of the same force.** A double answers two ranks
   where a wild answers thirteen, so the branching grows far less — but it grows. The
   prediction that it unlocks L111 should be treated as untested, exactly like Stage 1's was.
2. **A wild level may need a different guarantee, not a better prover.** If every line cannot
   be made to land on one number, the honest options are to prove a *band* rather than a
   number, or to accept live steering for wild levels permanently and say so. That is a
   design decision about what "verified" promises, and it is above this spec's pay grade —
   it belongs in `DECISIONS.md` once someone chooses.

**Stage 2 then shipped and L111 DID become verified, 5/5.** So the score on predictions is one
wrong, one right — and the two together explain each other. See Stage 2 for the gradient: the
cost of an obstacle to the prover tracks how many ranks it lets the player answer with. Two is
nearly free; thirteen is fatal.

**Stage 3 then shipped and L7 became verified 4/5** — the theory's first forward
prediction, and it held. Only Stage 4 remains unmeasured. L41 stays live throughout, by
design.

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

**Verify:** `prover-equivalence.js` reporting zero differences against a 1.5.0 baseline (§3.1), plus
`brain-engine-validation.js`, plus every level still building and behaving as it does now.
If `equiv.js` shows a single difference, the no-op claim is wrong and nothing else in this
plan can be trusted — stop there.

### Stage 1 — teach wild · SHIPPED, and it did not unlock L21

Two changes, both landed. `canMatch` already handled the slot. `exh`/`allHit` now write
`WILD_RANK` to the waste after playing a wild, via `wasteAfterPlay()` — they previously wrote
`rank[i]`, which for a rankless wild is `undefined`, and `(mlo*WR + undefined)` is `NaN`, which
poisons the memo key silently instead of throwing.

**A second wild defect turned up while doing it.** A wild in the *deck* is
`['WILD','',false,false,true]` — its rank slot is an **empty string**, not a rank and not
`WILD_RANK`. Both provers read `deck[dj][1]` raw, so `''` went into the key, coerced to 0, and
quietly aliased with a real rank. Deck wilds reach the prover through streak rewards on a
verified level, so this was live rather than theoretical. `wasteAfterDraw()` fixes it.

**Result:** see §3.4. The prover now runs on L21 and cannot prove it, and the follow-up
measurement shows why: zero budget exhaustion, ~109,000 structurally impossible deals.
`OBS.wild.taught` is `true` because the rule is genuinely modelled — the flag tracks whether
the prover understands the obstacle, not whether any particular level happens to prove. Those
turn out to be very different things, which is the most useful thing this stage produced.

**Verified no regression:** `prover-equivalence.js` against a stage-0 baseline, 5 captured
inputs, 35 comparisons, 35 identical, 0 differing. The control level is untouched.

### Stage 2 — teach double · SHIPPED, and L111 is verified 5/5

The waste field is doubled (`WR = WASTE_RADIX*2`) to carry one bit: whether the card on the
waste is itself a Double Value and so answers on two ranks. A second *rank* field would have
been the obvious move and the wrong one — the second value is `secondOf(primary)`, so a bit is
all it is. `wasteSecond(w,wd)` decodes it; a wild waste has no primary to derive from and is
never a double.

`allHit` gained a trailing `w0d`. Every caller passes the live head, so it defaults to reading
`wl[3]` — the same field `slotTakes()` uses — rather than making nine call sites compute a
value they would all compute identically.

**Result — the prediction held this time:**

```
level   obstacles   verified   structural refusals   proved   hit rate
L6      none             5/5                 9,881        9   ~1 in 1,100
L111    dbl              5/5                25,457       20   ~1 in 1,270
L21     wild             0/5               105,987        0   none in 106,000
```

The verified director owns **10 builds** where it owned 5 before, and L111 is the first
obstacle level it has ever owned.

**And the gradient confirms the Stage 1 diagnosis.** The hit rate tracks how much choice the
obstacle hands the player: a double answers **two** ranks and costs almost nothing (1,270 vs
1,100 against the control); a wild answers **thirteen** and costs everything. That is the same
force in both cases, and it is now measured at two points rather than argued from one.

`cap` remains **0** everywhere — the memo key doubled exactly as §3.2 predicted and nothing
came near the budget.

**Verified no regression:** `prover-equivalence.js` against a stage-1 baseline, 35
comparisons, 35 identical, 0 differing. Widening `WR` changes every key's integer value and
none of its equivalence classes, so the memo behaves identically on levels without doubles.

### Stage 3 — teach lock & key · SHIPPED, L7 verified 4/5

Both provers carry a pair-collect branch: two tiles out of the mask, no draw spent, the waste
untouched, and `mt` carried through unchanged because a pair collect is not a match and cannot
feed the streak meter. No new key field — the mask already records which tiles are gone, and it
still shrinks by two, so the recursion cannot stall on it.

The lowest-index partner search is reproduced: every revealed key is a separate branch, and
each takes the lowest-index revealed lock. Letting the imaginary player choose the pairing
would prove a game they do not have.

**Result — the theory's first real prediction, and it held:**

```
level   obstacle    extra ranks   verified   refusals   proved   hit rate
L6      none                  0        5/5      9,995        9   ~1 in 1,110
L7      lock & key            0        4/5     11,860       10   ~1 in 1,186
L111    double               +1        5/5     22,539       20   ~1 in 1,127
L21     wild                +12        0/5    104,501        0   none in 104,500
```

After Stage 2 the theory said the cost of an obstacle tracks **how many extra ranks it lets
the player answer with**. Lock & key adds *none* — the tiles answer only each other — so it
should have cost nothing. It cost nothing: L7's hit rate sits between L6's and L111's, and all
three are within about 8% of one another while the wild remains infinitely worse. That is the
first prediction this theory made in advance rather than after the fact.

The verified director now owns **14 builds**, up from 5 before any teaching began.

**Why 4/5 and not 5/5, and why it is not this stage's fault.** L7's Comfortable Lose reports
`partition 21000` and — visible in the per-outcome detail — **all zeros across every `exh`
counter**. The prover never ran for that outcome. The build failed 21,000 times at the
partition stage, upstream of any proof, because that band wants 5–8 of 11 cards stranded on a
layout whose lock/key pair clears two of them for free. That is arithmetic about the level's
shape, not a limit of the prover, and the counters are what make the difference legible.

**Verified no regression:** `prover-equivalence.js` against a stage-2 baseline — 70
comparisons now that L111 is verified too, 70 identical, 0 differing.

### Stage 4 — teach plus · DESIGNED AND PRICED, deliberately not shipped

Stage 4 was started, and the first thing it produced was a correction to this spec. The
original plan above rested on *"no new key field"*, and that is false — see §3.3. Below is
what it actually costs, measured, and why the gate is still closed.

#### It is affordable — measured, not estimated

`docs/measurements/state-counts.js` reports what the *winning* proof on each verified build
actually explores:

```
L111  13 cards, deck 7    19–27 states
L7    11 cards, deck 10   28–32 states
L6    21 cards, deck 10   52–264 states     <- worst of any verified build
```

**264 states against a 250,000 cap.** The headroom is roughly a thousandfold, which reframes
the whole exercise: the cap was never the constraint, and `cap 0` in every decline measurement
so far was not luck.

Pricing L12's queue against that: three tiles at Value 3, so pending-count combinations
`4³ = 64`, times up to `3! = 6` orderings of simultaneously-pending blocks — an **upper bound
of ×384**, giving `264 × 384 ≈ 101,000`. **It fits**, and the true figure is far lower, because
a tile is only pending between the play that uncovers it and the next draw. A tighter encoding
exists too: cards are drawn from the front, so every block behind the first is *full*, and the
state reduces to (ordered list of pending tiles, remaining count of the front block) — about
×48 for L12.

#### What it actually requires — four parts, not three

1. **`plusClose(mlo,mhi)`** — close the mask over any tile whose blockers are all cleared,
   `plusSweep()`'s rule on a bitmask, idempotent. Uncontroversial.
2. **Pre-committed grants.** `supplyPick()` chooses granted ranks at *runtime*, so the builder
   must choose them instead and store them per tile, and `plusFire()` must use the stored ones
   on a verified level. **This changes live gameplay, not just the prover** — the only part of
   this whole plan that does.
3. **The pending-grant queue** in both provers, with the key widened to carry it.
4. **Draws served from the queue first**, mirroring `splice(di,0,…)`: last emitted, first drawn.

#### Why the gate is still closed

A wrong plus model does not fail safe. It produces **proofs about a game the player is not
playing** — which is ISSUE-011 exactly, the defect this entire engine exists to remove. Stages
1–3 could each be checked line by line against their live counterpart (`canMatch` against
`slotTakes`, the pair branch against `lkCollect`). Part 2 has no live counterpart to check
against, because it *creates* new runtime behaviour.

So: designed, priced, and stopped short of shipping a model that cannot be verified before it
is trusted. **The judgement call is whose to make, not mine to assume.** Two ways forward:

- **Ship it and verify in the browser.** The measurements will say whether L12 proves;
  `prover-equivalence.js` will say whether L6/L111/L7 regressed. Neither can confirm the plus
  model is *right* — only a play-through can.
- **Leave plus live, permanently and on purpose.** L12 is steered honestly today. That costs
  five verified builds and closes ISSUE-011 by gating rather than by proving, which is a
  legitimate answer and already the accepted one for up/down.

One tempting shortcut, rejected: if every grant on a level shared a single rank, order would
stop mattering and the state would collapse to a count (×10, trivial). But nine identical
cards from three tiles is a visibly worse game, and buying prover coverage with player
experience is the wrong trade in a project whose whole premise is the opposite.

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
| the equivalence guard silently compares nothing | a vacuous pass reads exactly like a real one — this already happened once, see §3.1 | check the captured-case count before reading the result; zero cases is a failure, not a pass |
| no obstacle-free built-in level | the guard needs one, or it must fake one by stripping fields | add a plain control level to the table before Stage 1 |
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
