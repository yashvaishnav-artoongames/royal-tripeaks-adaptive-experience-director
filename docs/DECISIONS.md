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

---

**D-010 — The verified guarantee is stated with its behaviour class**
Status: APPROVED · Version: 1.2.x · Relates: ISSUE-015

Decision: the guarantee is written as *"a verified level lands on its target for every line
in which the player plays whenever a play is available"* — not as *"no verified level ever
misses"*. Anywhere the broader claim appears, it is corrected.

Reason: `exh()` recurses into a draw only when nothing is playable, so a voluntary draw is
outside the proved line space. This is not a modelling gap that can be closed: a player who
empties the deck forces "0 unused" whatever the card values are, so no assignment can hold
"exactly 2 unused" against them. Measured 2026-08-25 — at a 2% voluntary-draw rate a third
of win targets already fail; at 10%, six of sixty-seven survive.

The alternative was to keep the broad claim and make it true by replenishing the deck when a
draw is wasted. Rejected for now: it makes the deck counter stop behaving the way a player
expects, which is the detectable-adaptation cost the project has explicitly refused to pay
elsewhere. It stays available if absorption proves insufficient.

Impact: `absorbWastedDraw()` narrows the gap by stepping the target down inside its band, so
a wasted draw costs a number rather than the outcome. Documentation states the class. The
claim and the code now agree, which they did not before.

---

**D-011 — A live level advertises the authored band, not a widened one**
Status: APPROVED · Version: 1.2.x · Supersedes the ±1 padding in `liveBand()`

Decision: `liveBand()` returns `[tgt.lo, tgt.hi]`. A live level promises exactly what the
outcome promises.

Reason: the padding never affected steering — `bandOf()` reads the authored `tgt.lo/hi`, so
`retarget()`, `bandOrder()` and the reband rung always worked to the real band. It reached
only `LV.band`: the plan panel, the in-page bot's scoring and the reachability detector. Its
entire effect was to grade the live director against a target one wider than the one the
player was promised. Measured over 121 pairs: 76% "in band" against the padded figure, 57%
against the promise.

Impact: `liveBand()`; the panel and the detector now read the authored band. Reported live
accuracy will fall by roughly nineteen points with no change in behaviour — that is the
correction, not a regression. `reg.js` reports both figures so the two are never confused
again.

---

**D-012 — Visual language for the Wild and Double Value obstacles**
Status: APPROVED · Version: 1.1.1+ · Relates: D-005

Decision: a map **Wild** wears the same face as the in-game `USE WILD` control — `#fffbeb`
on a `#f2ce6a` edge with `#b8790a` type — carrying a drawn five-point star and the caption
`WILD`. A **Double Value** card keeps the ordinary white card face and renders at 1.35×.

Reason. The wild card on the board and the wild button beside it are the same object to a
player, so they should not be two designs; D-005 had already assigned amber to the wild and
an earlier indigo attempt contradicted it. The star is drawn as inline SVG rather than set
as a glyph for three reasons: it takes `currentColor`, so it deepens with the card when the
card becomes playable; no font on another machine can substitute it; and it stays crisp at
the 18px it is drawn at on a dense board. The `♛` it replaces is the Unicode chess queen,
which reads as a game piece rather than as royalty.

A playable wild does **not** take the blue `.pc.pl` ring every other card takes. Blue is the
director's colour in this palette, and the wild is the one card whose entire identity is
that it always plays — so it deepens in its own colour instead, saying the same thing
louder rather than something different.

The 1.35× on a double is not decoration: it is how a player identifies the card without
reading it, and the same 0.175 half-overhang is what the shipping build subtracts from the
scroll clamp so a double reaches the curtain slightly sooner than its neighbours.

Impact: `.wildc`, `.wildb`, `.wgold`, `.pc.wildc.pl` in CSS; the wild and double branches in
`render()`; the legal-move button list. The double **face** is still undecided — the current
slashed `Q/J` stands until it is.

---

**D-013 — Lock & Key is modelled rankless, live-only, and faithful to the partner search**
Status: APPROVED · Version: 1.1.1+ · Relates: D-012, D-011

Decision: the Lock & Key pair enters the demo as a **two-tile obstacle that carries no
rank**, on levels the **live** director owns, and its partner search reproduces the shipping
behaviour rather than the behaviour the layout implies.

Three parts, each with a reason.

**Rankless.** The shipping deal hands a lock or key tile an ordinary card and then never
reads its number — the tile answers only its partner, never the head card. Modelling that
card as real would repeat the wild-slot supply leak: a card spent on a slot that cannot use
it, unavailable to the deck and to every other hidden slot. So lock and key tiles come out
of `SUP` exactly as wild slots do, out of `MATCHN` exactly as plus tiles do, and every path
that assigns a rank skips them — `genLive`, `dReveal`, `ecReveal` and `reassignUnseen`.
`ecReveal` had no such exclusion at all and was leaking wilds before this change.

