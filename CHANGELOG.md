# Changelog

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
