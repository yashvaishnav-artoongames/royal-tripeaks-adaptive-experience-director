# Claude Code — first session prompt

Paste the block below into Claude Code, run from the repository root.
It orients without authorising changes. Keep it here so it can be reused.

---

```
You are taking over the Royal TriPeaks Adaptive Experience Director repository.
Read before you write. Do not modify index.html in this session.

READ IN THIS ORDER
  1. CLAUDE.md                    how to work here
  2. docs/AI_CONTEXT.md           what the project is
  3. docs/KNOWN_ISSUES.md         what is broken, all reproduced
  4. docs/SESSION_HANDOFF.md      where the last session stopped
  5. docs/RULES.md, docs/GLOSSARY.md, docs/DECISIONS.md
  6. CHANGELOG.md                 recent entries
  7. tools/README.md              how to verify anything
  8. index.html                   the implementation

THE ONE THING TO UNDERSTAND FIRST

Two directors produce every level.

  Verified  pre-commits a deck and proves via exh() that EVERY legal line lands
            on the target. Measured: 302 runs, 100% outcome held, 100% exact.
  Live      holds no plan, mints each card as it is drawn.
            Measured: 303 runs, 91% outcome held, 30% exact.

Verified coverage is the project's primary quality axis. Every measured outcome
failure has been on the Live side. A change that moves a level from Verified to
Live is a regression even if every test still passes.

FIVE TRAPS THAT HAVE ALREADY COST TIME

1. Level generation is TIME-BOXED. searchPass and build carry Date.now()
   deadlines, so a marginal level verifies on one run and falls to Live on the
   next. Never diff whole builds to detect a regression — it is not
   deterministic. Compare exh()/allHit() on identical inputs: tools/equiv.js.
   Run tools/reg.js more than once before believing a single result.

2. THREE separate systems grant extra cards and they are constantly confused:
   the Plus Card obstacle (level-authored map tile), the Extra Card Experience
   Director (the +3/+5 rescue), and the streak reward. See docs/GLOSSARY.md.
   "Plus card" in this repo means only the first.

3. The BAND is the promise, not tv. An outcome means "Close Win = 1-3 draws
   unused" whatever the deck size. A previous session added the deck delta to tv
   and turned "exactly 2 unused" into "exactly 16 unused" while reporting
   success. See RULE-007 and D-004.

4. Skipping the suites is how ISSUE-001 shipped — a ReferenceError that killed
   every REBAND. It would have been caught by the first tools/reg.js run.

5. Numbers in the docs came from actual runs. If you cite one, either re-run it
   or say which document it came from. Never write a figure you did not measure.

FIRST TASK — ISSUE-002, do not start until you have reported back

  node tools/reg.js

Expect roughly 96 pass / 25 fail across 121 level/outcome pairs, in about four
minutes. The failures are levels whose outcome type holds but whose value lands
outside its band, because STREAK_REWARD.type defaults to 'ExtraCards' and the
rewards grow the deck mid-level. Worst case is L4 Comfortable Win: outcome held
10/10, in band 0/10.

Setting STREAK_REWARD.type = 'Coins' avoids it, because coins never touch the
deck. That is a workaround, not the fix. The real question is open — see Q-001
in docs/OPEN_QUESTIONS.md.

REPORT BACK WITH

  - the actual tools/reg.js output, not a summary of what you expect
  - which failures are the ISSUE-002 pattern and which are something else
  - whether any harness disagrees with docs/KNOWN_ISSUES.md
  - your reading of Q-001, with the tradeoffs
  - anything in the docs contradicted by the code

Then stop and wait. Do not implement a fix in this session.

CONSTRAINTS

  - One demo file: index.html. Never index-new.html, demo-v2.html or similar.
  - Smallest appropriate change. Do not refactor unrelated systems.
  - Do not remove functionality unless asked.
  - Classify claims VERIFIED / LIVE / INFERRED / PROPOSED / UNKNOWN. Never
    promote one upward.
  - Update docs/ when you establish durable knowledge, a decision, an issue or
    an open question. Supersede decisions, never rewrite them.

KNOWN GAPS IN THE REPOSITORY

These documents are referenced but not present. Ask for them rather than
reconstructing them from inference:

  - the Plus Card obstacle deep-dive (code-traced against the Unity build,
    measured across 2,500 level files). RULES.md RULE-011 exists because of it.
  - the ECED specification
  - the streak reward specification, whose section 21 defines the cases
    tools/streaktest.js verifies
  - the ECED architecture review that produced D-003
  - historical measurement data behind the figures in KNOWN_ISSUES.md
```

---

## Notes for the human

**Do not skip the read-back.** The value of the first session is confirming the
documentation matches the code. If Claude Code opens by proposing fixes, stop it.

**`tools/reg.js` takes about four minutes** over 25 levels. `tools/fulltest.js`
is roughly 15 minutes of generation and is chunkable — see `tools/README.md`.

**Once hosting and versioning are settled**, the natural follow-ups are ISSUE-002
(highest, it undermines the core promise), then Q-002 (the strand set, which is
the only candidate fix for Live steering at 91%/30%), then Q-003 (the softer
pacing constraint, a contained experiment).