**Live-only.** `exh()` and `allHit()` do not know that two tiles can leave the board
together for no draw, so a proof over a lock-and-key level would describe a different game —
ISSUE-011's shape exactly, where the prover treated plus tiles as playable. The level
therefore joins Wild and Double in `bends` and takes the live plan. Teaching the prover this
obstacle is a separate, measured piece of work.

**Faithful partner search.** There is no pair identity anywhere in the shipping data: a tile
records only *key* or *lock*, and a tapped key takes the lowest-index eligible lock on the
board. On multi-pair levels that is not the nearest lock for 48% of keys. The demo
reproduces it — including the redirect that makes tapping a lock collect a possibly
different lock — because an experience director has to reason about the game as it actually
behaves, not as the layout suggests. When the chosen lock is not the nearest one the note
says so out loud.

Two consequences kept deliberately. A pair collect **clears the whole undo history**, as
shipping does. And a ready pair **counts as an available move**, so the demo will not
declare a loss while the player still holds a free two-card clear — the honest version of a
signal the shipping build gets wrong in both directions.

Impact: `LOCKS`/`KEYS`, `isLKSlot`, `lkFirst`/`lkReady`/`lkTap`/`lkCollect`/`lkRefused`;
`legals()`, `useLevel()`, `snap()`/`back()`, the render branch and click routing, the
win/lose/dead-end test, `skipToEnd()`, `mainAct()`, `bends`; the `FishCards` importer; and
L7 as a built-in level. Visual language follows D-012's rule — the face identifies the tile
and never changes, only the edge moves.

---

**D-014 — Up & Down keeps its card identity, and the demo gives it the tell shipping withheld**
Status: APPROVED · Version: 1.1.1+ · Relates: D-013, D-012

Decision: the Up & Down card enters the demo as **an ordinary card in every accounting sense**,
its clock is driven by **completed moves only**, and the demo **shows each step** even though
the shipping build does not.

**It stays a card.** Unlike the other three obstacles this one is matched by the normal
rank-adjacency rule, clears like any card, costs nothing and grants nothing. So it stays
inside `MATCHN` and inside `SUP`, `legals()` needs no exclusion, and it goes through `play()`
untouched. That is the one thing about this obstacle needing no caveat, and the temptation to
give it a special case should be resisted.

**The clock is moves, not time.** `udTick` fires from exactly four places — a match, a deck
draw, a burnt draw, and spending a wild — and steps every tile that is revealed and on-screen
by ±1 on the closed thirteen-rank ring. A covered tile is frozen, so a tile's clock starts
when it is *revealed*: two tiles authored with the same direction drift apart permanently if
they are uncovered on different moves, and nothing records when that was. The set of tiles to
step is captured **before** the move uncovers anything, because a tile revealed by this move
does not step on this move.

**The pool follows the face.** A tick repaints the same physical card, so the deck's
composition is unchanged — but what the board *shows* changes, and the live director picks
future cards from that. `udTick` hands the old rank back to `LV.pool` and takes the new one,
so the director's supply model stays truthful as the tiles walk.

**Live-only, and this is the strongest case of the four.** A proof from `exh()` is a statement
about fixed ranks. An Up & Down tile makes the rank a function of the move number, so every
line the prover explored describes a board that no longer exists by the time it is reached.
The level joins the other three in `bends`.

**The per-step tell is added deliberately.** The shipping build has the punch-scale feedback
written and commented out, so the rank changes by a silent sprite swap with nothing drawing
the eye. The doc names this as the first thing to check if these levels read as random rather
than tricky. The demo flashes the tile and the note says how many stepped — the point of the
demo is to make the director's world legible, and an invisible state change is the opposite
of that. Implemented as `box-shadow` only, because `.pc` carries an inline `rotate` and
animating `transform` would throw a rotated card straight.

Two divergences from shipping, both stated rather than hidden. **Undo is exact**: `snap()`
already carries `lrank`/`llb`/`lpool`, so `back()` restores ranks rather than re-stepping
them, which sidesteps shipping's reveal-during-undo asymmetry — a defect with no design
content. And on the deck path the tick lands **after** the draw is committed rather than
before the director mints, because ticking earlier would leave tiles stepped on every path
where the draw aborts and pops its own snapshot.

Impact: `UPDN`/`UDN`/`UDFLASH`, `isUDSlot`, `udWrap`, `udLive`, `udTick`; `play()`, `draw()`,
`miss1()`, `useWild()`, `useLevel()`, the render branch, `bends`; the `IncrementalCards`
importer, which refuses any `Value` other than ±1; and L41 as a built-in level.
