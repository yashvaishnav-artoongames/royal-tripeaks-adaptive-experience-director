# Changelog

## 1.1.1 — 2026-08-24

### Added
- **Director toggle** in the control bar. `Director: auto` is the shipped behaviour —
  verified director first, live only when nothing proves. Clicking it switches to
  `Director: live (forced)`, which builds every level through the live director so its
  steering can be watched on a level that would otherwise be proved and never reach it.

  It is a testing switch and is deliberately narrow: read once in `build()`, never
  written to `VDATA`, not persisted across a reload, and off by default. While it is on,
  the tagline reads `Live director (forced)` and the plan panel says the verified
  director was never asked — a level shown as live under the toggle has **not** failed
  to verify, and nothing in the panel should be read as if it had.

### Changed
- `APP_VERSION` 1.1.0 → 1.1.1. PATCH: off by default and it moves no measured outcome.

### Verification
    plustest 13/13 · streaktest 26/26 · colortest 11/11 · meter 9/9 · truth 18/18

Toggle itself measured on four level/outcome pairs that normally build verified —
L4 Comfortable Win, L4 Close Win, L12 Comfortable Win, L6 Comfortable Win:

    auto -> verified (mode 0) · forced -> live (mode 4) · auto again -> verified
    4 of 4 forced live and restored cleanly, FORCELIVE default at load: false

---


## 1.1.0 — 2026-08-24

Pacing, stages 0 and 1. Full note: `docs/versions/RELEASE_1.1.0.md`.

### Added
- Shape ranking over proved candidates. `searchPass()` collects up to `PACE.K`
  proofs and ships the best-scoring one instead of the first that verified.
  `paceScore()` penalises weak endings, stutter runs, dead draws in the last
  quarter, an unresolved denial, and a front-loaded longest chain (Q-003 as a
  preference). **D-008**: shape is a preference, never a filter — D-007 stays
  rejected and is the reason for that shape.
- `proveFrom()` prefers a re-ordering whose undrawn tail answers the board, rather
  than the first that lands. **D-009**.
- `Shape` row in the level plan: score, and how many proofs it chose between.

### Changed
- L12's plus tiles grant 2 each instead of 3 — commit `dea77fc`, revert alone to
  restore the original supply. 1.00 draws per matchable card → 0.67.
- `finishBuild()` shows the winning candidate's seed, not the last seed tried.
- `gen()` returns its `gaps` layout.
- `APP_VERSION` 1.0.3 → 1.1.0. MINOR: chain shapes and build times move.

### Fixed
- **ISSUE-009** — the verification gate could not run on a Windows checkout.
  `core.autocrlf` rewrote `index.html` to CRLF and every harness regex wanted
  `\n`, so all five suites died before running a case. Dead since 1.0.2.
- **ISSUE-006** — `reassignUnseen()` stripped the granted-card tag (RULE-012).
- **ISSUE-007** — `reDirect()`'s reshaped rung dropped a committed Wild (RULE-009).
- **ISSUE-008** — `reset()` swept Plus Cards before rebuilding the deck.

### Known issues
ISSUE-002 (HIGH, open) — untouched, and still unmeasurable here.
ISSUE-003 (HIGH, open), ISSUE-004 (MEDIUM, by design), ISSUE-005 (MEDIUM, open).

### Verification
    plustest 13/13 · streaktest 26/26 · colortest 11/11 · meter 9/9 · truth 18/18

Plus a direct 14-pair build comparison against 1.0.3: **0 director flips, 0 target
changes**, build time 125% of base, longest-chain-front-loaded 3/13 → 0/13,
single-match runs 24 → 9. Sample, not library: `reg.js` is deleted, so band
adherence and the library-wide verified/live split are unmeasured.

---


## 1.0.3 — 2026-08-24

### Added
- `docs/WHY_THE_DIRECTOR.md` — the objective. Why the Director exists: a level ships as a
  shape and gets its card values from a shuffle, so the experience is a lottery; the
  Director makes outcome a design input. Committed verbatim as received.
