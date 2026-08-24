# Measurements

Reports produced by the harnesses in `tools/`. **Read the status before citing
any figure from `archive/`.**

## Current

None. No sweep has been run since the Plus Card obstacle landed. Regenerate with
`node tools/fulltest.js 5 0 25` then `node tools/mkreport.js`.

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
