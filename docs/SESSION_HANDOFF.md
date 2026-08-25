# Session Handoff

Updated 2026-08-24, after 1.1.0.

## Where things stand

`main` is at **1.1.0** locally and **1.0.3 on origin** — the 1.1.0 work is committed
on `main` in this clone and **not pushed**. The live site is 1.0.3 until someone runs
`git push origin main && git push --tags`.

Tags: `v1.0.1` (retroactive), `v1.0.2`, `v1.0.3`, `v1.1.0`. All local; unpushed.

## What 1.1.0 did

Stages 0 and 1 of the core-director pacing upgrade — the two that cannot cost
verified coverage. Shape is now chosen from among *proved* deals rather than
accepted from the first proof (D-008), and the recovery ladder prefers a
re-ordering whose undrawn tail is worth playing (D-009). Four defects fixed,
including one that had disabled the entire verification gate. Full note:
`docs/versions/RELEASE_1.1.0.md`.

## Read this before touching the directors

`docs/WHY_THE_DIRECTOR.md` — the objective. The metric it names, *verified levels
that missed their target: zero*, is the thing every change is ranked against.

## Next, in order

1. **Restore `tools/equiv.js` for one run** (`git checkout v1.0.1 -- tools/equiv.js`)
   before anything touches `exh`/`allHit`. It is the cheapest guard that a prover
   change leaves the other 24 levels bit-identical.
2. **Stage 2 — the sealed eventual deck.** The real fix for L12: `gen()` plans
   `T=N` matches against `DRAWS-tv` draws (`index.html:816`) while the runtime plays
   `MATCHN` matchable cards against `DRAWS+PLUSTOTAL`. On L12 Close Win that is 21
   matches / 6 draws planned against 18 / 18 actual. Design and the 22-item critique
   of it are in the session record; the short version is in
   `docs/versions/RELEASE_1.1.0.md`. **Do not start it without a measurement plan** —
   it touches the prover, and `reg.js` is deleted.
3. **ISSUE-002** — still open, still the headline-metric breach, still unmeasurable
   in this tree.

## Traps that cost time this session

- **`core.autocrlf=true` breaks every harness** on a Windows checkout. Fixed in the
  harnesses (`\r?\n`), not at the root — a `.gitattributes` pinning `index.html` to
  LF needs a decision. If the suites ever die with
  `Cannot read properties of null (reading '1')`, this is why.
- **Level data lives in two places.** `levels/*.json` reaches the app only through
  the file picker; the app deals from the built-in table in `index.html`. Editing
  one is a no-op.
- **The ladder runs inside a player's tap**, and up to two absorbs can fire on a
  single card. The first version of the D-009 change swept to its deadline instead
  of stopping shortly after the first hit, and hung `tools/streaktest.js`.
- **`reg.js` and 17 other harnesses were deleted in 1.0.2.** Band adherence, the
  verified/live split and memo-key soundness are all unmeasured now. Restore from
  `v1.0.1` for a single run rather than guessing.

## Open

`docs/OPEN_QUESTIONS.md`. Q-007 (which outcome bands are authoritative — the demo's
3–5 / 5–8 or the paper's 1–3 / 4–6) blocks any band work and needs the Unity
constants read. Q-001 stays open for streak `ExtraCards`; stage 2 answers it only
for plus tiles.
