# Decisions

Approved decisions. Do not rewrite history — supersede.

---

**D-001 — Plus Card is modelled as a map obstacle**
Status: APPROVED · Version: 1.0.0

Decision: represent it as a slot on the board with a `Value`, not as a card type.
Reason: its lifecycle affects deck planning and director behaviour; firing is
determined by the dependency graph.
Impact: `PLUS`, `plusSweep()`, `plusFire()`; excluded from `legals()`.

---

**D-002 — One entry point for every deck mutation**
Status: APPROVED · Version: 1.0.0

Decision: streak rewards, Plus Cards and any future mechanic all enter through
`onGameplaySupplyChanged()`.
Reason: prevents each feature growing its own adaptation logic.
Impact: a new reward type is a caller, not a new pathway.

---

**D-003 — Intent as a hard gate rather than a scoring weight**
Status: APPROVED · Version: 1.0.0

Decision: gate rescue candidates on `ecLineFull()`, the maximum a rank can strip
under any play order.
Reason: scoring leaked. A card scored "clears 2" cleared 4 when a fork opened;
measured `almost` intent winning 65% of the time.
Impact: `almost` now wins 0.0%. The advertised odds became meaningful.

---

**D-004 — The outcome band is the promise, not the exact target**
Status: APPROVED · Version: 1.0.0 · Supersedes an earlier delta-based retarget

Decision: `retarget()` may move `tv` only inside `[lo, hi]`.
Reason: adding the deck delta to `tv` turned "Close Win — exactly 2 draws unused"
into "exactly 16 unused" and reported success. A different outcome wearing the
same label.
Impact: `retarget()` bounded; REBAND searches outward from the authored value.

---

**D-005 — Plus Card visual: opaque tint, dashed edge**
Status: APPROVED · Version: 1.0.0

Decision: `#eeedfe` fill, 2px dashed `#7f77dd`, value at weight 800, caption
`PLUS CARD`. Caption drops below 46px card width.
Reason: a near-white tint read as a hole against the board. The dash is heavier
than the cleared-slot outline so the two do not read alike. Purple was unused —
blue is the director, amber the wild, green verified.
Impact: `.pc.plusc`, `.plusb` in CSS; the render branch in `render()`.

---

**D-006 — A firing Plus Card must be visible**
Status: APPROVED · Version: 1.0.0

Decision: on fire, the badge lifts off the tile, a tag reads
"+N extra cards added", and the deck slot pulses.
Reason: the tile previously vanished between two frames.
Impact: `plusPing()`.

---

**D-007 — Win-target chain pacing: considered, measured, NOT ADOPTED**
Status: REJECTED · Version: n/a

Decision: do not constrain win-target run ordering in `buildRuns`.
Reason: the change worked — ends-on-a-single 57%→4%, longest-chain-front-loaded
63%→4% — but cost verified coverage 133→119 of 142. Verified holds the outcome
100% and the exact target 100%; Live is 91% and 30%. Trading 10% of guaranteed
coverage for chain shape is the wrong direction.
Impact: none in code. Recorded so it is not silently re-attempted. A softer form
(longest chain merely not in the first quarter) is untested — see Q-003.

---

**D-008 — Chain shape is a ranking preference, never a filter**
Status: APPROVED · Version: 1.1.0 · Relates: D-007 (still REJECTED), Q-003

Decision: pacing taste is applied by scoring candidates that have already passed
`exh()`, and choosing among them. It is never applied as a rejection inside
`buildRuns()`.

Reason: D-007 measured the filter form and rejected it — it fixed the shape
(ends-on-a-single 57%→4%, front-loaded 63%→4%) and cost verified coverage 133→119
of 142, because `PLAN` has a single verified stage, so a partition deleted before
the prover converts one-for-one into a live level. A preference downstream of
`if(!v){fail('verify');continue;}` cannot empty a non-empty pool: if one candidate
proves, it ships. Verified coverage is the headline metric — see
`docs/WHY_THE_DIRECTOR.md` §9.

Impact: `PACE`, `paceScore()`, `pickBest()` beside `buildRuns`; `searchPass()`
collects up to `PACE.K` proofs bounded by `PACE.extraMs` after the first, then
latches the best. `pickBest` is deterministic and calls no `rnd()`, so the build's
random stream is unchanged up to the first proof and no marginal level can be
shifted off its seed by scoring. D-007 is **not** reversed; its finding is the
reason this has the shape it has.

**Q-003 is answered in the preference form only.** The question asked whether a
softer *gate* keeps coverage; it is implemented here as a −14 score term and the
gate remains untested.

---

**D-009 — The recovery ladder may prefer among orderings that land**
Status: APPROVED · Version: 1.1.0 · Relates: D-003

Decision: `proveFrom()` collects a few orderings that re-prove the target and ships
the one whose undrawn tail reads best, rather than the first one found.

Reason: every lower rung accepted the first ordering that landed, and "any ordering
that still lands" is overwhelmingly a tail of dead draws. That tail is what the
player experiences as padding — the churn pattern named in
`docs/WHY_THE_DIRECTOR.md` §2.

Impact: `TAIL`, `tailAnswers()`, `tailScore()`, `pickBestTail()`. Two constraints
are deliberate. It is a **preference, never a gate** — `tailScore` reasons from a
snapshot of a board that moves, which is exactly what D-003 replaced with
`ecLineFull()` when it was trusted as a constraint. And it stops a short way past
the first ordering that lands (`TAIL.extraTries`), because this runs inside a
player's tap and up to two absorbs can fire on one card: the first implementation
swept to the deadline and turned the typical case into the worst case, which hung
`tools/streaktest.js` outright.
