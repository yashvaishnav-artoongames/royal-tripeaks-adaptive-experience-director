# Predictive Outcome Planning — implementation plan

Derived from `docs/specs/predictive_planning_review.md`, which compared the proposal
*AED Predictive Outcome Planning & Live Director Integration* against the code.

The review's finding governs this plan: **the proposal's architecture already exists** at
`reDirect()` (index.html:2992), and the existing version is stronger — `exh()` and
`allHit()` quantify over *every* legal line, not over predicted ones. So this plan
implements only the parts that do not already exist, and explicitly rejects two.

Every stage carries a **prediction**. Predictions are recorded so they can be checked and,
when wrong, corrected in place rather than quietly dropped — the same discipline as
`brain_engine_spec.md`, whose Stage 1 prediction was wrong and says so.

---

## 1. The baseline, so any change is visible

All figures deterministic and reproducible (ISSUE-004 build half fixed in 1.5.0).
`random` at 50 runs per build, the rest at 20.

### Before this session — v1.5.0

| policy | in target range | intent match | easier | harder |
|---|---|---|---|---|
| random | 492/550 · 89.5% | 549/550 | 57 | 0 |
| greedy | 197/220 · 89.5% | 220/220 | 23 | 0 |
| cautious | 196/220 · 89.1% | 219/220 | 23 | 0 |
| drawhappy | 181/220 · 82.3% | 218/220 | 21 | 16 |
| messy | 193/220 · 87.7% | 215/220 | 6 | 16 |
| VERIFIED | 950/950 exact target | | | |

### After the inert fix — 1.6.0

| policy | in target range | intent match | easier | harder |
|---|---|---|---|---|
| random | **550/550 · 100%** | 550/550 | 0 | 0 |
| greedy | **216/220 · 98.2%** | 220/220 | 4 | 0 |
| cautious | **219/220 · 99.5%** | 220/220 | 1 | 0 |
| drawhappy | 193/220 · 87.7% | 215/220 | 2 | **20** |
| messy | 193/220 · 87.7% | 215/220 | 6 | 16 |
| VERIFIED | 950/950 exact target | | | |

**What the fix was.** `dReveal`'s inert test compared a candidate rank against two ranks —
the waste and the head of the chain being laid — and never asked the board. A card bound
"inert" could sit one step from another exposed card's rank, so the moment the player played
*that* card the "inert" card became playable: a clear the plan never counted. `dDraw` never
had this hole; it has always asked `canMatch` about every exposed slot. The asymmetry was
the bug. It began life as STARVE THE WILD, gated on a losing target with a wild present; the
gate was the mistake, not the test.

**Note the bias inversion on drawhappy**: 21 easier / 16 harder became 2 easier / 20 harder.
That is Stage 1's subject.

---

## 2. The order changed, on evidence

This plan originally opened with "fix mid-round determinism first, it is a prerequisite for
everything else". That was wrong, and the question that exposed it was simply *will this only
affect the live director?*

**It would not have.** All four wall clocks are on the VERIFIED path — VERIFIED:

- `reDirect()` opens `if(LV.live)return ...`, so a live build never reaches its clocked loops.
- `proveFrom()` is called only from `verifiedAbsorb()`, which is the `else` branch of the
  live/verified split in the extra-card handler.
- `allHit()` is reached only through those two.

So shipping the determinism fix on its own would have replaced the planning budget of a
director sitting at **950/950 exact target** with an uncalibrated work budget, for no live-side
gain at all. Those clocks only become live-director code once Stage 3 lets live builds plan —
so Stage 1 is not a prerequisite, it is **part of Stage 3**, and only the half Stage 3 actually
needs was taken.

| | shipped | who it touches |
|---|---|---|
| 1.6.0 | inert fix (`dReveal`) | **live only** — 89.5% → 100% on random |
| this branch | `HITW` counter in `allHit` | accounting only, no behaviour |
| this branch | Stage 3 — mid-level promotion | **live only** |
| this branch | Stage 2 — planning counters | read-only |
| this branch | Live Inspector | read-only, off by default |
| **deferred** | replacing the four clocks | verified-side; do it when promotion makes them live-side |

---

## 2a. Stage 4 — Live Inspector · SHIPPED

