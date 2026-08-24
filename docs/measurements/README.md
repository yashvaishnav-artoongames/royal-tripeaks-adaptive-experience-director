# Measurements

Reports produced by the harnesses in `tools/`. **Read the status before citing
any figure from `archive/`.**

## Current

| file | status | covers |
|---|---|---|
| `reg_1.0.1.md` | **CURRENT** | `tools/reg.js` re-measured three times on 1.0.1, all 30 failures classified, ExtraCards vs Coins control, ladder rung census. Supersedes the `96 / 25` figure |

No full bot sweep has been run since the Plus Card obstacle landed. Regenerate
with `node tools/fulltest.js 5 0 25` then `node tools/mkreport.js`.

## archive/

| file | status | why |
|---|---|---|
| `director_report.md` | **VOID — do not cite** | 625 runs against levels whose dependency graphs were empty. Every card was exposed, so the levels had no structure. Its "48% verified" figure is meaningless |
| `eced_report.md` | SUPERSEDED | real, but predates the lose-band change, the Plus Card obstacle and the `retarget` fix |
| `eced_rescues.csv` | SUPERSEDED | row data behind the above |
| `ECED_v2_status.md` | HISTORICAL | status at the end of the ECED hardening pass |
| `PROJECT_MEMORY_pre_repo.md` | HISTORICAL | project memory from before this repository existed |

## Figures cited in docs/KNOWN_ISSUES.md

These came from runs during the session that created this repository and are not
otherwise archived. Re-measure before relying on them:

- verified 302 runs at 100% outcome held / 100% exact; live 303 runs at 91% / 30%
- all 27 outcome failures were lose targets that won, all on the live side
- `reg.js`: 96 pass / 25 fail over 121 level/outcome pairs
  — **did not reproduce.** Re-measured 2026-08-24: 91/30, 92/29, 92/29 over three
  runs on the same build. See `reg_1.0.1.md`.
