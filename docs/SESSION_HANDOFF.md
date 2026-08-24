# Session Handoff

Updated 2026-08-24 (second session).

## What was worked on

ISSUE-002 investigation only, as briefed. `index.html` was **not** modified and
no fix was implemented. Everything below is measurement and documentation.

## Verified this session (LIVE)

`node tools/reg.js`, three sequential runs on the unmodified build at `d0eac56`:

    run 1   pass 91   fail 30   wall 256 s
    run 2   pass 92   fail 29   wall 259 s
    run 3   pass 92   fail 29   wall 254 s

    plustest 13/13 · streaktest 26/26 · colortest 11/11 · meter 9/9
    truth 18/18 · gaps 5/6 (documented harness limit)
    announce pass · verify25 0 broken graphs

Full report, including the ExtraCards-vs-Coins control and the ladder rung
census: `docs/measurements/reg_1.0.1.md`.

## The headline

**ISSUE-002 is real but is not where the failures are.** Of the 30 reg.js
failures, 3 are ISSUE-002, 19 contain a non-terminating play (the new ISSUE-006),
6 are ISSUE-003 and 2 are ISSUE-005.

The documented `96 pass / 25 fail` did not reproduce on any run, and the
documented worst case — `L4 Comfortable Win` at in band 0/10 — measured
**10/10 exact, PASS**.

INFERRED: `reg.js`'s pass count mostly tracks the verified/live split (91/30
here, stable across both reward configurations), because verified pairs almost
always pass and live pairs mostly fail. `96 / 25` is consistent with a faster
machine verifying 96 pairs.

## Opened this session

    ISSUE-006  HIGH   reset() does not restore LV.deckLen. A live level's deck
                      grows monotonically across plays, exhausting the rank pool,
                      which makes dReveal() fabricate supply and dDraw() return
                      null, which makes the level neither win nor lose. Cause of
                      19 of the 30 failures. Proven by direct probe.
    ISSUE-007  MED    reset() does not restore LV.tv. The target ratchets to the
                      band ceiling and stays. 29 of 121 pairs affected. Makes
                      reg.js's "exact" column measure a moving goalpost.
    ISSUE-008  MED    supplyPick() is a uniform random pick, which streak spec
                      §13 explicitly forbids. Candidate root cause of how much
                      the ladder has to absorb.
    ISSUE-009  LOW    APP_VERSION does not exist, so the docs/WORKFLOW.md
                      version gate cannot be applied.
    Q-007             RULE-005 is true of plusFire() and false of
                      addExtraCards(). Conflict named, not resolved.

Q-001 now carries a measured rung census and a reading of its three candidates,
plus a fourth candidate (fix the granted *rank*, not the count). Still OPEN —
nothing was decided.

`RULE-005` and `RULE-012` are annotated with the conflicts found. Neither was
rewritten.

## Added this session

- `docs/WORKFLOW.md` and the updated root `CLAUDE.md` (the "main is production"
  section), both supplied by the user this session.
- `docs/measurements/reg_1.0.1.md`.

## Recommended order for the next session

1. **ISSUE-006 first, before any ISSUE-002 work.** It is a four-line reset fix,
   it is the largest single cause of reg.js failures, and until it is fixed the
   headline measurement for ISSUE-002 is mostly measuring it. Expect reg.js to
   move; say so in the commit and `CHANGELOG.md`.
2. Re-run reg.js three times and re-baseline. `docs/measurements/reg_1.0.1.md`
   predicts the ceiling: with the injection path neutralised entirely
   (`type='Coins'`) the same build scores 106/121, so 106 is roughly what a
   correct absorb path should approach without touching the directors.
3. Then ISSUE-002 proper, on a verified-only sample of 3 pairs — `L4 Close Win`,
   `L5 Comfortable Win`, `L16 Close Win`. Try ISSUE-008 (adaptive granted rank)
   before caps or band changes; it is the cheapest and the spec already requires
   it.

## Do not

- Do not diff whole builds to detect a regression. Generation is time-boxed
  (ISSUE-004); `L5 Comfortable Win` passed run 2 and 3 and failed run 1 on the
  identical build. Compare `exh`/`allHit` on identical inputs — `tools/equiv.js`.
- Do not treat `STREAK_REWARD.type='Coins'` as the fix. It is the control that
  isolates the cause.
- Do not add the deck delta to `tv`. See RULE-007 and D-004.

## Still missing from the repository

`docs/specs/README.md` lists these; the ECED spec and the streak reward spec are
in fact present. Genuinely absent:

- the Plus Card obstacle deep-dive (highest value — RULE-011 exists because of it)
- the ECED architecture review behind D-003
- the empty-rescue correction
- the historical run data behind the ISSUE-003 figures (302/303 runs)

## Housekeeping noticed, not actioned

Root `KNOWN_ISSUES.md` and root `SESSION_HANDOFF.md` are stale duplicates of the
`docs/` copies — root `KNOWN_ISSUES.md` was byte-identical before this session
and is now behind by four issues. `README.md` still says `docs/` is "to be
created" and quotes reg.js as "must stay 48/48"; `tools/README.md` also says
48/48. The real figure is 121 pairs. Left alone rather than changed unasked.
