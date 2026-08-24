# tools

Verification harnesses for the AED demo. Every one reads `../index.html`, so they run
from anywhere:

    node tools/plustest.js

No dependencies. Node 16+.

## Suites — fast, run these on any change

| script | what it checks | expected |
|---|---|---|
| `reg.js` | core director: every verified level hits its exact target 10/10 | 48/48, 0 issues |
| `plustest.js` | Plus Card obstacle end to end against `levels/L12.json` | 13/13 |
| `streaktest.js` | streak reward spec cases A–R | 26/26 |
| `colortest.js` | streak colour tracking and pip colouring | 11/11 |
| `meter.js` | meter reads correctly in every streak state | 9/9 |
| `truth.js` | every surface reports the multiplier actually paid | 18/18 |
| `gaps.js` | edge paths: draw-anyway, skip-to-end, live wild | 5/6 (6th is a harness limit) |
| `announce.js` | reward announced in the play log | pass |
| `verify25.js` | every level has a real dependency graph | 0 broken |

## Correctness probes

| script | what it checks |
|---|---|
| `collide.js` | memo-key collisions in `exh`/`allHit` at growing deck sizes. Must be 0 |
| `equiv.js` | compares `exh`/`allHit` against a baseline build on identical inputs |
| `buildchk.js` | which level/outcome pairs build, and verified vs live |

`equiv.js` and `buildchk.js` compare two builds. Point the baseline at another file:

    AED_BASELINE=/path/to/old.html node tools/equiv.js

## Sweeps — slow, minutes not seconds

| script | what it measures |
|---|---|
| `eced_bot.js` | rescue director. `node tools/eced_bot.js 0.60 8 8` = intensity, passes, max rescues. Writes report + CSV. Caches builds |
| `fulltest.js` | all levels × all outcomes × N passes. Chunkable: `node tools/fulltest.js 5 0 6` |
| `mkreport.js` | turns `fulltest.js` output into `director_report.md` |
| `funnel.js` | rescue lifecycle split by cards stranded |
| `sweep.js`, `bands.js` | tuning sweeps for ECED and the lose bands |
| `pacing.js` | win-target chain shape before/after |
| `livecmp.js` | lose-target outcomes, this build vs a baseline |

## Level data

`addlevels.js` converts `levels/*.json` into the built-in table inside `index.html`.
It rewrites the file — commit before running.

## Caveat

Level generation is time-boxed (`Date.now()` deadlines in `searchPass` and `build`), so
a marginal level can verify on one run and fall to live on the next. `reg.js` may report
47/48 or 48/48 on the same build. Run it more than once before treating a single result
as a regression.
