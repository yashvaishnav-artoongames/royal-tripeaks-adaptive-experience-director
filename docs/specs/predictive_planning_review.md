# Review — "AED Predictive Outcome Planning & Live Director Integration"

Status: **comparison document.** Reviewed against `index.html` at v1.5.0 plus the inert fix
that became 1.6.0. What was subsequently built from it, and what was rejected, is tracked in
`docs/specs/predictive_planning_plan.md` — not here. This file is the evidence, not the
work log.

> The headline: the proposal's architecture is **already in this repository**, at
> `reDirect()` (index.html:2992), and the existing version is **stronger** than the one
> proposed. The gap the proposal reaches for is real, but it is not the gap the document
> describes.

---

## 1. What the current system actually does

Traced from source, not inferred from names.

### 1.1 There are two directors, not one

| | Verified | Live |
|---|---|---|
| when ranks are chosen | at build time, whole level | at reveal / draw time |
| guarantee | **exact target on every legal line** | target range, measured only |
| prover | `exh()` (index.html:2146) | none |
| entered when | `exh()` proves a deal | `exh()` declines |

VERIFIED — `exh()` is **universally quantified**. It walks every legal move
(`for(const i of lg)`), recurses into each, and `if(!r)return null` — so a single line that
misses the target kills the whole proof. The terminal checks are exact equality:
`(deck.length-dj)+gleft!==tv` on a win, `N-c!==tv` on a lose.

This reframes the whole review. The verified director does not *predict* a player path. It
proves the target holds for **all** of them.

### 1.2 Levels carry no card values at all

VERIFIED — every file in `levels/` has exactly these fields: `NumOfCards`, `CardPosition`,
`CardRotation`, `DependedOn`, `NumberOfDeckCards`, and on some levels `PlusCards`
(`{index, Value}`, where Value is how many deck cards the tile grants).

There is no rank, suit or card value anywhere in the level data. **100% of card values are
director-assigned already.** The proposal's framing — "assign values only to still-hidden
cards" — is not a new capability. The only variable is *when* the assignment happens.

### 1.3 When a value is assigned, and what stays controllable

VERIFIED:

- Board slot: `LV.rank[i]` is `undefined` until bound. `dReveal()` (index.html:1951) binds
  it at the moment the slot becomes exposed. `dBind()` (index.html:1836) writes
  `LV.rank[i]` and `LV.LB[i]` and decrements `LV.pool[r]`.
- Deck: `dDraw()` (index.html:2069) mints the card as it is drawn. `di` is the draw index;
  on a live level everything at or past `di` is unminted.
- Controllable set, exactly: `!cl.has(i) && !expo(i)` — not cleared and **not exposed**.
  That is the definition `reassignUnseen()` uses (index.html:2957).

So the proposal's Invariant 1 (revealed cards immutable) is not merely satisfied — it *is*
the data model. A value cannot change after reveal because no code path writes
`LV.rank[i]` for an exposed slot.

### 1.4 State representation

| thing | representation |
|---|---|
| board ranks | `LV.rank[]`, `LV.LB[]` |
| cleared set | `cl` (a `Set`); a 52-bit mask `mlo`/`mhi` inside the provers |
| dependencies | `DEP[i]` — array of parent slots, built from `DependedOn` |
| exposure | `expo(i) = !cl.has(i) && DEP[i].every(p=>cl.has(p))` (index.html:2300) |
| on-screen | `onScreen(i)` — the scroll window (index.html:2324) |
| deck | `LV.deckLen`, `di`, `dk[]`, `LV.pool{}` (remaining supply per rank) |
| board summary | `readBoard()` (index.html:1865) — free, grants, wilds, moving, pairs, orphans, work |
| search state | packed key `((mlo*WR+(w+wd*WASTE_RADIX))*DJR+dj)*PIPS+mt)*PGQR+gk` |

The bitmask is what makes exhaustive search tractable at all.

### 1.5 How player actions move the state

VERIFIED — `snap()` (index.html:2717) pushes a full state record before every action;
`back()` (index.html:2732) restores it. A match sets `wr`/`wl`, increments `k`, then calls
`dReveal()` on the newly exposed slots. A draw calls `dDraw()` and zeroes `RUNLEFT`.

### 1.6 The three systems that mutate the deck

VERIFIED, and they are genuinely three separate systems:

1. **Plus tiles** — level-authored. Fire when the last blocker clears, splice `Value` cards
   at `di`, remove themselves for free. `PLUS{}`, `plusFire`, `plusValue`. Firing is a pure
   function of the cleared set, so `exh()` models it exactly (`plusClose`, `gqPush`).