- **Q-007** — which outcome bands are authoritative. The paper lists Close Lose 1–3 and
  Comfortable Lose 4–6; `OUT` has 3–5 and 5–8. The demo's lose bands overlap at 5, and the
  shipping constants the paper quotes (`WIN_TARGET_DECK_MIN/MAX = 0..3`) leave the demo's
  Comfortable Win band with no counterpart. Recorded, not resolved.

### Changed
- `docs/AI_CONTEXT.md` points at the objective and names the metric to protect: verified
  levels that missed their target, zero.
- `APP_VERSION` 1.0.2 → 1.0.3.

### Verification
**Not run, by instruction** — docs only, plus a one-character version bump. The 1.0.2
deploy was confirmed rendering at the live URL, which establishes that the patched script
parses; the version readout itself is injected at runtime and was not observable through a
non-JS fetch.

---


## 1.0.2 — 2026-08-24

### Added
- `APP_VERSION` in `index.html`, rendered beside the seed in the control bar, so the
  deployed build identifies itself. Step 9 of `docs/WORKFLOW.md` depends on it.
- `docs/WORKFLOW.md` — `main` is production, the branch model, the verification gate,
  versioning rules, releases and rollback.

### Changed
- `CLAUDE.md` — new "main is production" section. GitHub Pages serves `main` from the
  repository root, so every push to `main` is a live deploy; merges need the gate and
  approval.
- `tools/` reduced to the five fast suites plus `addlevels.js`, the level importer.
- The gate in `CLAUDE.md`, `docs/WORKFLOW.md` and `tools/README.md` rewritten for what
  remains, including what it no longer covers.

### Removed
- 18 harnesses: `reg`, `collide`, `announce`, `band12`, `bands`, `buildchk`, `diag12`,
  `eced_bot`, `equiv`, `fulltest`, `funnel`, `gaps`, `livecmp`, `mkreport`, `pacing`,
  `pingcheck`, `sweep`, `verify25`. The long runs cost more time than they returned.
  Recover any one with `git checkout v1.0.1 -- tools/<name>.js`.
- With them went every automated measurement of band adherence and the verified/live
  split. ISSUE-002 can no longer be reproduced, or a fix for it demonstrated, from this
  working tree.

### Known issues
ISSUE-002 (HIGH, open — now unmeasurable here), ISSUE-003 (HIGH, open),
ISSUE-004 (MEDIUM, by design), ISSUE-005 (MEDIUM, open).

### Verification
**Not run for this change, by instruction.** The five suites last passed on 1.0.1,
before the `index.html` edit — plustest 13/13 · streaktest 26/26 · colortest 11/11 ·
meter 9/9 · truth 18/18 — so that result does not cover `APP_VERSION`. The version
readout has not been observed rendering, and the patched script has not been parsed.

---


## 1.0.1 — 2026-08-24

### Fixed
- **ISSUE-001**: `verifiedAbsorb()` threw `ReferenceError: bd is not defined` on
  every REBAND. `LV.band=bd` referenced a constant removed when the loop moved to
  `bandOrder()`.

### Changed
- `tools/reg.js` now scores against the outcome band when a run changed the deck,
  and against the exact target only when it did not. Comparing to the build-time
  `tv` asked a question the director never promised to answer.

### Added
- `tools/` — 24 verification harnesses, plus `tools/README.md`.
- `levels/` — 15 level JSON files.
- Project memory: `CLAUDE.md`, `docs/`, this changelog.

### Known issues
ISSUE-002 (HIGH, open), ISSUE-003 (HIGH, open), ISSUE-004 (MEDIUM, by design),
ISSUE-005 (MEDIUM, open).

### Verification
    plustest 13/13 · streaktest 26/26 · colortest 11/11
    meter 9/9 · truth 18/18 · reg 96 pass / 25 fail

---

## 1.0.0 — 2026-08-24

Initial commit of the demo as `index.html`, with the Plus Card obstacle, streak
rewards, the Extra Card Experience Director and the two core directors.

Not verified at commit time — ISSUE-001 was present.
