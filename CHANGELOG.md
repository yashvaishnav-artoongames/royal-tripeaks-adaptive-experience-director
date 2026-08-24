# Changelog

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