The inert defect survived the whole project because nothing showed it. The numbers said
89.5% and offered no way to ask *why*. Every director decision was invisible.

`INSPON` / `INSP` / `ins()` record each decision; `inspRender()` draws them in the right
column; `inspCSV()` exports them.

Recorded per decision:

| record | what it answers |
|---|---|
| `plan` | owes N over M spare draws → run length; board left, free, wilds |
| `draw` | wanted dead or live, **and which clause** (`quota` / `slack` / `tight` / `noexposed`), dead-set size, rank given, whether it **landed** dead or playable, and a MISMATCH flag if those disagree |
| `reveal` | run before → after, which guard fired (`survival` / `stop`), board left vs draws left |
| `bind` | slot, `chain` or `inert`, rank, how many unblocked; for inert: **`loose` vs `tight`** |
| `plan-check` | `reDirect()`'s verdict — intact / replanned / reshaped / live — and replan count |

The `loose` vs `tight` pair is the 1.6.0 fix in one column: `loose` counts ranks that merely
miss the waste, `tight` counts ranks nothing exposed can answer. A large gap between them is
exactly the clears that used to leak. **Had this panel existed, the defect was one glance
away.**

OFF by default, and every call site gated on `INSPON`, because a recorder that runs during a
harness sweep can change what the sweep measures.

**Acceptance — MET, two ways.**

With the inspector in place and off, `reg.js random 50` returns VERIFIED 950/950 and LIVE
550/550 and the five suites are unchanged — identical to before the patch.

That only exercises the OFF path, so the panel itself was never run by any harness. A separate
smoke test played one L21 round twice on the same seed, once with the recorder off and once
with it on:

```text
recorder OFF: 0 left, 4 draws, 2 attempts, 1 promoted
recorder ON : 0 left, 4 draws, 2 attempts, 1 promoted, 18 records
IDENTICAL - the recorder is inert
inspRender ok, 3483 chars of HTML
  has a table / standing row / planning row: true
  no undefined leaked / no NaN leaked:       true
record kinds: plan=3 reveal=5 bind=5 draw=2 promo=3
off panel says it is off: true
```

Identical play with the recorder on and off is the property that matters: it means the panel
can be left on during a real session without the session becoming unrepresentative.

---

## 3. Stage 1 — drawhappy, and what it is actually made of

### 3.1 Most of it is not a director defect — VERIFIED

`botPlay` scores a win as `res={win:true,v:deckLeft()}` and `drawhappy` calls `miss1()` — a
voluntary draw — at 15% whenever a play is available. So **the measured win margin is
exactly the quantity the bot destroys.** Every voluntary draw lands the level one lower, and
no director lever can hand a deck card back: `LV.deckLen` is fixed and extra cards are paid
for.

The per-build detail confirms where it lands: the worst drawhappy builds are **verified**
ones — L111 Comfortable Win at 5/20 intent, L6 Comfortable Win at 2/20. Those are proofs
collapsing, not live steering. This is ISSUE-015 in numeric form, and index.html:1521 already
documents drawhappy as "ISSUE-015's exact path, and the one the verified guarantee is known
NOT to survive."

**So the ceiling is structural.** Any target measured in unused draws is partly unreachable
against a player who burns them.

### 3.2 There is a real defect underneath it

`dRunLen` recomputes from current state on every action. That is correct for a player who
never wastes a draw, and permanently one step behind a player who wastes at a steady rate —
it rations the whole remaining budget when part of it will be thrown away. `miss` counts
voluntary draws and `di` counts every draw, so the observed rate is already in scope.

### 3.3 Five attempts, and every one of them cost more than it bought — MEASURED

The lever under test is the same in all five: discount the draw budget by the waste rate the
player has already shown. Only *where* it applies differs.

| attempt | drawhappy in range | drawhappy intent | messy in range | messy intent |
|---|---|---|---|---|
| **baseline (1.6.0)** | **193/220** | 215/220 | **193/220** | 215/220 |
| `dRunLen`: `eff = C·(1 − miss/di)` | 191/220 | **220/220** | 182/220 | 218/220 |
| `dRunLen`: half rate | 192/220 | 219/220 | 185/220 | 216/220 |
| `dRunLen`: full rate, gated `di ≥ 4` | 188/220 | 219/220 | 181/220 | 216/220 |
| **survival guard**: `drawsEff = drawsNow·(1 − miss/di)` | **197/220** | **218/220** | 186/220 | 212/220 |

