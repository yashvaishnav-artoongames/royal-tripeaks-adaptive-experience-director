# Why we are building the Adaptive Experience Director

A short paper on the problem, what it costs, and what solving it is worth.

---

## 1 · The problem

A TriPeaks level ships as a **shape**: card positions, and a graph saying which cards sit on top
of which. What it does not contain is the thing that decides how the level actually plays — the
**card values**.

Those come from a shuffle at deal time.

So a designer authors a shape, and the player receives a lottery. Two players on the same level
get different experiences, and neither is the one anybody intended. A level meant to be a tense
near-miss can shuffle into a walkover. A level meant to be a gentle win can shuffle into an
unwinnable wall.

Across **2,500 levels** there is no realistic way to hand-tune this. The difficulty curve the
design team drew is not the curve players experience. It is noise shaped a little by topology.

### 1.1 · We already knew this

The codebase contains **three overlapping systems** trying to fix it:

- `LevelManipulator` and `Hard_LevelManipulator` — rewrite a card's value at the moment it turns
  face up, to steer difficulty
- `DifficultyEngineRuntime` — a per-player difficulty dial
- `OutcomeDirector` — dead code, zero callers

`Hard_LevelManipulator.ApplyDeterministicOutcome` already targets *exactly* the quantities we
care about: `WIN_TARGET_DECK_MIN/MAX = 0..3` and `LOSE_TARGET_MAP_MIN/MAX = 1..6`.

**The team already knew what it wanted.** The vocabulary is the same. What was missing was any
way to know whether the steering worked — it nudges one card at a time and never checks the
result. Two systems steering the same dial from different places, neither verifying, is worse
than either alone.

---

## 2 · What it costs today

### Retention

A loss that feels arbitrary is a churn event. A loss that feels like a near miss is a retry.
That difference is not cosmetic — in this genre it is close to the whole retention mechanic, and
it currently depends on chance.

Our own analysis found the failure pattern the team had already noticed:

> *During close loses, users receive too many match cards at the start, followed by multiple dead
> draws, and finally the last card clears all matches but still results in a loss. Such
> repetitive behaviour causes frustration and churn, as the experience feels predictable and
> unfair.*

### Monetization

The out-of-cards moment is **the only place in the game where we capitalise on a player**. Its
entire value rests on one thing: the player believing they were close.

If losses land at random distances from the finish, most of those moments are worthless. A player
sitting twenty cards from the end does not buy a rescue — they quit. The purchase only happens
when the loss was *engineered* to be a near miss.

Competitors show both sides of this. Solitaire Grand Harvest's +5 is described in strategy guides
as *"essentially gambling"*, and the reviews show the cost. Royal Match engineers near-misses in
level design and converts far better. The difference is control.

### Design intent

Beats like the **streak denial** — four cards down, reaching for the fifth, and the board goes
dead — are the moments the game is actually made of. Today they happen when the shuffle allows.
They should happen because we put them there.

---

## 3 · What we are building

The Adaptive Experience Director decides every card value on purpose. Given a level's shape and a
chosen outcome, it assigns every rank, orders the deck, picks the opening card — and where it
can, **proves the level lands on that outcome no matter how the player plays**.

Five outcomes:

| | |
|---|---|
| Comfortable Win | clear the board with 4–6 draws unused |
| Close Win | clear it with 1–3 unused |
| Last Card Win | clear it on the final card |
| Close Lose | run out with 1–3 cards stranded |
| Comfortable Lose | run out with 4–6 stranded |

The principle behind it, and the reason it generalises:

> **The target outcome is fixed. The experience is not.**

Two players on the same level, both aimed at Close Win, can have completely different rounds —
different chains, different denials, different decisions — and both finish with exactly two draws
unused.

---

## 4 · Why *proof*, not just steering

This is the part that distinguishes it from what exists.

The current system steers and hopes. The Director **verifies**: before a level is accepted, every
legal line a player could take is explored, and the level is discarded unless every single one
lands on the target.

That means:

- **No lucky line.** A player who finds an unusual route still gets the intended outcome.
- **No unlucky line.** A player who plays badly is not punished beyond what was designed.
- **No exploit.** There is no sequence that breaks it, because all sequences were checked.

And it verifies more than the number. A level is also rejected unless it *guarantees* at least
one streak denial, at least one payout where the arithmetic allows, and — on a losing level — at
least one genuine fork.

That last one matters more than it sounds. **A losing level with no real choices is a corridor**,
and the loss was never the player's. Requiring a fork means every designed loss contains a
decision that felt like it mattered, even though it could not change the ending.

