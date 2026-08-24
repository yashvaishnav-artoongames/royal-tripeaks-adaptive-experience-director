# TriPeaks Experience Director — project memory

Everything from the project so far, across three working sessions (18–21 August 2026).
Written so a fresh conversation can pick up without re-deriving anything.

**Game:** Royal TriPeaks, Unity/C#, ~2,500 levels.
**Repo:** `D:\Workspace\Live\royal-tripeaks-version-5.6`, branch
`feature/level-experiance-difficulty-improvements`.
**Levels:** `D:\Data\Levels Json` (clean 5-key export — the working source of truth) and
`Assets/Ads/Resources/Levels` (shipped, 15 keys).

Prior transcripts: `/mnt/transcripts/2026-08-19-...-design-session.txt` and
`2026-08-20-...-engineering-session.txt`.

---

# PART A — What the project is

A TriPeaks level ships as a topology: card positions and a dependency graph saying which cards
block which. The card *values* are not in the file — traditionally a shuffle. So difficulty is
whatever the shuffle produced.

The **Experience Director** decides those values deliberately. Given a topology and a chosen
outcome, it assigns every tableau rank, orders the deck, picks the opening waste card, and —
where it can — **proves the level lands on that outcome no matter how the player plays**.

## A1 · The five outcomes

| index | outcome | win | band |
|---|---|---|---|
| 0 | Comfortable Win | yes | 4–6 draws unused |
| 1 | Close Win | yes | 1–3 draws unused |
| 2 | Last Card Win | yes | exactly 0 |
| 3 | Close Lose | no | 1–3 cards stranded |
| 4 | Comfortable Lose | no | 4–6 cards stranded |

A verified level commits to **one exact value** inside the band, not the band itself.

The user's framing, stated in session 1 and never revised:

> *"our target outcomes is fixed but not experiance. our experiance can be anything but target
> outcomes is the thing which need to matched."*

## A2 · Game rules — all confirmed by the user

- Cards clear onto the waste when adjacent in rank. **Suits ignored entirely.**
- **King wraps to Ace.** `|a−b| == 1 || |a−b| == 12`. Confirmed after being flagged as blocking:
  without wrap, A and K are dead ends and the reference level's `K→A` run would be invalid.
- A card is playable when every blocker has gone. No blockers = face up at deal.
- **Streak meter: 5 cards in a row pays a reward and resets to 0. No per-level cap.**
- **A Wild does NOT reset the streak** — it continues it.
- Drawing resets the streak to 0.
- Deck exhausted with no legal move ends the round.
- One deck card seeds the waste, so `draws = deckSize − 1`.
- Rank supply = `4 × ceil((cards + deck) / 52)`. Boards over 52 cards use two decks.

## A3 · The experience vocabulary

**Streak denial is the core beat**, and the user was emphatic about it:

> *"after 4 cards user don't have chance to collect 5th card and complete streak so basically
> user will force to use wild card or wasted a streak… whenever it is possible to create it
> should be high priority"*

and later:

> *"streak denial should be dynamic position… it should be randomly"* — not always after the
> first run.

Denial run lengths are therefore **4 and 9** (both leave the meter one short — 9 pays at 5 then
leaves 4). Non-denial lengths are 1, 2, 3, 5, 6, 7, 8. Between 1 and 3 denials per level,
scattered by shuffling slot positions.

**Run clamping**, from the user:

> *"the maximum number of sequential cards a user can collect should be clamped randomly between
> 6 to 9 cards. Currently, some experiences allow users to collect 12–14 cards in sequence,
> which feels excessive. This clamping rule may be bypassed when specific endgame behaviors
> require matching outcomes."*

**Losing levels must not feel scripted**, also from the user:

> *"During close loses or comfortable loses, we often observe repetitive patterns: users receive
> too many match cards at the start, followed by multiple dead draws, finally the last card
> clears all matches but still results in a loss… Every loss should feel winnable and deliver the
> same level of excitement as a win."*