All five are deterministic and reproducible, so these are real differences, not noise.

The three `dRunLen` forms trade margin accuracy for outcome accuracy — the full rate
eliminates all five drawhappy intent misses and adds seven margin misses, because it chains
harder on runs that never needed it. The `di ≥ 4` gate was added on the reasoning that at
`di = 1` a single voluntary draw reads as a 100% waste rate; it made things worse, not
better.

### 3.4 The guard form — my prediction, and it was WRONG

The reasoning was: the `dRunLen` forms inflate the run on *every* win run, but the misses
they fix are **stranded wins**, and there is already a detector for those — the survival
guard `leftNow > drawsNow*1.6`. Make *that* waste-aware and the emergency fires earlier for a
wasteful player while comfortable runs are untouched. It is exactly a no-op when `miss` is 0,
so `random`, `greedy` and `cautious` cannot move.

```js
const drawsEff=(miss>0&&di>0)?drawsNow*(1-miss/di):drawsNow;
if(LV.tgt.win&&leftNow>drawsEff*1.6)RUNLEFT=Math.max(RUNLEFT,newly.length+2);
```

**PREDICTED**: recovers the drawhappy intent misses without the margin cost.

**MEASURED**: drawhappy 193 → **197** in range and 215 → **218** intent, both up, exactly as
predicted — and messy 193 → **186** in range and 215 → **212** intent, both down. Net
negative across the two policies. **NOT SHIPPED.**

The prediction was right about drawhappy and wrong about the thing that mattered, which is
that a fix has to hold on more than the policy it was designed against. Recorded rather than
quietly dropped, because the next attempt at this will be tempted by the same reasoning.

### 3.4a What the five results actually say

Every attempt helps drawhappy at most a little and costs messy every time. messy is
drawhappy plus undo, and `back()` restores `miss` and `di` correctly — so the difference is
not bookkeeping. The consistent direction across five variants says the waste rate is simply
the wrong lever: it is a *past* average being spent against a *future* that undo keeps
rewriting.

**Standing conclusion**: drawhappy's dominant failure is structural (§3.1), and no
director-side compensation measured so far pays for itself. Any further attempt should come
with a mechanism for why messy would not regress, argued *before* the measurement.

### 3.5 Mid-round determinism — RECLASSIFIED, see §2

`reDirect()` is still bounded by wall clock: `Date.now()+400` for the reorder tiers and
`Date.now()+700` for `reassignUnseen`. That is the **second half of ISSUE-004**. A fast
machine buys more replan attempts than a slow one, so replan success is not reproducible.

The build half was fixed by replacing clocks with two counters (`WORK`, `GENC`) and two caps,
after a combined cost unit was tried and rejected — a least-squares fit of milliseconds
against both counters returned a *negative* weight for states, because across these builds
the two are collinear. Two independent caps need no weighting. The same approach applies
here.

**Reclassified.** This is real and still open, but it is a *verified-director* defect today
(§2). Stage 3 does not depend on it, because promotion runs on its own private random stream
and its own work bound and never enters the clocked loops. What Stage 3 did take from Stage 1
is the `HITW` counter — pure accounting, no behaviour change — because promotion needs a cost
unit to bound itself with.

It becomes urgent the moment a promoted level starts hitting `reDirect()`, which it now can.

---

## 4. Stage 2 — planning telemetry, from state that already exists

The proposal's §21 and §22 ask for plan events and rates. Most of the data is already
computed and thrown away:

| metric (§22) | source already in the code |
|---|---|
| Outcome accuracy | `reg.js` — three nested measures, already complete |
| Planning success rate | `reDirect()` return: `intact` / `replanned` / `reshaped` / `live` |
| Plan completion rate | runs that never set `LV.liveDeck` |
| Plan invalidation rate | `allHit` false per action |
| Re-planning success | `replans`, already counted |

whether Stage 3 is worth building.
whether Stage 3 is worth building.

