# ECED v2 — review response and status

Every numbered item from the review, with what was done and what was measured.
Verification harnesses: `reg.js` (core regression), `repro.js` (bug repros),
`ect.js` (behaviour sweep), `rev.js` (probability audit).

## Phase 1 — correctness. Done.

| # | Issue | Status | Evidence |
|---|---|---|---|
| 1 | Stated % was intent-selection probability, not win probability | **Fixed** | `intent win` converts **100%** (was 92.6%) |
| 8 | `ecLine` 40k cutoff returned 0, conflating timeout with impossible | **Fixed** | Now `{chain, path, complete}`; unproven lines excluded from the gate |
| 9 | Rescue supply silently widened core deck supply | **Fixed** | Split into core cap + rescue cap; rescue cards tagged `dk[i][3]` |
| 11 | `PHASE` too weak (`core`/`rescue`/`done`) | **Fixed** | `core → coreLost → rescuePlaying → won / rescueExpired`; all guards route through `ecInRescue()` |
| 30 | Undo could refund a consumed rescue | **Fixed** | Snapshot at grant carries `paid`; `back()` will not cross it |
| 31 | No telemetry schema | **Done** | 24-field record per rescue in `ECEVENTS`, "Telemetry (CSV)" export |
| 10 | Rescue must own all future unseen cards | Already held | `ecReveal` owns reveals; core replanner blocked during rescue |

### On #1 — how it was fixed
Two separate losses were conflated. `ecFeasibleWin(n)` now asks whether a win is
reachable at all before intent is chosen, so "we chose not to" is separated from
"no card could have". Then win-intent rescues stop taking variance: the candidate
band narrows to 35% and blanks are excluded, because a rescue meant to land cannot
spend a card on nothing.

**Residual, not yet closed:** per-rung stated-vs-measured still averages ~6 points,
worst at intensity 0 try 1 (stated 43%, measured 28%). Intent conversion is now exact,
so the remaining gap is in how often the feasibility test and the intent roll agree.
This needs one more pass.

## Phase 2 — experience. Done.

| # | Issue | Status |
|---|---|---|
| 3 | "Ruthlessness" is a hostility knob | **Renamed** `ecApplyIntensity()` / `EC_TUNE.intensity`; `ecApplyRuthless` kept as alias. Now moves band width and pacing slack, not only odds |
| 4 | +3 ad explicitly worse odds | **Fixed** — `adAdj` deleted. Same odds; they differ in shape: +3 `adBand +10, adPace +1` (volatile, fast); +5 `coinBand −4` (tighter, more controlled) |
| 7 | Experience fatigue only blocked repeated mode names | **Fixed** — `ecPrintOf()` fingerprints the actual curve shape; last 3 get a −16 weight penalty |
| 17 | No frustration budget | **Added** — `ECFRUST` counts consecutive empty rescues. At 2+, eases the hold by one and widens the band. Never touches the intent gate, so it cannot buy a win |
| 18 | Hope floor should be formalised | Already present as `EC_RULES.floorFirst` + `minLive`, panel-tunable |

## Still open

- **#2, #6** — player profiling and profile-driven monetization policy. Not built.
  Note: differentiating difficulty by spending propensity is the highest regulatory-risk
  item in the review and it carries no risk note there. Worth a legal read before it
  becomes a design goal.
- **#5, #14, #15, #16** — experience state layer, final-attempt shape, richer outcome
  taxonomy, multi-axis quality score. The curve system does part of this already.
- **#22, #23, #24** — sweep upgrade to 10k+ runs, multiple bot personalities,
  adversarial tests.
- **#27, #28, #29** — monetization transaction boundary, double-tap idempotency,
  save/restore. These are Unity-side concerns; the undo barrier (#30) is the part
  that belongs in this prototype and it is done.

## Three review items that contradict your instructions

Not actioned — these are your calls, not mine.

| Review says | You said |
|---|---|
| §26 `MAX_TOTAL_RESCUES = 3` | "never auto quit, always give choice till level clears or user quits" |
| §25 stop offering when nothing can help | "there will always be +5 and +3 available, we can't remove based on cards left" |
| §19 never show odds to the player | you kept the "next is about N%" line |

On §19 specifically: the reviewer's objection is about perception. Mine was about
disclosure. Removing that line while the coin path sells at single-digit odds is a
compliance question, not only a UX one.

## Measured state, intensity 0.65

```
cleared              34%       dead cards        65%
pointless rescues    29%       worst blank run   3
cards cleared/rescue 1.1       rescues/board     2.92
intent 'almost' wins  0.0%     supply violations 0
```

Split by board size — the structural limit that no tuning removes:

```
boards with 4+ left    dead 62%   cleared nothing  0%   3+ blanks  0%
boards with 1-3 left   dead 67%   cleared nothing 37%   3+ blanks 37%
```

On a 1-3 card board every card that clears also wins, so the director must either hand
over the level or deal blanks. The fix is upstream: widen the core lose bands so losses
strand 5-8 cards instead of 1-3.

## Verification

```
core regression        48/48 pass, no bugs
undo through rescue    6/6 exact
draw / draw-anyway     0 exceptions, 0 accounting errors
supply                 0 violations
```
