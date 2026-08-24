# Rules

Explicit rules that are VERIFIED in code or APPROVED by decision. Each has an ID
and a status.

**RULE-001 — Plus Card is a map obstacle.** VERIFIED.
Declared per level by `PlusCards`, occupies a board slot, never playable.

**RULE-002 — A Plus Card is not a normal card with a plus visual.** VERIFIED.
`legals()` strips `isPlusCard(i)` before any rank test.

**RULE-003 — Plus Card firing is a pure function of the cleared set.** VERIFIED.
It fires when every entry in `DEP[i]` is cleared. No timing, no randomness.

**RULE-004 — A Plus Card clears itself for free.** VERIFIED.
No match is spent on it. It is not a card the player has to match, so a level's
matchable count is `N - PLUSTILES`.

**RULE-005 — Granted cards land on the top of the deck.** VERIFIED FOR PLUS
CARDS ONLY · CONFLICT OPEN, see Q-007.
Spliced at `di`, so they are drawn next, in reverse order of emission.

> Conflict found 2026-08-24, second session. This holds for `plusFire()`
> (`index.html:1973`). It does **not** hold for `addExtraCards()`, which splices
> at a uniform random position in the unseen region (`index.html:2150`), nor for
> `insertWild()` (`index.html:2180`). `docs/GLOSSARY.md` defines a granted card
> as one added by a reward *or* an obstacle, so as written the rule covers all
> three paths and is true of one. Not resolved here — the rule may be the
> intended behaviour and the code the defect. See `docs/OPEN_QUESTIONS.md` Q-007.

**RULE-006 — Only unseen state may be mutated.** VERIFIED.
Every rung of the recovery ladder touches only the undrawn deck and unrevealed
tableau. Cards already drawn or played never change.

**RULE-007 — The band is the promise; `tv` is a point inside it.** APPROVED, D-004.
`retarget()` may move `tv` only within `[lo, hi]`. A deck that grows does not
license moving the outcome outside its band.

**RULE-008 — Intent is a constraint, not a weight.** VERIFIED.
A rescue with non-win intent is gated on `ecLineFull()` and cannot receive a rank
the player could win with. Measured at 0.0% across all configurations.

**RULE-009 — A committed Wild is never silently replaced.** VERIFIED.
Every ladder rung calls `preserveWilds()`. Position may move; existence may not.

**RULE-010 — Undo rewinds the board, never a purchase.** VERIFIED.
The snapshot taken at a rescue grant carries `paid`; `back()` will not cross it.

**RULE-011 — A win is counted after any plus sweep.** VERIFIED.
A plus tile clears itself outside the match path, so a win check that ran only on
a match would miss a board emptied by a tile. Fixes the gap identified in the
obstacle documentation.

**RULE-012 — Granted cards do not count against core rank supply.** VERIFIED.
They are extra supply the game handed out, tagged `dk[i][3]`.

> Note added 2026-08-24, second session. True of the verified path. On a **live**
> level `addExtraCards()` raises `LV.deckLen` without raising `LV.pool`
> (`index.html:2143-2145`), so the extra draws are taken from core supply rather
> than added to it — the opposite of this rule. `plusFire()` does top the pool up
> (`index.html:1977`). See ISSUE-006.

**RULE-013 — Adaptive decisions must be explainable.** APPROVED.
Document as trigger, inputs, decision, action, state, player experience,
telemetry, downstream plan, fallback.