**PREDICTED**: verified builds will show a high replan rate with a low `liveDeck` rate — the
plan bends often and breaks rarely. If instead `liveDeck` is common, mid-level planning is
already failing on verified builds and Stage 3 is unlikely to help live ones.

---

## 5. Stage 3 — the proposal's real contribution · IMPLEMENTED, UNMEASURED

### 5.1 The gap, precisely

```js
function reDirectCore(){
  if(LV.live)return 'live';        // index.html
```

Planning is switched off for exactly the builds that need it. 19 of 30 builds are verified
and planned; 11 go live and are never planned at all.

### 5.2 Why "just delete the short circuit" does not work — VERIFIED

A live build returns `deck:[]` (index.html:1827). It carries `deckLen` — a *count* — and no
cards. `dk` holds drawn cards only, so `dk.length === di` always and there is **no undrawn
tail**. Deleting the short circuit would give: tiers 1 and 2 iterating an empty array, and
tier 3 calling `allHit` with `dj === deck.length`, so the prover would conclude zero draws
remain and evaluate the terminal condition immediately. **It would prove a fiction and
report `intact`.** Worse than not running.

### 5.3 What it required — IMPLEMENTED, and it shipped dead once

1. **Commit a deck tail.** Mint the remaining `deckLen − di` cards from `LV.pool` into `dk`,
   the way `genLive` mints a board — a new generator over the tail only.
2. **Prove it.** Run `allHit` from the current mask against the committed tail.
3. **Keep or discard.** If it proves, the level is promoted: `LV.live=false`, and `reDirect`
   monitors it from then on like any verified build. If not, discard the tail and keep
   minting on demand — no behaviour change.
4. **Eligibility.** The proposal's §6. The honest trigger is not a card count but
   "`allHit`'s cap can afford this state" — try, and let the cap answer.

This is the state machine of §19 arriving for free: promotion *is* the transition from Live
Director to Plan Active, and `liveDeck` is already the transition back.

#### What was actually built

| piece | where |
|---|---|
| `freeDeck` accounts for live builds: `LV.live?Math.max(0,LV.deckLen-di):(dk.length-di)` | `reassignUnseen()` |
| `promoUnknowns()` — face-down slots plus unminted tail | new |
| `promoOK()` — the eligibility filter | new |
| `livePromote()` — mint, prove, keep or discard | new |
| `promoTry(n)` — one entry point for the three call sites | new |
| `PLANB` — work and attempt bounds | new |
| `promoRng(seed)` — a **private** random stream | new |
| `LV.live` and `PROMOS` added to `snap()`/`back()`, `LV.base.live` to `reset()` | existing |
| `REDIRECT_NOTE.promoted` | existing |

`reassignUnseen()` did nine tenths of the work already. It re-deals every face-down slot and
the undrawn tail and touches nothing the player has seen; the only reason it could not serve a
live build was that `dk.length-di` is always 0 there, because `genLive` returns `deck:[]` and
`dDraw` mints on demand. One expression.

**A failed promotion is a true no-op**, and this needed its own machinery. `reassignUnseen(rng)`
consumes randomness, and `rnd()` is the single global stream the whole level is dealt from — so
attempting a promotion on the shared stream would shift every card dealt afterwards, and a level
where promotion *failed* would still play differently from one where it was never tried. Hence
`promoRng`: same generator, private seed, derived from board state and attempt number rather
than from the clock.

**Eligibility is a filter, not a knob.** Every clause is a reason a proof *cannot* land, so it
is cheap refusal in front of an expensive search: not in rescue; `proverTaught()` (the prover
models four obstacles of five, and on the fifth it would prove a different game — ISSUE-011);
no wild anywhere, checked twice (`LV.wildAt` for what `dDraw` mints, `countWilds(dk)` for one a
streak reward granted); attempts under `PLANB.promoTries`; and unknowns under
`PLANB.promoMax`.

**Undo and restart both had to be taught about it.** `snap()` carried `liveDeck` but not
`LV.live`, while `dk` *was* snapshotted — so an undo would have restored the short
pre-promotion `dk` against a level that still believed it had a committed deck, and
`deckLeft()` would read 0 on a level that was not over. `reset()` had the mirror defect: it
branches on `LV.live` at the end, so a promoted level left promoted would deal its minted tail
on the next run and **be a different level** — the same defect `tv`/`band`/`deckLen` had, with
the same remedy.

