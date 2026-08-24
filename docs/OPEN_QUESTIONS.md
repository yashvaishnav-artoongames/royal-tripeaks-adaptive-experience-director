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

**Q-007 — Which outcome bands are authoritative, the demo's or the shipping game's?**
Status: OPEN · Raised by `docs/WHY_THE_DIRECTOR.md`

The objective paper (section 3) lists Close Lose as 1–3 cards stranded and Comfortable
Lose as 4–6. `OUT` in `index.html` has 3–5 and 5–8; `docs/reference/TUNING.md` records
that the lose bands were widened from the paper's values to give the rescue director
room. So the paper predates the widening, and two problems follow.

The demo's lose bands now **overlap at 5**, so a run stranding 5 cards satisfies both
Close Lose and Comfortable Lose, and a harness scoring "in band" cannot tell them apart.

More seriously, the paper quotes the shipping game's own constants —
`WIN_TARGET_DECK_MIN/MAX = 0..3` and `LOSE_TARGET_MAP_MIN/MAX = 1..6`. If those still
hold, the demo's **Comfortable Win band of 4–6 draws unused has no counterpart in the
shipping range at all**, and a level authored to it could not be reproduced there.
UNKNOWN whether those constants are current — nobody has checked the Unity source this
session.

Next: read `Hard_LevelManipulator` for the live constants, then decide one way. If the
shipping ranges are authoritative the demo's bands move and every measured figure that
mentions a band is superseded; if the demo's are, the paper needs a correction note.
