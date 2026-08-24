# tools

Verification harnesses for the AED demo. Every one reads `../index.html`, so they run
from anywhere:

    node tools/plustest.js

No dependencies. Node 16+. All five suites together take a couple of seconds — run
them on any change.

## Suites — the verification gate

| script | what it checks | expected |
|---|---|---|
| `plustest.js` | Plus Card obstacle end to end against `levels/L12.json` | 13/13 |
| `streaktest.js` | streak reward spec cases A–R | 26/26 |
| `colortest.js` | streak colour tracking and pip colouring | 11/11 |
| `meter.js` | meter reads correctly in every streak state | 9/9 |
| `truth.js` | every surface reports the multiplier actually paid | 18/18 |

`docs/WORKFLOW.md` is the gate these belong to. Paste the actual output into the
commit or PR, not a summary.

## Level data

`addlevels.js` converts `levels/*.json` into the built-in table inside `index.html`.
It is not a test. It rewrites the file — commit before running.

## What used to be here

Removed in 1.0.2 because the long runs cost more time than they returned: `reg.js`
(the 121-pair core-director regression, about four minutes), `collide.js`, and the
sweeps and probes — `announce`, `band12`, `bands`, `buildchk`, `diag12`, `eced_bot`,
`equiv`, `fulltest`, `funnel`, `gaps`, `livecmp`, `mkreport`, `pacing`, `pingcheck`,
`sweep`, `verify25`.

They are in git history, not gone. Any one of them comes back with:

    git checkout v1.0.1 -- tools/reg.js

**What left with them:** nothing now measures band adherence, the verified/live
split, or memo-key soundness as a deck grows. `docs/KNOWN_ISSUES.md` figures came
from `reg.js` and `fulltest.js` and can no longer be reproduced from this working
tree — cite them as historical, or restore the harness for the run.

## Caveat that still applies

Level generation is time-boxed (`Date.now()` deadlines in `searchPass` and `build`),
so a marginal level can verify on one run and fall to live on the next. Whole-build
comparison is not a valid test. See ISSUE-004.