#### It shipped dead the first time

The first version replaced `reDirect()`'s `if(LV.live)return 'live'` and stopped there. That
was dead code: **both** `reDirect()` call sites carry `!LV.live`, so a live build never reaches
the function at all and the short circuit was never what stopped it. Caught by reading the call
sites, not by reasoning about the function.

Promotion now has three triggers of its own — after a match, after an ordinary draw, and after
a voluntary draw — because all three shrink the unseen region, which is the thing eligibility
measures. The patch that added them asserts the call count so the same mistake cannot repeat
silently.

#### It regressed, and the fallback was why

The one-way version measured as a **net loss** on exactly the two policies that break proofs:

| policy | 1.6.0 | one-way promotion | |
|---|---|---|---|
| drawhappy · in target range | 193/220 | **188/220** | −5 |
| drawhappy · intent match | 215/220 | **206/220** | −9 |
| messy · in target range | 193/220 | **191/220** | −2 |
| messy · intent match | 215/220 | **211/220** | −4 |

Both measures down on both policies, and intent match — the outcome — lost nine runs on
drawhappy. `random`, `greedy` and `cautious` were untouched, which localises it precisely:
those three never draw voluntarily, so a promotion they receive never breaks.

**Promotion was not the defect. The fallback was.** `liveDeck` was built for a VERIFIED level
that stepped off its *authored* deck — reordering that deck is meaningful because someone
planned it. A promoted level's deck is synthetic, minted by `livePromote` a few moves earlier,
so when its proof breaks the right destination is the mode it was already succeeding in, not a
third mode it has never been in. Promotion was one-way; it needed to be reversible.

```js
if(LV.promoted){
  LV.live=true;LV.promoted=false;
  dk=dk.slice(0,di);LV.deck=[];
  poolRebuild();
  RUNLEFT=dRunLen();
  return 'reverted';
}
LV.liveDeck=true;return 'live';
```

Two details that were not obvious:

- **`poolRebuild()`.** `reassignUnseen` mints from its own accounting and never writes
  `LV.pool`. Harmless while a level stays proved — `dDraw` and `dReveal` are not running — and
  a real defect the instant it reverts to live minting against a pool that has not moved since
  the promotion. So supply is recounted from the table: seed, every drawn card, and every bound
  slot including cleared ones, because a card that has left the board still came out of the
  deck.
- **The bindings are kept.** They are still unseen by the player and were proof-consistent
  when made, so discarding them buys nothing. Only the synthetic tail is handed back.

The cycle is bounded: `PROMOS` caps attempts per round at `PLANB.promoTries`, and a revert does
not reset it, so a round can promote and revert at most three times.

#### The full A/B, and where it leaves promotion

Both sides measured against frozen snapshots via `AED_SRC`, so nothing in the working tree
could touch either run. `random` at 50 runs per build, the rest at 20.

| policy | 1.6.0 | 1.7.0 | Δ range | Δ intent |
|---|---|---|---|---|
| random | 550/550 · 550 intent | 550/550 · 550 | 0 | 0 |
| greedy | 216/220 · 220 | **217/220** · 220 | **+1** | 0 |
| cautious | 219/220 · 220 | **220/220** · 220 | **+1** | 0 |
| drawhappy | 193/220 · 215 | 189/220 · 212 | **−4** | **−3** |
| messy | 193/220 · 215 | ~191/220 · ~212 | **−2** | **−3** |

VERIFIED holds 950/950 throughout.

**The split localises the cause exactly.** `random`, `greedy` and `cautious` never call
`miss1()`, so a promotion they receive never breaks — and a promoted level lands on the *exact*
target rather than merely inside the band, which is where their gains come from. `drawhappy`
and `messy` break proofs constantly, and a broken promotion is worse than none.

#### Two fixes, both largely refuted

| | drawhappy range | drawhappy intent |
|---|---|---|
| 1.6.0 baseline | **193/220** | **215/220** |
| one-way promotion | 188/220 | 206/220 |
| + revert to live minting | 188/220 | 211/220 |
| + unbind the hidden board | 189/220 | 212/220 |