Hence the three extra constraints on losing levels: last run ≥ 3 cards, first run not oversized,
and a payout in the back half.

**Dead draws** spread across gaps between runs, at most two consecutively. Three in a row reads
as broken rather than as a setback.

**Payouts are conditional** — if no feasible arrangement could produce a run of 5, the
requirement is dropped rather than failing the level. That one conditional unlocked every
small-deck level.

---

# PART B — Architecture

## B1 · Two directors, complementary

**Verified** — propose and reject. Generates a candidate deal, hands it to a verifier that
explores every legal line, discards it unless *every* line lands on the target. Thousands of
proposals per build. **~52% of the catalogue.**

**Live** — commits only the face-up cards and the opening waste. Every hidden card is decided at
the moment the player would first see it. **~87% inside band.** Two rules keep it honest: only
cards never seen may be set, and once seen a card is fixed — across undo, across replay.

They are **complementary, not primary and fallback**. Verification gets harder as more cards are
face up (81% verified with 1–4 open, 9% with 12+); steering gets *easier* for the same reason.
Measured across five 250-level segments: verified fell 73.9% → 38.8% while live rose
81.2% → 88.4%.

So 52% verified does not mean half the catalogue is undirected. Every level is directed — about
half with a proof, and the accurate steering is concentrated exactly where proofs are scarce.

## B2 · The verifier

State: `(cleared bitmask, waste rank, deck index, meter)`. Memoised on all four — the meter must
be in the key or denial counts differ.

At each position: if any card is legal the player must play one, so **all** legal cards are
explored and every branch must succeed. If none, draw. If none and the deck is empty, the round
ends — and that ending must be exactly the target.

**Acceptance is more than hitting the target.** Also rejected unless:

- `minDenials ≥ 1` when the deck is non-empty — the core beat must be guaranteed
- `minPayouts ≥ 1` when needed
- `forks ≥ 1` on a losing level — *the player must have had real choices*

That last one matters: a losing level with no forks is a corridor, and the loss was never theirs.

Reports `minDenials`, `minPayouts` (minimised over all branches, so they are guarantees),
`forks`, and `states` (memo size — reproducing it exactly is how a port proves it searches the
same tree). Cap: 250,000 states.

## B3 · Recovery (`reDirect`)

Anything off-plan — Wild, wasted draw, booster — escalates:

1. **Still holds?** Re-prove from the actual position; change nothing.
2. **Re-order the deck.** Nearest orderings first, re-prove.
3. **Re-deal everything unseen.** Face-down cards *and* the rest of the deck, re-prove.
4. **Live.** Only when nothing else works.

~90% still land on target after a Wild. Step 3 is what makes it work: deck reordering alone
recovered 62/70; adding the re-deal took it to 66/70 and cut drops-to-live from 13 to 6.

**Modelling even one Wild in the verifier breaks every verified level** — tested directly, at
30–4,786 states, so it is not a search limit. With nine cards open a Wild opens nine branches
landing on different counts. Recovery is the only workable answer.

## B4 · Mistakes

From the user in session 1:

> *"We need to introduce an option that allows users to make mistakes… If a user knowingly makes
> mistakes, they should be penalized… mistake handling feels fair, adaptive, and consistent"*

Implemented as the same `reDirect` path, with a "Draw anyway" button in the demo.

## B5 · Scrolling levels

One wide map behind a fixed window; clearing the left advances it. A card outside cannot be
played at all.

**The window is a pure function of what remains:**

```
S = min{ x of remaining cards } + 400
in view  ⟺  x − S < 468.75
```

So verification needs no extra state. Validated against the shipped recurrence over 10,000
random removal orders, zero disagreements.

The shipped code has a **sticky gate**: once nothing is off-screen the board never scrolls again.
Use the closed form for verification, the tracked gate for display.

