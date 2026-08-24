# AI Context — durable project knowledge

Last verified against `index.html` on 2026-08-24.

## What this is

A single-file browser demo of an Adaptive Experience Director for TriPeaks
solitaire. It generates levels that land on an *authored outcome* and proves they
do so before the player sees them. VERIFIED — no build step, no dependencies;
open `index.html`.

**Why it exists is in `docs/WHY_THE_DIRECTOR.md`** — read it before proposing a
change to the directors. A level ships as a shape and gets its card values from a
shuffle, so the experience is a lottery; the Director makes outcome a design input
instead of an observation. The metric that paper names, *verified levels that
missed their target: zero*, is the one to protect. Its outcome bands predate the
lose-band widening — see Q-007.

## The game loop

Tableau cards sit in a dependency graph. A card is playable when every card
blocking it has been cleared and its rank is adjacent to the waste card
(±1, King wraps to Ace, suit irrelevant). Otherwise you draw from the deck.
Clear the tableau to win; run out of deck with cards left to lose. VERIFIED.

## Outcomes

Five, in `OUT`. Each has a band and an exact target `tv`. VERIFIED.

| Outcome | win | band | `tv` means |
|---|---|---|---|
| Comfortable Win | yes | 4–6 | draws left unused |
| Close Win | yes | 1–3 | draws left unused |
| Last Card Win | yes | 0–0 | cleared on the final draw |
| Close Lose | no | 3–5 | tableau cards unreachable |
| Comfortable Lose | no | 5–8 | tableau cards unreachable |

## Two directors

**Verified** pre-commits a deck and proves via `exh()` that *every legal line*
lands on `tv`. The player cannot change the outcome by playing differently.
VERIFIED in code; LIVE — 302 runs, 100% outcome held, 100% exact target.

**Live** holds no plan. It mints each card at the moment it is drawn, steering
toward the target. LIVE — 303 runs, 91% outcome held, 30% exact target.

A level falls to Live when the generator cannot prove any deal. This is the
single most important quality axis in the project: every measured outcome
failure has been on the Live side.

## The recovery ladder

Anything that changes the deck mid-level enters through one function,
`onGameplaySupplyChanged()`, which dispatches to whichever director owns the
level. The verified path climbs down until something proves:

    KEEP     the authored number still lands
    ADJUST   re-order the undrawn deck, re-prove
    REPLAN   re-deal everything unseen, re-prove
    REBAND   another value inside the outcome band
    LIVE     hand the rest to live steering

Only unseen state is ever touched. Cards already drawn or played are the
player's committed reality. VERIFIED.

## Three separate systems grant extra cards

They are constantly confused. See `docs/GLOSSARY.md`.

1. **Plus Card** — a level-authored map obstacle. This repo's `PlusCards` JSON key.
2. **Extra Card Experience Director (ECED)** — the +3 / +5 rescue offered when
   the deck runs dry.
3. **Streak reward** — paid when the 5-card streak meter completes.

## ECED

Takes over once the core level has ended and the player buys a rescue. Owns every
card it deals. Its central mechanism: **intent is a constraint, not a weight.**
A rescue told to fall short is gated on `ecLineFull()` — the most cards a rank
can strip under *any* play order — so it cannot be handed a winning card.
LIVE — `almost` intent wins 0.0% across every measured configuration.

One dial, `EC_TUNE.intensity` (0–1), interpolates twelve derived values through
`EC_ENDS`. `EC_RULES` sits above the dial as satisfaction floors that hold at
every setting.

## Plus Card obstacle

A map tile the player never touches. When its last blocker clears it fires by
itself, grants `Value` cards to the top of the deck, and removes itself from the
board for free. VERIFIED.

**The property that makes it tractable: firing is a pure function of the cleared
set.** No timing, no randomness, no player choice beyond clearing order. It
therefore adds no state to the verifier — the cleared mask already answers
"has it fired". VERIFIED.

## Verification machinery

`exh()` walks every reachable state to prove an outcome. `allHit()` is the
cheaper "does this still hold from here" check used by the ladder. Both memoise
on a mixed-radix packed key whose radices derive from the deck passed in — not
from a global — so a deck that grows mid-level cannot silently collide.
VERIFIED; `tools/collide.js` measures it.

## Level data

25 levels. 10 built in from the start, 15 imported from `levels/*.json` via
`tools/addlevels.js`. `parseLevel()` reads `NumOfCards`, `CardPosition`,
`CardRotation`, `DependedOn`, `NumberOfDeckCards`, `PlusCards`, and warns rather
than silently accepting malformed input. VERIFIED.

## Known characteristic: the generator is time-boxed

`searchPass` and `build` carry `Date.now()` deadlines, so a marginal level can
verify on one run and fall to Live on the next. This is by design but makes
verification results non-deterministic. See ISSUE-004.