The reversibility fix bought 5 intent runs and **exactly zero** range runs — twice, on both
policies. That is what pointed at the bindings: if the fallback only moves which side the level
lands on, something else must own the margin. The binding hypothesis was then tested and bought
**1** run. Right direction, wrong magnitude. Two hypotheses, both argued in advance, both
moving a fraction of what was claimed for them — which is the same pattern §3.3 recorded for
the five waste-rate attempts, and it is now the strongest standing fact about this director:
**confident mechanical reasoning about it has a poor record, and only measurement settles it.**

#### Option 3, written and NOT applied

```js
// in promoOK(), before the attempt cap
if(miss>0)return false;
```

Promotion converts a live level into a proved one, and ISSUE-015 already records that a proof
does not survive a voluntary draw. `miss` counts exactly those draws, so a player who has made
one has demonstrated they break proofs — and handing them a fresh proof buys a guarantee that
will break plus a board laid out for a plan that will not hold.

Provably a no-op for `random`, `greedy` and `cautious`: none of them ever calls `miss1()`, so
`miss` stays 0 and `promoOK` is unchanged. The +2 survives; the −7 disappears by construction.
It would **not** return drawhappy exactly to 193, because promotion can still fire early in a
level before the first voluntary draw.

Strict on purpose. A softer form — `miss>=2`, or a rate — is the obvious next knob if one
voluntary draw proves too blunt for a real player who slips once.

#### Status: kept on the branch, not merged

Promotion ships on `feat/predictive-planning` as a net regression, deliberately, to be
re-measured when more levels are added. Eleven live builds is a thin base to judge it on, and
the three policies it helps are the ones a real player most resembles. **It must not reach
`main` in this state** — `main` is production, and the verification gate in `docs/WORKFLOW.md`
has not been passed for a merge.

#### Still unmeasured, or newly measured


`PLANB`'s four constants remain first estimates. The proof still targets the exact `tv` rather
than anywhere in band — stricter than the promise, which costs success rate but never
correctness. `LV.usd` still goes stale after a promotion (unread, because `dLabel` only serves
live minting, but stale); `LV.pool` no longer does, since `poolRebuild()` handles the one path
that reads it again.

Per-tap cost is unquantified and is the open risk: a promotion attempt may spend up to
`PLANB.deepWork` = 420,000 prover states inside a single tap, and the harness sweeps are
visibly slower than baseline. That has not been measured in a browser.

### 5.4 What it fixes — PREDICTED, and half wrong

Wild remains structurally unprovable (a wild waste makes `canMatch` true for everything;
~104,000 refusals and zero proofs) and Up & Down remains 13^k. Those obstacles are still on
the board mid-level. Promotion can only succeed where the *unknown* was the obstruction, not
the obstacle.

**PREDICTED**: L7 Comfortable Lose converts; L21 (wild) and L41 (up/down) do not.

**MEASURED** (`docs/measurements/promotion-rate.js`, random policy, 10 runs per build) —
**38 promotions from 123 attempts across 11 live builds**:

| live build | attempts | promoted | note |
|---|---|---|---|
| L7 / Comfortable Lose | 12 | **10 of 10 runs** | predicted, and it converts every time |
| L21 / Comfortable Win | 23 | 7 | **not predicted** |
| L21 / Close Win | 22 | 5 | **not predicted** |
| L21 / Last Card Win | 23 | 4 | **not predicted** |
| L21 / Close Lose | 20 | 5 | **not predicted** |
| L21 / Comfortable Lose | 23 | 7 | **not predicted** |
| L41 / all five | 0 | 0 | predicted — refused on `proverTaught()` |

**The L21 prediction was wrong, and the reason is worth keeping.** The unprovability claim is
not wrong — a wild really does make `canMatch` answer true for everything. What was wrong was
the assumption that the wild is *permanent*. `dDraw` splices each fired position out of
`LV.wildAt`, so once the wild has been drawn there is no future wild left to model, and the
rest of the level is ordinary. **The wild blocks the proof only until it is spent.**