2. **Streak rewards** — `STREAK_GRANTED`, granted on five cards of one colour.
3. **Rescue / Extra Cards** — `EC`, `ECGRANTED`, `PHASE`. `ecMint()` (index.html:3983) and
   `ecReveal()` (index.html:4002) **replace** `dDraw`/`dReveal` while
   `PHASE === 'rescuePlaying'`. `ECGRANTED` widens rank supply.

**Wild cards**: `LV.wildAt[]` holds the deck positions that mint as `WILD`; `WILD_RANK = 14`;
`canMatch` returns true unconditionally for a wild waste. A wild slot on the board has no
rank and is skipped by `dReveal`, `genLive` and `reassignUnseen`.

### 1.7 The system already invalidates and re-plans

This is the finding that reframes the proposal. `reDirect()` (index.html:2992) runs when the
player does one of the two things that can BREAK a proof:

- a card played off a **wild waste** (`if(ww&&!LV.live&&lf>0&&!ecInRescue())`), and
- a **voluntary draw** with a play available, via `miss1()`.

**CORRECTION.** An earlier draft of this review said it runs on every match and every draw.
It does not. The difference matters twice over: monitoring is event-triggered rather than
continuous, so §15 is **PARTIALLY SUPPORTED** rather than VERIFIED; and both call sites carry
`!LV.live`, so a live build cannot reach `reDirect()` at all — the short circuit on its first
line is not even the thing that stops it. Anything that wants planning on a live build has to
add its own trigger, which is what §5.3 now does.

Event-triggering is defensible on its own terms: a wild play and a voluntary draw are the only
two things a proof does not model, so they are the only two moments a proof can newly fail.

```text
reDirect()
  if(LV.live) return 'live'                    <-- live levels are NOT planned. see 3.1
  allHit(mask, waste, deck, di, ...) -> 'intact'      [monitor: the plan still holds]
  else, in escalating order:
    move ONE undrawn deck card             -> 'replanned'   [smallest intervention first]
    reshuffle the whole undrawn tail       -> 'replanned'
    reassignUnseen(): re-deal every FACE-DOWN
      slot AND the undrawn deck tail       -> 'reshaped'
  nothing worked -> LV.liveDeck = true -> 'live'      [fall back to the Live Director]
```

`allHit()` (index.html:2916) is a second exhaustive prover — the same all-lines
quantification, capped at 90,000 states instead of 250,000 — run against the **actual**
current state.

`health` becomes `"Steering live — aiming for N, no longer proved."` once `liveDeck` is set.
`replans` counts it. `REDIRECT_NOTE` surfaces it in the player-facing note.

### 1.8 Success / failure and telemetry

- `LV.tgt.win` (win or lose intent), `LV.tv` (exact target value), `LV.band` (accepted range).
- Three nested measures in `reg.js`: **Intent Match** ⊇ **In Target Range** ⊇ **Exact
  Target**, plus miss direction (easier / harder).
- `EXHWHY` — why `exh()` declined: `cap / radix / winmiss / losemiss / denial / payout /
  fork / ok`.
- `FAIL{}` build ledger, `log[]` move history (five record kinds), `DRAWTAG`, `beat`, `act`,
  `note`, `health`, `replans`, `CHAINMAX`, `DENIALS`.

---

## 2. Section-by-section classification

