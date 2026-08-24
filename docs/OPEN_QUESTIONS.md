# Open Questions

Never silently convert one of these into a fact.

---

**Q-001 — How should a verified level absorb a growing deck?**
Status: OPEN · Blocks: ISSUE-002

The ladder re-proves after each supply change, but repeated growth pushes the
outcome outside its band. Candidates: plan the full eventual deck at build time
(firing is deterministic, so the total is knowable); cap rewards per level; or
make rewards Coins on levels the director cannot absorb.
Next: measure how often each rung fires per reward type.

**Rung census taken 2026-08-24, second session.** LIVE,
`docs/measurements/reg_1.0.1.md`. Across 1,877 supply changes with
`type='ExtraCards'`: keep 616 · adjust 496 · replan 159 · reband 32 ·
**live 574**. With `type='Coins'` there are only 147 supply changes, all from
Plus Card tiles: adjust 68 · keep 38 · replan 30 · live 10 · reband 1.

The `live` count is the finding. A verified level abandons its proof on roughly
three of every ten supply changes, and there were 1,732 streak-reward changes
across 121 pairs — about 14 per pair, on decks of 7 to 18 cards.

**Reading of the three candidates, PROPOSED — not decided.**

*Cap rewards per level.* `maxExtraCardsPerLevel` is already 6, against decks of
7–18 cards. On `L5` (deck 7) the cap permits the deck to grow by 86%. The cap is
absolute where the pressure is relative, so a cap expressed as a fraction of
`DECKN` would bind where it matters. Cheapest change; does not address why a
single extra card is hard to absorb.

*Coins on levels the director cannot absorb.* Works — 106/121 vs 91/121 — but it
removes the mechanic from exactly the levels where a reward is most wanted, and
it decides per level what §13 says should be decided per card.

*Plan the full eventual deck at build time.* The strongest of the three, and
there is precedent: `useLevel()` already adds `PLUSTOTAL` into `SUP`
(`index.html:652`) on the stated grounds that plus-tile firing is deterministic
so "the deck the level is really planned against is the authored deck plus their
total" (`index.html:645-647`). But VERIFIED: `PLUSTOTAL` reaches **only** `SUP`
and the `STRUCT` caption. It does not enter `whyNot()`, `minDeckFor()` or
`gen()`, all of which still use `DRAWS = DECKN - 1` (`index.html:643`). So the
comment describes an intent the outcome arithmetic does not implement — which is
ISSUE-005 restated. Streak rewards are worse than plus tiles here: they are not
deterministic, they depend on how the player plays, so the eventual total is
bounded but not known at build time. Planning against the *worst case* (deck +
`maxExtraCardsPerLevel`) is knowable, at the cost of authoring every level
against a deck it usually will not have.

**A fourth candidate the question does not list**, and the one this session would
pursue first: fix the *rank* of the granted card rather than the count. See
ISSUE-008 — `supplyPick()` is a uniform random pick, which the streak spec §13
already forbids. A granted card whose rank matches nothing reachable is a forced
dead draw: the player must spend a draw on it, so a win target's "draws unused"
is unchanged, and ADJUST can hold the authored `tv` simply by ordering it to the
front of the unseen region. This is cheap, is already required by the spec, and
does not touch the band, the caps or the level data. UNKNOWN by how much it
would move the rung census — it needs measuring, not asserting.

**Before any of this, note that ISSUE-002 is not where the failures are.**
19 of the 30 reg.js failures are ISSUE-006, and only 3 are this issue. Fixing
ISSUE-006 first would make Q-001 measurable; at present the headline number for
this question is mostly measuring something else.

---

**Q-002 — Is a committed strand set safe for live lose targets?**
Status: PROPOSED · Blocks: ISSUE-003

Pick `tv` specific cards, reserve ranks so nothing can ever match them, and the
board becomes mathematically unclearable. Reserving one rank blocks it and both
neighbours — 3 of 13 — which may starve `dDraw()` on a tight deck.
Next: prototype behind a flag with a fallback that shrinks the strand set.

---

**Q-003 — Does a softer pacing constraint keep verified coverage?**
Status: OPEN · Relates: D-007

The rejected constraint required the longest chain in the back half. Untested:
merely "not in the first quarter".
Next: implement, run `tools/pacing.js` and `tools/reg.js`, compare.

---

**Q-004 — Who should choose the ranks a Plus Card emits?**
Status: OPEN

`supplyPick()` is supply-aware but not board-aware. The shipping game re-decides
each rank at draw time via its difficulty manipulator, which is board-aware. The
demo does not model that layer.
Next: decide whether the live director should own emitted ranks at draw time.

---

**Q-005 — What is the right intensity for production?**
Status: OPEN

Measured at 0.60: 22% empty rescues, 1.7 cards cleared per rescue, 53% dead
cards. The empty-rescue floor is set by how often rescues happen on 1–3 card
boards, which the director cannot change.
Next: live retention data.

---

**Q-006 — Should the Plus Card offer telemetry beyond `SUPPLY_LOG`?**
Status: OPEN

Streak rewards and ECED both emit structured records. A Plus Card firing produces
only a `SUPPLY_LOG` row.

---

**Q-007 — Should `RULE-005` be narrowed to Plus Cards, or should
`addExtraCards()` be changed to match it?**
Status: OPEN

`docs/RULES.md` RULE-005 says granted cards land on the top of the deck, spliced
at `di`. VERIFIED: that is true of `plusFire()` (`index.html:1973`) and false of
`addExtraCards()`, which splices at `di + rnd()*(dk.length-di+1)`
(`index.html:2150`) — a uniform position anywhere in the unseen region.
`docs/GLOSSARY.md` defines "granted card" as one added by *a reward or an
obstacle*, so the rule as written covers both paths and is contradicted by one.

The streak spec specifies a random insertion position only for the **Wild**
reward (§12, "Random insertion rule"). It does not state a position for plain
Extra Cards, so neither behaviour is a spec violation — but the two paths differ
for no recorded reason, and the difference matters: a card spliced at `di` is
drawn next and is therefore absorbable by ADJUST, while one dropped deep in the
unseen region is not reachable by re-ordering without moving cards the player is
about to see.

Next: decide which is intended, then either narrow RULE-005 to Plus Cards or
change the insertion. Do not resolve it by editing RULE-005 to match the code
without deciding — the rule may be the correct behaviour and the code the bug.
