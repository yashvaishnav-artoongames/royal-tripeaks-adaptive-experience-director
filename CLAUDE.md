# CLAUDE.md — operating rules

How Claude works on this repository. Rules only. The AED specification lives in
`docs/`, not here.

> The conversation is temporary. The project is permanent.

## Source of truth, in order

1. Current source code and data (`index.html`, `levels/`)
2. Approved documentation in `docs/`
3. `docs/DECISIONS.md`
4. `docs/RULES.md`
5. `CHANGELOG.md`
6. `docs/SESSION_HANDOFF.md`
7. Previous conversation — lowest, never authoritative against the repo

If sources disagree: name the conflict, do not silently pick, establish which is
newer or approved, then update the documentation once decided.

## Evidence classification

Every non-obvious claim carries one:

| | |
|---|---|
| VERIFIED | read directly from current source or data |
| LIVE | observed by actually running the demo or a harness |
| INFERRED | reasonably derived, not confirmed |
| PROPOSED | suggested, not implemented |
| UNKNOWN | cannot currently be established |

Never promote INFERRED, PROPOSED or UNKNOWN to VERIFIED. Never invent behaviour
and present it as verified.

## Workflow

UNDERSTAND → CLASSIFY → PLAN → IMPLEMENT → VERIFY → DOCUMENT → VERSION → HANDOFF → COMMIT

- Inspect before editing. Do not open by generating a replacement file.
- Make the smallest appropriate change.
- Do not rewrite unrelated systems while working on a feature.
- Do not remove functionality unless asked.

## Verification is not optional

Run the relevant harness and report the actual output. **Never claim something
was tested if it was not.**

    node tools/reg.js          core director
    node tools/plustest.js     Plus Card obstacle
    node tools/streaktest.js   streak rewards

`tools/README.md` lists the rest. A change that moves a suite number must say so
in the commit and in `CHANGELOG.md`.

**ISSUE-001 is the cautionary case:** a `ReferenceError` reached `main` because
suites were skipped for speed. Speed is not a reason.

## main is production

GitHub Pages serves `main` from the repository root. There is no staging and no
build step — **every push to `main` is a live deploy.**

Work on a branch. Merge to `main` only after the verification gate in
`docs/WORKFLOW.md` passes, and only with approval. Bump `APP_VERSION` and add a
`CHANGELOG.md` entry in the same change.

Live: https://yashvaishnav-artoongames.github.io/royal-tripeaks-adaptive-experience-director/

## Files

One demo file: `index.html`. Do not create `index-new.html`, `demo-v2.html` or
similar for ordinary changes — that is what Git is for.

## Memory maintenance

When a session establishes durable knowledge, a decision, an issue or an open
question, write it to the matching file in `docs/` before finishing. Supersede
decisions, never rewrite them.

## Fresh session protocol

Read `CLAUDE.md`, `docs/AI_CONTEXT.md`, recent `CHANGELOG.md`,
`docs/SESSION_HANDOFF.md`, then the relevant `RULES` / `GLOSSARY` / `DECISIONS`,
then the code for the task. Do not ask for the previous conversation unless the
repository genuinely lacks the context.