**Detecting a scrolling level when the flag is missing:** `max x > 600` (fixed boards end by
~524, scrolling start at ~761). *Not* board width — a fixed board spanning −524..+524 is 1048
wide and would be misread.

---

# PART C — Results

## C1 · Full sweep, 2,500 levels

**51.8% verified · 48.2% live · 5 blocked.**

Board size drives it: 97% at ≤20 cards, 94% at 21–25, 77% at 26–30, **27% at 31–35**, 8% at
36–45, 1% at 46+. Two-deck levels (427, 17% of the catalogue) verify at 9.5% vs 60.5%.

The mechanism is exposure, not size: **81% verified with 1–4 cards face up, 9% with 12+.**

The 5 blocked are genuine: L1 and L11 have `NumberOfDeckCards: 1` — **zero draws** — so "win with
4 unused" is arithmetically impossible. (L1 and L11 are also byte-identical duplicates.)

## C2 · Validation

- **3,484 golden vectors**, C# reproduces every one including exact state counts
- **~200,000 rounds played** across four player behaviours (random, greedy, cautious, contrary)
- **Zero verified levels ever missed a clean round.** No rule breaks, no supply violations, no
  seen card ever changed
- **C# vs JS: 52.8% vs 52.3% verified** over 1,250 levels — 0.5 points apart, disagreements
  near-symmetric (534 vs 507), the signature of two randomised searches on borderline levels

## C3 · Runtime cost (desktop; a phone is several times slower)

| | median | p90 | worst |
|---|---|---|---|
| build a verified level | 398 ms | 2.8 s | 11 s |
| start a live level | 0.02 ms | 0.02 ms | 2 ms |
| a move | ~0 | ~0 | 0.05 ms |
| re-plan after a Wild | 0.08 ms | 36 ms | 461 ms |

**Only the proof search is expensive** — inherent to propose-and-reject. Decision: generate ahead
of time on device, in the background while the player is on the meta screen. No baking, no
shipped data.

---

# PART D — The C# port

12 files, no Unity references, builds and tests standalone under mono or `dotnet`.

```
Model.cs  Rng.cs  RunPlanner.cs  Generator.cs  Verifier.cs  Builder.cs
LiveDirector.cs  Round.cs  Redirect.cs  BakedLevel.cs  DirectorService.cs  LevelJson.cs
+ Director.Core.asmdef
```

**Copied to `Assets/Scripts/Director/` and compiled with no errors. Nothing wired up yet.**

`DirectorService` is the entire game-facing surface:

```csharp
int[] Generate(Level, string outcome, uint seed, int attempts);
int   SeedCard { get; }
int   RankOf(int cardIndex);          // read at reveal on live levels
void  OnCardPlayed(int cardIndex);
int   OnDraw();
RedirectResult OnOffPlanEvent();      // wild, wasted draw, injection
RedirectResult OnExtraDeckCards(int); // +5
string TargetDescription { get; }
string Report(bool won);
```

The port was **differential, not a translation** — golden vectors generated from the JS, and the
C# asserted against them. The verifier is where being subtly wrong is most dangerous, because a
broken verifier does not crash; it hands you confident false proofs.

**`Rng.cs` must not be compiled with checked arithmetic** — it relies on 32-bit wraparound.

---

# PART E — Unity migration

Two prompts in `UNITY_INTEGRATION_PROMPT.md`, **removal first** — the user's call, and correct.
Keeping both systems means writing suppression scaffolding that gets deleted anyway, and every
bug is ambiguous while it exists.

**Prompt A — remove.** `LevelManipulator`, `Hard_LevelManipulator`, `DifficultyEngineRuntime`,
`OutcomeDirector`, `BeginDirector`, the dead helpers, and the two byte-identical dead deal twins
(`PlaceAllCardsInstantly`, `PlaceDeckCardsInstantly`). **Keep** the `CardWriteBarrier` from the
AED branch and `CardSequence`'s authored-sequence path. Ends with the game dealing from a plain
shuffle — a real checkpoint.

