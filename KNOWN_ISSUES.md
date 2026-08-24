# Known Issues

Confirmed problems only. No speculation. Each was reproduced on the current
`index.html` on 2026-08-24.

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
Severity: HIGH · Status: OPEN · Introduced: 1.0.0

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

---

**ISSUE-005 — Plus Card tiles rescue losing boards**
Severity: MEDIUM · Status: OPEN · Introduced: 1.0.0

A plus tile clears itself for free and grants draws, so a board authored to
strand cards can be cleared instead. On L12 (3 tiles × 3 = +9 cards on a 10-card
deck) Close Lose lands at 1 stranded against a band of 3–5.

A plus tile can never be part of a strand set — it always fires if uncovered.
