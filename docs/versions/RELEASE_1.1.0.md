# Release 1.1.0 — 2026-08-24

Pacing, stages 0 and 1 of the core-director upgrade. The two stages that **cannot
cost verified coverage**; the sealed-eventual-deck work that fixes the L12
arithmetic outright is stage 2 and is not in this release.

## What's new

**Shape is chosen, not accepted.** `searchPass()` used to ship the first deal that
`exh()` proved. It now collects up to `PACE.K` proofs — bounded by `PACE.extraMs`
after the first one, inside the per-value budget that already existed — scores each
with `paceScore()` and ships the best. Anything proved still ships: if one candidate
proves, that candidate is the winner, which is the whole coverage guarantee.

`paceScore()` is all preference, no rejection: penalties for ending on a run under
3, for single-match stutter runs, for dead draws parked in the last quarter, for a
denial that never resolves into a payout, and for the longest chain sitting in the
first quarter — Q-003's predicate, in preference form.

**The ladder prefers a tail worth playing.** `proveFrom()` used to return the first
re-ordering that landed on the target. "Any ordering that still lands" is
overwhelmingly a tail of dead draws, which is what the back half of a re-planned
level reads as. It now collects a few and ships the one whose undrawn tail answers
the board soonest and runs driest least.

**A `Shape` row in the level plan** reports the score and how many proofs it chose
between. `best of 1` means the ranking changed nothing on that level.

## Changed

- L12's plus tiles grant 2 cards each instead of 3 — separate commit, revert it
  alone if the level should keep its original supply. 18 draws for 18 matchable
  cards became 15, moving the level from 1.00 draws per match to 0.67.
- `finishBuild()` displays the winning candidate's seed. Under pooling `B.sd` is the
  last seed tried, not the winner's, and that seed is what a level is reproduced from.
- `gen()` returns its `gaps` layout, which it previously built and discarded.

## Fixed

- **ISSUE-009** — the five-suite gate could not run on a Windows checkout at all.
- **ISSUE-006** — `reassignUnseen()` stripped the granted-card tag (RULE-012).
- **ISSUE-007** — `reDirect()`'s reshaped rung dropped a committed Wild (RULE-009).
- **ISSUE-008** — `reset()` swept Plus Cards before rebuilding the deck.

## Known issues

ISSUE-002 (HIGH, open) — unchanged by this release and still unmeasurable in this
tree. ISSUE-003, ISSUE-004, ISSUE-005 unchanged.

## Verification

    plustest    13 / 13
    streaktest  26 / 26
    colortest   11 / 11
    meter        9 / 9
    truth       18 / 18

Run after the L12 data change, on the CRLF-fixed harnesses. The gate does not
cover the core director at all, so the two claims that matter were measured
directly, by building 14 level/outcome pairs on this build and on 1.0.3 under
identical seeds:

    director flips (verified <-> live)   0 of 14
    target tv changed                    0 of 14
    build wall clock                     9553 ms -> 11938 ms  (125% of base)

    longest chain in the first quarter   3 of 13  ->  0 of 13
    single-match runs, total             24       ->  9
    chains ending on a run >= 5          6 of 13  ->  8 of 13
    chains ending on a run < 3           2 of 13  ->  2 of 13

    pools holding more than one proof    8 of 13 verified pairs

The clearest single case, L20 Close Win: `4-6-3-3-1-2-1-1-1-1-1-1` became
`4-4-4-6-6-1`. The old chain ends in six consecutive single-match runs, which is
the hollow ending this work exists to remove.

**Sample size 14 pairs, not the library.** Generation is time-boxed (ISSUE-004), so
these are two builds rather than a distribution. Nothing here measures band
adherence or the library-wide verified/live split — `reg.js` is deleted. Restoring
it for one run is the only way to put this change on D-007's footing.