**Prompt B — wire in.** `DirectorFlag`, `DirectorLevelProvider` implementing `ICardDataProvider`
(already an interface at `BoardManager.cs:1153`), `DirectorHooks`, editor debug overlay.

## E1 · Things that will bite

- **`Card.SetCardData` computes `(index % 13) + 1`.** Supplied data carries sequence indices, so
  **a King is 12, not 13.** Get it backwards and every card deals one rank low and the board
  still looks entirely valid. Nothing throws.
- **The reveal-time overwrite** must be suppressed until the manipulators are gone, or a level
  deals right and then drifts.
- **The difficulty engine is `Enabled: 1, RolloutPct: 100` at HEAD** — live for every user.
  Removing it needs a staged rollout with a win-rate comparison, not a merge.
- **Normal play injects cards** — streak rewards, board Plus cards, `AddFireCard` — at randomised
  deck positions, no purchase, no cap. Must route through the director.
- **Suit is not controllable** — `Card.cs:471` rolls a random one; `CardSuits` has no consumers.
- **`DependedOn` is parsed positionally**; **`DeckFirstCard` has a `+1` sentinel** (literal `0`
  means card index 0, not "no override").
- **Double-value cards re-roll a rank at `Card.cs:575` during play.** Not an obstacle, so
  "no obstacles" does not cover them. **Undecided.**

## E2 · Corrections found in the port notes

- `DIRECTOR_PORT_NOTES.md` claimed the game never detects a loss. **It does** —
  `OnHeadCardUpdate_TryAutoOutOfCards` at `BoardManager.cs:325`. Only automatic *attribution* is
  missing.
- The AED branch's write-barrier census misses two sites: `Set_Red_Color_Card`,
  `Set_Black_Color_Card`.
- An AED branch already exists (48 files, `CardWriteBarrier`, solver, planner) — a parallel
  attempt at the same problem.
- `Hard_LevelManipulator.ApplyDeterministicOutcome` already targets the same quantities
  (`WIN_TARGET_DECK_MIN/MAX = 0..3`, `LOSE_TARGET_MAP_MIN/MAX = 1..6`) — it steers live and never
  proves.

---

# PART F — Decisions the user made

| | |
|---|---|
| Obstacles | **Not shipping.** Working-tree behaviour is the target. |
| `DeckFirstCard` | Being removed from all JSONs. Parser already ignores it — no work needed. |
| Old code | **Complete removal**, new system from scratch. Not coexistence. |
| Loss condition | The out-of-cards state counts as a loss; whether `RaiseFail` fires doesn't matter, because the choice offered there is the monetization moment. |
| Wilds | Cannot be restricted. Must re-validate and adapt after use. |
| Generation cost | Generate ahead of time on device, in the background. |
| Level data | Clean export at `D:\Data\Levels Json` is the source of truth. |
| Tiers 1–3 | Removed. Tier 0 goes straight to the live director if it fails. |

---

# PART G — The Extra Card Experience Director (ECED)

Built to the user's `Extra_Card_Experience_Director_Spec.md`. A **separate live director**,
invoked only once the core level has ended. Its job is not to solve the board — it is to make a
short rescue sequence feel like something.

The user's framing:

> *"extra cards experiance needs to be ruthless towards a users. it is luck by chance things
> where user have very less chance of get what he wants. those chances can increase if he uses
> extra cards multiple time… this is only situation where we can capitalize on users."*

and:

> *"we will never made auto quit level we will always give choice of his extra cards till level
> gets clear or quit manually by users."*

## G1 · What is built

- **7 experience modes** — Immediate Hope, Near-Miss, Tension Build, Comeback Chain, Clutch
  Finish, Almost There, Balanced. Chosen by context; recent modes down-weighted.
- **Separate 3-card and 5-card arcs.** A three-card rescue has no room for two setup cards.
- **Per-card curve positions** — HOPE, SETUP, BLOCK, TENSION, RECOVERY, CHAIN, OPPORTUNITY,
  CLUTCH.