That is visible in the depths: every L21 promotion lands at `di` between 8 and 12, never
earlier. The level is unprovable cold, unprovable while the wild is pending, and provable the
move after it is gone.

L41 refuses for the predicted reason and there is no equivalent escape: up & down keeps
stepping for as long as the tile is on the board, so `proverTaught()` is false for the whole
round. The brain-engine spec needs no correction.

The refusal column also shows the size gate doing real work: L21 starts at 19 unknowns and L7
at 16, both over the ceiling of 14, which is why no attempt happens at level start and all of
them happen mid-level. That is the behaviour §6 of the proposal asked for, arrived at by
measuring the state rather than by picking "the last 10 cards".

---

## 6. Stage 4 — rescue semantics, a decision not a change

§16 lists Extra Card and Rescue as plan invalidators. The code **suspends** monitoring
instead (`!ecInRescue()`, index.html:2827) and resumes after.

Both a wild and an extra card cost the player coins. Under the standing rule that the
director must never lean on a paid resource, planning *around* them would be wrong — so
suspend-and-resume is arguably already correct. This needs a DECISIONS.md entry either way,
not a code change by default.

---

## 7. Rejected

**§8, player move prediction with likelihoods.** `exh()` is universally quantified: every
legal move, and one miss kills the proof. Replacing "holds on all paths" with "holds on the
likely ones at 80% confidence" trades a guarantee for an estimate, which the standing
priority forbids. Behavioural variety belongs in `reg.js`, where five bot policies already
live — in the thing that *checks* the guarantee, not inside it.

**§9, plan confidence.** No decision would read it. Every branch is binary. This is the
shape of ISSUE-012, where `unsound` is written twice in `allHit` and never read.

---

## 8. Deferred, with reasons

| § | why not now |
|---|---|
| 11 — hard / soft / free constraints | a real gap, but nothing consumes a constraint tier today; it needs a per-slot field in the prover key, which is the most invasive change in the document |
| 12 — planning horizon | `reassignUnseen` re-deals all hidden cards; bounding it is only useful once §11 exists |
| 14 / §22 over-control | **unmeasurable today.** Nothing detects whether a level feels scripted, and the measured failure mode was the opposite — under-control, leaking clears |
| 19 — explicit state machine | Stage 3 delivers the useful half; a named-state refactor buys clarity, not accuracy |
| 13 — tension / economy targets | needs a target representation beyond `tv`/`band`, and an experience harness to score it |

---

## 9. Risks

1. **Promotion could be worse than not planning.** A committed tail that proves under
   `allHit` still has to survive a voluntary draw, and ISSUE-015 says the guarantee does not.
   A promoted level that then breaks lands back on `liveDeck` — a state that reads
   "no longer proved" to the player.
2. **Confident reasoning about this director has a poor record.** Five variants of the waste
   correction were argued for in advance and all five cost more than they bought (§3.3). The
   pattern is that a change is designed against the policy that exposed the problem and then
   fails on a neighbouring one. Argue the mechanism for *every* policy before measuring.
3. **CLAUDE.md's verification gate names five suites in `tools/`, deleted in `576cb48`.**
   They must be restored from history for each gate run, and `streaktest` is currently
   **23/26**, not the documented 26/26 — three pre-existing failures (win-target retarget,
   and two drawn-wild cases). The documentation needs reconciling with the repo.
4. **Sample size.** These are 220-run measurements per policy. A change whose effect is
   under ~10 runs is inside the noise.

---

## 10. Open questions

1. ~~Does the waste-aware survival guard recover drawhappy's intent misses without the margin
   cost?~~ **ANSWERED: no.** It recovers them on drawhappy (+4 in range, +3 intent) and loses
   more on messy (−7, −3). §3.4.
2. Is there a compensation for a voluntary draw that holds on **both** drawhappy and messy?
   Five attempts say the waste rate is not it. An open question, not a planned stage.
3. What is the replan-to-`liveDeck` ratio on verified builds? (Stage 2 answers it, and it
   gates Stage 3.)
4. Does a committed deck tail ever prove on L21 or L41, or only on L7?
5. Should rescue invalidate or suspend?
6. Is there any measurable definition of "feels scripted"? Until there is, §14 and the
   over-control metrics cannot be acted on.