---

## 5 · What it achieves

Measured across the full catalogue of 2,500 levels and roughly 200,000 simulated rounds:

| | |
|---|---|
| levels that land on an exact target, **proved** | **52%** |
| the rest, steered live | **~87% inside band** |
| verified levels that ever missed | **zero** |
| levels with no director at all | **0.04%** |

That "zero" is the headline. Across two independent implementations, four different player
behaviours, and 200,000 rounds, **no verified level has ever missed its target**.

### The two halves are complementary, not a compromise

Verification gets harder as more cards sit face up, because every open card is another branch
that must also land on the target — 81% verified with four cards open, 9% with twelve. Steering
gets *easier* for the same reason: more open cards means more ways to correct.

Measured across five independent slices of the catalogue:

| levels | proved | steered, in band |
|---|---|---|
| 1–250 | 74% | 81% |
| 251–500 | 52% | 86% |
| 501–750 | 50% | 88% |
| 751–1000 | 39% | 88% |
| 1001–1250 | 49% | 86% |

So **52% does not mean half the catalogue is undirected.** Every level is directed. About half
carry a mathematical guarantee, and the accurate steering is concentrated exactly where proofs
are scarce.

---

## 6 · What it unlocks

**A real difficulty curve.** Outcomes become a design input rather than an observation. The curve
the team draws is the curve players get.

**Losses worth having.** A designed loss is a near miss with real decisions in it — which is both
the better experience and the one that converts.

**A monetization moment that works.** The rescue offer is only worth anything if the player was
close. Now they are close because we decided they would be.

**Honest offers.** The director can tell, before showing a rescue, whether it can possibly
succeed — and decline to sell one that cannot. No competitor in this genre appears to do this.

**Levels that can be trusted.** 2,500 levels validated automatically, with any that cannot be
directed identified up front instead of discovered by players.

---

## 7 · The line we are not crossing

There is a version of this that adjusts difficulty to extract money — rescues engineered to
*nearly* work so a second can be sold.

We are not building that, for two reasons.

**It is a named regulatory risk.** EA disclosed *"adjusting difficulty in its games in order to
push people toward buying more loot boxes"* and drew public and regulatory attention. The FTC now
treats dark patterns as intentional conduct rather than design error. The EU's Digital Fairness
Act consultation named games specifically.

**And it is commercially worse.** Our own measurements show why: a rescue only sells when the
player was close, and a player who was close is a player the rescue can actually save. To make
rescues genuinely fail you would have to strand far more cards — and a player twenty cards from
the end does not buy, they quit.

The near miss is what drives the purchase *and* what makes the rescue work. Good design and good
monetization point the same direction here. That is not always true, and it is worth taking when
it is.

The distinction the industry draws is precise, and we hold to it:

> **Engineering the near miss in level design is good design. Rigging the thing the player paid
> for is not.**

---

## 8 · Honest limits

**About half the catalogue cannot be proved**, and that is structural — large boards with many
cards face up produce too many branches to converge on one number. Those levels are steered
instead, at around 87% accuracy.

**Wilds cannot be covered by a proof.** A Wild lets any face-up card be played, and we tested
this directly: modelling even one Wild breaks *every* verified level. So Wild use is handled by
recovery — re-planning what the player has not yet seen — which holds the target about 90% of the
time rather than always.

**Building a proved level takes real time** — up to eleven seconds on a desktop for the hardest
boards, more on a phone. It runs ahead of the player, in the background, never while they wait.
Everything else the director does is effectively free.

---

## 9 · What success looks like

**Short term.** Levels deal from the Director behind a flag. A verified level plays to exactly
its stated outcome. Telemetry reports target versus actual on every round.

**Medium term.** The three old systems are gone. Outcome is a level-design parameter. The rescue
offer knows whether it can work before it is shown.

**The number to watch.** *Verified levels that missed their target: zero.* It is zero across
200,000 simulated rounds. If it is ever non-zero in production, something has regressed — and
that is a much better alarm than any difficulty metric, because it is a proof failing rather than
a preference drifting.

---

## 10 · In one paragraph

Today the game authors shapes and shuffles values, so the experience a player gets is mostly
chance. The Adaptive Experience Director decides those values deliberately, and for about half
the catalogue proves the level lands exactly where intended no matter how it is played — with the
remainder steered to roughly 87%. That turns outcome into a design parameter instead of an
observation: real difficulty curves, losses that feel like near misses rather than accidents, and
a monetization moment that works because the player genuinely was close. Across 200,000 simulated
rounds, no verified level has ever missed.