- **Named scoring components**, all shown in the panel: `playable`, `chain`, `unblock`,
  `progress`, `finish`, `recovery`, `mode`, `deadEnd`, `repeat`.
- **Controlled imperfection** — picks from a band within 18 points of the top, never always the
  maximum.
- **Escalating odds** — `ecWinChance()` = 22% + 22% per rescue already taken, adjusted for cards
  left. Persistence buys the win.
- **Intent** — `win` / `almost` / `progress`, decided at rescue start. On `almost` the director
  is scored *against* finishing (−70), deliberately leaving the player short.
- **Re-offer loop** — the offer returns every time the board dies. Never auto-quits.
- **Safety** — never two dead cards in a row, never a wasted final card, and `ecCanDoAnything()`
  refuses the offer entirely when no rank can touch the board.

## G2 · Measured (100 dead boards, persistent buyer)

```
cleared on try 1   43%
cleared on try 2   57%
dead cards         67/342  (20%)
rescues that did nothing at all: 0
```

## G3 · Open — where the session stopped

- **`ecWinChance()` says 22% on the first rescue; measured 43%.** The `almost` intent is not
  holding — the director aims to fall short and clears anyway. Same class as the earlier
  shape-drift bug: a card chosen to clear 2 clears 4 when a fork opens. **Not diagnosed.**
- **Every board eventually clears** by try 2 or 3. For genuine risk the ceiling must stay below
  certainty, or escalation must be slower.
- 43% on try one may be generous for "ruthless".

Both are single numbers in `ecWinChance()`. The user said not to proceed.

## G4 · The design position, and why

Research covered Royal Match, Solitaire Grand Harvest, and the regulatory environment. One line
holds it together:

> **Engineering the near miss in level design is good design; rigging the rescue the player paid
> for is not.**

- Royal Match engineers near-misses in *level design*, then the continue delivers — and the
  second continue **escalates** (adds a rocket, not just moves).
- Solitaire Grand Harvest's +5 is described in strategy guides as *"essentially gambling"*, and
  the reviews show the cost: *"use the extra 5 cards… then you're out of gold."*
- **EA was specifically named by regulators** for *"adjusting difficulty in its games in order to
  push people toward buying more loot boxes."* The FTC now treats dark patterns as intentional
  conduct; the EU Digital Fairness Act consultation named games; Italy's AGCM opened
  investigations in late 2025.

The commercially better version is also the honest one. A rescue that reliably delivers when
offered gets bought voluntarily; refusing an impossible rescue is what buys credibility for the
genuine upsell.

**And the data supports it.** Directed losses strand only 3–6 cards by construction, so a rescue
is nearly always winnable — the 73%/93% ad/coin split comes from the director *choosing* not to
take the win, not from the board being hard. To make rescues genuinely fail you would have to
strand many more cards, but a player 20 cards from the end doesn't buy — they quit. The near
miss is what drives the purchase *and* what makes the rescue work.

---

# PART H — Bugs found (all three sessions)

Every one was invisible to ordinary testing.

1. **32-bit bitmask.** JS bitwise ops are 32-bit, so `(1 << N) − 1` is 0 at N = 32. **Every level
   of 31+ cards was verified against a nonsense mask for weeks.** It did not crash — a broken
   verifier silently returns confident false proofs. Found only when a bot played the levels and
   caught a verified level missing. Fixed with two 26-bit halves in JS; C# uses a single `ulong`.
2. **Loss pacing.** `goal = cardsLeft − target`, not `cardsLeft`. Getting it wrong made the
   director try to clear a board it was told to strand. Cost 28% accuracy on losing outcomes.
3. **Replay paired new ranks with the old deck.** `reDirect` updated the round's deck but not
   `LV.deck` — 1,261 supply violations under stress.
4. **Undo didn't restore re-dealt ranks.** 19 of 232 action/undo pairs failed; the snapshot only
   captured ranks for live levels.
