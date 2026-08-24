# reg.js re-measurement — 1.0.1

Produced 2026-08-24, second session. Machine: Linux 6.18, Node v22.22.2,
container. Build: `index.html` at commit `d0eac56`, unmodified.

**Status: CURRENT.** This supersedes the `96 pass / 25 fail` figure quoted in
`docs/KNOWN_ISSUES.md` (ISSUE-002), `docs/SESSION_HANDOFF.md` and
`CHANGELOG.md` 1.0.1, which did not reproduce here.

## What was run

`node tools/reg.js`, three times sequentially — never in parallel, because
generation is time-boxed (ISSUE-004) and CPU contention changes the result.

    run 1   pass 91   fail 30   wall 256 s
    run 2   pass 92   fail 29   wall 259 s
    run 3   pass 92   fail 29   wall 254 s

LIVE. The documented `96 / 25` was not observed on any run.

`tools/reg.js` prints only the first six issues, so a read-only diagnostic
mirroring its scoring exactly was used to enumerate all of them. It reproduced
run 1 exactly — 125 pairs attempted, 121 built, 91 pass / 30 fail — and adds
per-play attribution by supply source. Scripts were scratchpad-only; nothing in
`tools/` or `index.html` was modified.

## Director split — the number that actually moves the pass count

LIVE.

| | verified | live |
|---|---|---|
| pairs | 91 | 30 |
| pass, `STREAK_REWARD.type='ExtraCards'` | 86 / 91 | 5 / 30 |
| pass, `STREAK_REWARD.type='Coins'` | 89 / 91 | 17 / 30 |

The verified/live split was **identical (91/30) across both configurations and
all runs on this machine**. Verified pairs almost always pass; live pairs mostly
fail. So `reg.js`'s pass count is largely a proxy for how many pairs the
generator managed to verify, not a measure of band adherence.

INFERRED: the documented `96 / 25` is consistent with a faster machine verifying
96 pairs and leaving 25 live. It is a coverage figure wearing an
adherence figure's label.

## The 30 failures, classified

LIVE, `STREAK_REWARD.type='ExtraCards'` (the shipped default):

| count | class |
|---|---|
| 19 | contain a **non-terminating play** — see ISSUE-006. Not ISSUE-002 |
| 6 | live-side steering imprecision — ISSUE-003 |
| 3 | verified, streak ExtraCards only — **this is ISSUE-002** |
| 2 | verified, L12 plus tiles — ISSUE-005 |

The three genuine ISSUE-002 pairs, all verified, all win targets:

    L4  Close Win        held 10/10  exact 4/10  in band 4/10  tv 2 -> 3
    L5  Comfortable Win  held 10/10  exact 0/10  in band 8/10  tv 4 -> 5
    L16 Close Win        held 10/10  exact 6/10  in band 6/10  tv 3

## Coins as a control

LIVE, `STREAK_REWARD.type='Coins'`, same build, same seeds:

    pass 106   fail 15      (vs 91 / 30 with ExtraCards)
    non-terminating plays        0   (vs 19 pairs affected)
    rank-supply violations       0   (vs 60 reported)
    verified failures            2   (vs 5) — both L12, ISSUE-005
    live failures               13   (vs 25) — ISSUE-003

Coins never calls `addExtraCards()`, so nothing enters the deck. Everything that
disappears in this column is caused by the extra-card injection path, and
everything that remains is not.

Isolating ISSUE-002's true verified-side footprint by difference:
**3 of 91 verified pairs** — `L4 Close Win`, `L5 Comfortable Win`,
`L16 Close Win`.

## Ladder rung usage

LIVE, across every supply change in the ExtraCards run:

    keep    616      adjust  496      replan  159      reband   32      live   574

    supply changes by source:  StreakReward 1732 · PlusCardObstacle 145

This answers the "Next" line of Q-001 ("measure how often each rung fires per
reward type"). `live` is the second most common outcome of a supply change —
574 of 1877. Every one of those is a verified level abandoning its proof
mid-play.

With Coins the same census is 147 supply changes, all `PlusCardObstacle`:

    adjust 68 · keep 38 · replan 30 · live 10 · reband 1

## Not reproduced

The ISSUE-002 worst case as documented — "`L4 Comfortable Win` — outcome held
10/10, in band **0/10**, deck changed in all 10 runs" — did not reproduce.
Measured here, LIVE:

    L4 Comfortable Win   held 10/10   exact 10/10   in band 10/10   PASS

No verified pair anywhere in the run scored in band 0/10. The worst verified
case measured is `L4 Close Win` at 4/10. In-band 0/10 does occur, but only on
**live** pairs (`L10 Comfortable Lose`, `L17 Close Lose`, `L17 Comfortable
Lose`, `L17 Last Card Win`, `L22 Close Lose`, `L22 Comfortable Lose`).

UNKNOWN whether the documented figure was a different build, a different
machine, or a live pair recorded under a verified label.

## Other suites

LIVE, all at their documented numbers:

    plustest 13/13 · streaktest 26/26 · colortest 11/11 · meter 9/9
    truth 18/18 · gaps 5/6 (6th is the documented harness limit)
    announce pass · verify25 0 broken graphs

## Unbuildable pairs

VERIFIED, 4 of 125, all arithmetic rather than defect:

    L1  Comfortable Win, Close Win
    L11 Comfortable Win, Close Win     NumberOfDeckCards = 1, so DRAWS = 0

A win target asking for 1–3 or 4–6 unused draws cannot be met with 0 draws.