| § | Proposal | Current implementation | Gap | Required capability | Complexity / risk |
|---|---|---|---|---|---|
| 2 | Outcome Planning Mode layered on the Live Director | `reDirect()` — planner + monitor + invalidation + fallback, on the two proof-breaking events | **only that it refuses to run on live levels** | let planning run mid-level on live builds | HIGH value, MEDIUM risk |
| 3 | Revealed cards immutable | the data model enforces it; no writer touches an exposed slot | none | — | **VERIFIED** |
| 4 | REVEALED / HIDDEN / DRAWN states | `expo()`, `cl`, `di`, `LV.rank[i]===undefined` | naming only | — | **VERIFIED** |
| 5 | Planning must not replace the Live Director | `LV.liveDeck` fallback; the `LV.live` path stays intact | none | — | **VERIFIED** |
| 6 | Planning trigger, tuned not fixed | trigger is "every action", condition is `!LV.live && !ecInRescue()` | no *eligibility* notion for live levels | a predicate over controllable cards remaining | MEDIUM |
| 7 | Long-horizon state evaluation | `exh()` / `allHit()` — full horizon, all lines | none; current is stronger | — | **VERIFIED** |
| 8 | Predict likely player actions, multiple paths, likelihoods | **all** legal paths, no likelihoods | none — this would be a downgrade, see 3.3 | — | **VERIFIED (stronger)** |
| 9 | Plan confidence score | binary: proved or not | no graded confidence | scoring over near-miss deals | LOW value, see 3.4 |
| 10 | Assign values to future controllable cards | `reassignUnseen()` does exactly this | none | — | **VERIFIED** |
| 11 | Hard / soft / free constraints | binary; `reDirect`'s tiers are *intervention size*, not constraint strength | genuine gap | per-slot constraint model inside the prover key | **NOT SUPPORTED**, HIGH complexity |
| 12 | Planning horizon (near / mid / far) | `reassignUnseen` re-deals **all** hidden cards | genuine gap | horizon-bounded re-deal | **NOT SUPPORTED**, MEDIUM |
| 13 | Target is more than "win" | `tgt.win` + `tv` + `band`; `needPay`, `minDen`, `fk` quality floors | tension / recovery / economy not modelled | multi-dimensional target | **PARTIALLY SUPPORTED** |
| 14 | Controlled uncertainty, avoid a scripted feel | `reDirect` already prefers the smallest intervention (move one card first) | not measured | an over-control metric | **PARTIALLY SUPPORTED** |
| 15 | Plan monitoring | `allHit()` on a wild play or a voluntary draw — not continuously | monitoring is event-triggered, not per-action | continuous or interval monitoring, if it is wanted at all | **PARTIALLY SUPPORTED** |
| 16 | Plan invalidation | `allHit` false → replan → `liveDeck` | rescue **suspends** monitoring rather than invalidating (`!ecInRescue()`, index.html:2827) | decide the intended rescue semantics | **PARTIALLY SUPPORTED** |
| 17 | Re-planning after invalidation | three-tier replan, then fallback | none | — | **VERIFIED** |
| 18 | Live Director / Planner / Monitor split | exists, as one function rather than three named components | structure only | — | **VERIFIED** |
| 19 | Explicit state machine | `LV.live`, `LV.liveDeck`, `PHASE`, `ecInRescue()` — implicit | no named states | optional refactor | LOW value |
| 20 | Invariants 1, 2, 3, 4 | all enforced | none | — | **VERIFIED** |
| 20 | Invariant 5 (do not over-control) | intervention ordering honours it | unmeasured | a metric | **PARTIALLY SUPPORTED** |
| 20 | Invariant 6 (experience, not victory) | `tv`/`band`, plus the plan-neutral tease | experience is unmeasured, see 3.9 | an experience harness | **NOT SUPPORTED** |
| 21 | Named plan telemetry events | `replans`, `REDIRECT_NOTE`, `health`, `EXHWHY`, `FAIL` | event names and a plan ID | an event emitter | LOW complexity |
| 22 | Metrics | `reg.js` covers outcome accuracy fully | planning-success / completion / invalidation rates not aggregated | counters in `reDirect` | **LOW complexity, HIGH value** |
| 23 | Simulate many player paths before production | `reg.js` × 5 bot policies × N runs | the proposal asks for this; it exists | — | **VERIFIED** |
| 24 | Phases 1–10 | 1, 3, 6, 7, 8 exist; 2, 4, 5, 9, 10 partial | see the rows above | — | **PARTIALLY SUPPORTED** |

---

## 3. Challenges to the proposal

### 3.1 The real gap is one line, and the document never names it

```js
function reDirect(){
  if(LV.live)return 'live';        // index.html:2993
```

Planning is **switched off for exactly the builds that need it.** VERIFIED: 19 of 30 builds
are verified (and therefore planned); 11 go live and receive no planning of any kind, ever.

The proposal's §6 trigger is the right instinct pointed at the wrong place. Mid-level
planning is worth far more on a live build than on a verified one — a verified build is
already proved, and a live build has no guarantee at all.

There is a concrete reason to expect it to work: `exh()` declined at **build time**, when
the whole level was unknown. Mid-level, most of the board is dealt and `di` has advanced, so
the state space is dramatically smaller. A deal that could not be proved cold may well be
provable from move 20.

**This is the one part of the proposal worth building, and the document treats it as
incidental.**

### 3.2 "Is assigning future values technically possible?" — yes, demonstrably

VERIFIED. `reassignUnseen()` already re-deals every face-down board slot and the entire
undrawn deck tail, mid-level, and `allHit()` then proves the result. The concern is answered
by shipped code.

Values stay hidden by construction: nothing renders `LV.LB[i]` for an unexposed slot, and
`hid` is defined as `!expo(i)`.

### 3.3 Probabilistic path prediction is a **downgrade**

§8 proposes predicting likely player actions across multiple paths with likelihoods; §9
proposes a confidence score.

The current system quantifies over **all** legal lines and returns a proof. Replacing "holds
on every path" with "holds on the paths we think are likely, at 80% confidence" strictly
weakens the guarantee — and the standing priority is that outcome accuracy is never
compromised. Under that priority this section should be **rejected**, not implemented.