5. **Two-deck suit allocation** gave a third copy of a card, 484 times.
6. **`SCROLL` read before assignment** — cold load scaled the board to the whole map.
7. **Scrolling detection used width, not max x.**
8. **Two copies of the same logic** — `tripeaks.html` and `director-core.js` drifted the moment a
   fix landed in one.
9. **Rescue shapes were labels, not behaviours.** Only 5 of 9 were ever validated; a full audit
   gave 53/94 delivering what the panel said, fixed to 84/94.
10. **The main director kept binding reveals during a rescue**, so every rescue cascaded to a win
    on card one.
11. **`ecSim` counted face-down cards as automatically playable**, inflating every forecast.
12. **Arbitrary floors** — minimum 3 runs, minimum 1 dead draw, unconditional payout requirement.
    Each made whole classes of level unbuildable. Runs of 1 and zero dead draws are normal.
13. **Wall-clock search budgets** cannot reproduce across machines. Count attempts instead.
14. **Silent `str_replace` failures** — several patches reported success while matching nothing,
    usually escaping (`\\u2026` vs the character). Every patch now asserts its anchor.

---

# PART I — Artifacts

All in `/mnt/user-data/outputs/`.

| file | |
|---|---|
| `tripeaks.html` | the demo — 10 levels, core director, skip-to-end, ECED |
| `director-core.js` | the JS core with no DOM; the port reference |
| `Director.Core/` + loose `.cs` | the 12-file C# library + asmdef |
| `sweep.js` | catalogue sweep, segmented |
| `playtest.js` | plays every level four ways |
| `make-vectors.js` | golden vector generator |
| `check-scroll-inference.js` | proves the scrolling flag can be recovered |
| `EXPERIENCE_DIRECTOR.md` | full technical reference, code level |
| `DIRECTOR_SPEC.md` | function-by-function spec for porting |
| `INTEGRATION_PLAN.md` | how it sits inside Unity |
| `UNITY_INTEGRATION_PROMPT.md` | the two Claude Code prompts |
| `PORT_PROMPTS.md` | the six-step port sequence |
| `RESCUE_DIRECTOR.md` | rescue research and design |
| `DIRECTOR_PORT_NOTES.md` | *(from the user)* how the game loads levels |

## Running things

```bash
node sweep.js     --dir "D:\Data\Levels Json" --segment 250 --workers 8
node playtest.js  --dir "D:\Data\Levels Json" --segment 250 --workers 8 --disrupt
node make-vectors.js --dir "D:\Data\Levels Json" --out golden-vectors.json --losses
node check-scroll-inference.js --shipped "...\Assets\Ads\Resources\Levels"
dotnet run -- --dir "D:\Data\Levels Json" --segment 250 --wilds --csv report.csv
```

**Reading a report:** the only line that must be zero is *verified rounds that missed*. A
verified level is a proof; a miss is a bug, not tuning. Clean rounds and Wild rounds are counted
separately — a Wild leaves the proved line by design.

---

# PART J — Still open

1. **Re-run the sweep** with corrected scrolling detection. 215 levels are currently judged by
   the wrong rules, so 51.8% is mildly optimistic for those.
2. **The rank-supply experiment.** Large-board failures are dominated by supply (16,221 of 19,500
   attempts on one 32-card level). The generator still uses a greedy walk; constraint propagation
   might move the 31–35 band materially. **Untried, and the single most promising lever.**
3. **Double-value cards** — excluded from directed levels, or routed through `Redirect`?
4. **`+5` semantics.** `OnExtraDeckCards` currently gives the player the slack they paid for.
   Suppressing or re-targeting are equally supported.
5. **The two-copies problem.** Once the C# is real, the demo should load the core rather than
   carry its own.
6. **ECED tuning** — the 22%/43% gap, and whether persistence should ever be a guaranteed win.
7. **Unity integration itself** — the library compiles; nothing is wired up.
