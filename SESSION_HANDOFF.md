# Session Handoff

Updated 2026-08-24.

## What was worked on

Transferring the working session's knowledge into this repository, and verifying
the committed `index.html` against its harnesses for the first time.

## Completed

- Project memory written from repository evidence, every claim classified.
- `tools/` added — 24 harnesses, each reading `../index.html`.
- `levels/` added — the 15 imported level JSON files.
- **ISSUE-001 fixed**: `verifiedAbsorb()` threw `ReferenceError` on every REBAND.

## Verified this session (LIVE)

    tools/plustest.js     13 / 13
    tools/streaktest.js   26 / 26
    tools/colortest.js    11 / 11
    tools/meter.js         9 / 9
    tools/truth.js        18 / 18
    tools/reg.js          96 pass, 25 fail   <-- see ISSUE-002

## Remains

1. **ISSUE-002** — 25 of 121 level/outcome pairs land outside their band with
   streak ExtraCards on. Highest priority; it undermines the core promise.
2. **ISSUE-003** — live steering at 91% / 30%. Needs Q-002 resolved.
3. **Q-003** — the softer pacing constraint is a contained experiment.
4. No full bot sweep has been run since Plus Cards landed. `tools/fulltest.js`
   over 25 levels is roughly 15 minutes of generation, chunkable.

## Uncertain

Everything in `docs/OPEN_QUESTIONS.md`. In particular the demo does not model the
shipping game's draw-time rank manipulation (Q-004), so emitted Plus Card ranks
here are not what the real game would produce.

## Next

Start with ISSUE-002. `tools/reg.js` reproduces it in about four minutes and
prints the failing pairs.