Behavioural variety is already handled on the measurement side: `reg.js` runs five bot
policies (`random`, `greedy`, `cautious`, `drawhappy`, `messy`). That is where player
modelling belongs — in the harness that *checks* the guarantee, not inside the guarantee.

### 3.4 Confidence scoring has no consumer

A confidence number is only useful if some decision reads it. Every decision here is binary:
`allHit` holds or it does not; if it does not, replan; if replan fails, go live. Adding a
score with no consumer adds state to maintain and nothing that reads it — precisely the
defect recorded as ISSUE-012, where `unsound` is written twice in `allHit` and never read.

### 3.5 "How many future states?" — measured, not unknown

VERIFIED from the `PACE` calibration: the most expensive verified build costs **436,421
prover states** and 30,094 generator attempts. `exh()` caps at 250,000 per call; `allHit()`
at 90,000. Mid-level planning is affordable — `allHit` already runs inside a player tap on a
wild play or a voluntary draw.

### 3.6 "Fast enough during gameplay?" — yes, but the current code is nondeterministic

`reDirect()` is bounded by **wall clock**: `Date.now()+400` for the reorder tiers and
`Date.now()+700` for `reassignUnseen`. That is the **mid-round half of ISSUE-004**, still
open. A fast machine buys more replan attempts than a slow one, so replan success is not
reproducible and no A/B across it is trustworthy.

The build half was fixed in 1.5.0 by replacing clocks with two work counters (`WORK`,
`GENC`). **Any work on mid-level planning must fix this first**, or every measurement of it
will be noise. The proposal does not mention this prerequisite.

### 3.7 What actually forces builds live — and the proposal does not address it

VERIFIED:

- **Wild is structurally unprovable.** A wild waste makes `canMatch` return true for
  everything, so the branching factor explodes. Measured: ~104,000 refusals, zero proofs.
- **Up & Down is 13^k by construction** — ranks step on a closed 13-rank ring per completed
  move, so the state space multiplies by 13 per moving tile.

No amount of planning architecture changes this; these are properties of the obstacles. A
mid-level planner helps because the horizon is shorter, not because the obstacles became
provable.

### 3.8 Extra Cards, Wild and Rescue — the honest picture

| event | effect on a plan | current handling |
|---|---|---|
| plus tile fires | deck grows at `di` | **modelled exactly** in `exh` (`plusClose`/`gqPush`) — a pure function of the cleared set |
| streak reward | supply widens | modelled via `grants` |
| wild played | the waste answers everything for one play | **cannot be planned around**; mitigated only by starving its payoff |
| rescue / extra cards | `ECGRANTED` widens supply, `PHASE='rescuePlaying'` | planning is **suspended**, not invalidated (`!ecInRescue()`, index.html:2827) |

The proposal lists Extra Card and Rescue as invalidation triggers. In the current code
rescue **suspends** monitoring instead. Which is correct is a genuine open question — but
note that a wild and an extra card are things the player **pays coins for**. Under the
standing rule that the director must never rely on paid resources, planning around them
would be wrong, so suspend-and-resume is arguably the correct semantics. It should be
decided deliberately rather than changed by default.

### 3.9 "Planning too early feels scripted" — the measured risk is the opposite

§14's worry is over-control. The measured failure mode is under-control: before the inert
fix, live builds missed 58 of 550 and **57 of 58 were easier than intended, none harder**.
The director was not scripting the level; it was leaking clears it never planned.

Over-control is also currently **unmeasurable** — nothing in the repo detects whether a
level feels scripted. §22's "Over-Control Indicators" needs a new harness, and until one
exists that section cannot be acted on.

---

## 4. What is worth building, in order

1. **Fix mid-round determinism** (ISSUE-004, second half). Replace the two `Date.now()`
   deadlines in `reDirect()` with work counters. A prerequisite for measuring anything else
   here.
2. **Aggregate the planning metrics that already exist.** `replans`, the `reDirect()` return
   value and `liveDeck` transitions give planning-success / completion / invalidation rates
   almost for free — and they tell us whether step 3 is worth doing.
3. **Let `reDirect()` run on live builds.** Remove the `if(LV.live)return 'live'` short
   circuit and give live levels a `reassignUnseen` + `allHit` attempt once the remaining
   state is small enough. This is the proposal's real contribution. Measure with `reg.js`
   across all five policies.
4. **Decide rescue semantics deliberately** — suspend (current) versus invalidate.
5. Defer: confidence scores (§9), hard/soft/free constraints (§11), planning horizons (§12),
   the explicit state machine (§19). None has a consumer today.
6. **Reject** §8's probabilistic path prediction as a replacement for exhaustive proof. Keep
   behavioural variety in the harness, where it already lives.
