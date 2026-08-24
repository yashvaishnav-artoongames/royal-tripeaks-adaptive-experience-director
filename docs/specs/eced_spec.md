# Extra Card Experience Director (ECED)
## Design Specification for TriPeaks Rescue / Extra-Card Monetization

**Status:** Proposed design for prototype integration  
**Purpose:** Define a dedicated live experience director for the two post-loss extra-card rescue options:
- **+5 Extra Cards** — coin / premium currency rescue
- **+3 Extra Cards** — rewarded-ad rescue

---

# 1. Executive Summary

The existing core Adaptive Experience Director (AED) is responsible for the normal level experience. It generates and verifies the intended level outcome and adapts the unseen portion of the level while the core level is still in progress.

That responsibility ends when the core level reaches its terminal outcome:

1. The player wins the level, OR
2. The player reaches the loss condition: the deck/draw supply is exhausted and the remaining tableau cards satisfy the selected lose outcome.

At that exact point, the player is offered a rescue choice:

- **Use +5 Extra Cards**
- **Watch an Ad / use +3 Extra Cards**
- **Quit**

The rescue cards are NOT a continuation of the core AED.

Instead, both rescue options must hand control to a separate:

> **Extra Card Experience Director (ECED)**

ECED is a dedicated **live director** whose only responsibility is controlling the experience created by cards added after the core level has ended.

The +5 and +3 options use the **same ECED logic**. The only major input difference is the number of rescue cards available and the monetization context.

The objective is NOT to give the player the mathematically best card every time.

The objective is to create a short, controlled, exciting rescue sequence that can produce:
- hope
- tension
- near-misses
- discovery
- comeback moments
- satisfying clears
- uncertainty
- anticipation
- occasional clutch wins

while maintaining:
- monetization value
- player satisfaction
- perceived fairness
- replayability
- controlled win probability
- non-repetitive rescue experiences

---

# 2. Why ECED Must Be Separate From Core AED

The core AED and rescue AED have fundamentally different jobs.

## Core AED

The core director answers:

> "How should this level behave?"

It controls the pre-committed or adaptive level experience and target outcome.

Its target may be:
- Comfortable Win
- Close Win
- Last Card Win
- Close Lose
- Comfortable Lose

The demo supports verified generation and a live fallback. A verified director proves the target across legal lines; the live director adapts unseen cards as they are revealed. Once cards are seen, they are fixed. 

## ECED

The Extra Card Experience Director answers:

> "Now that the player has already lost, how should these limited rescue cards feel?"

This is a different problem.

The rescue sequence should NOT simply solve the board as efficiently as possible.

A rescue is a monetization moment.

Therefore:

```text
CORE AED
Level start
   ↓
Normal gameplay
   ↓
Verified / adaptive / live
   ↓
WIN or CORE LOSS
   ↓
CORE AED ENDS
   ↓
Rescue Offer
   ├── Quit
   ├── +5 Extra Cards
   └── +3 Extra Cards / Ad
            ↓
        ECED STARTS
            ↓
       Rescue sequence
            ↓
       WIN / RESCUE ENDS
```

The handoff must be explicit.

---

# 3. Core AED → ECED Handoff

The handoff happens ONLY after the core level has reached its terminal state.

## Core Win

If the player clears the tableau:

```text
Core Level = WON
ECED = never started
```

No rescue is offered.

## Core Loss

The core level is considered lost when:

```text
No deck/draw cards remain
AND
The player cannot continue
AND
Remaining tableau cards satisfy the configured lose outcome
```

At this point:

```text
Core AED = COMPLETE
Core target = LOCKED
Core unseen-card adaptation = STOPPED
ECED = NOT YET STARTED
```

The game displays the rescue choice.

---

# 4. Important State Boundary

Do NOT allow the two directors to control the same state simultaneously.

Use an explicit director ownership model:

```text
DirectorPhase.Core
DirectorPhase.Rescue
DirectorPhase.Completed
```

Recommended ownership:

```text
CORE
 ├── Level generation
 ├── Core target
 ├── Core verification
 ├── Core replanning
 ├── Core reshaping
 └── Core live steering

RESCUE
 └── ECED owns only newly generated rescue cards

COMPLETED
 └── No director changes anything
```

This prevents the old core director from unexpectedly changing rescue cards.

---

# 5. ECED Design Philosophy

ECED should NOT be:

> "Give the player the best possible card."

That creates an efficient solve but not necessarily a satisfying rescue.

The desired experience is:

> **Controlled uncertainty with meaningful hope.**

The player should feel:

```text
"I might still save this..."
       ↓
"That card helped!"
       ↓
"Oh no, I'm blocked again..."
       ↓
"Wait... I can continue!"
       ↓
"One more..."
       ↓
"YES!"
```

This is a short dramatic arc.

The rescue should feel like a mini-adventure, not a deterministic vending machine.

---

# 6. ECED Core Rule

ECED is a LIVE director.

It does NOT pre-prove the entire rescue sequence before the player sees it.

At each rescue draw/reveal, ECED evaluates the current game state and selects an appropriate card value from the remaining legal/safe candidate space.

However:

> It must not always choose the strongest possible card.

Instead, it chooses according to an **experience strategy**.

---

# 7. Rescue Card Supply

The two rescue options use the same ECED.

## +5 Rescue

```text
Rescue Type = COIN
Rescue Cards = 5
```

## +3 Rescue

```text
Rescue Type = REWARDED_AD
Rescue Cards = 3
```

Do not create separate algorithms.

Use:

```text
ExtraCardExperienceDirector
```

with:

```csharp
RescueContext
{
    RescueType
    ExtraCardCount
    MonetizationContext
    PlayerContext
    LevelContext
}
```

The count changes the available rescue budget.

The experience strategy remains shared.

---

# 8. Monetization Context

ECED should understand WHY the player entered rescue.

Recommended enum:

```csharp
public enum RescueType
{
    CoinPurchase,
    RewardedAd
}
```

The director should also receive:

```csharp
public enum MonetizationIntent
{
    Revenue,
    AdImpression,
    PlayerRetention,
    ComebackOpportunity
}
```

Do NOT make monetization logic directly choose a card.

Instead:

```text
Monetization Context
        ↓
Experience Policy
        ↓
Candidate Evaluation
        ↓
Card Selection
```

This keeps monetization controllable without making the gameplay feel obviously manipulated.

---

# 9. ECED Should Never Feel Identical Every Time

A critical requirement:

> The rescue experience must vary.

Do NOT produce:

```text
Rescue card 1 → best move
Rescue card 2 → best move
Rescue card 3 → best move
Rescue card 4 → best move
Rescue card 5 → WIN
```

every time.

Instead, the director should select among multiple experience patterns.

Possible patterns:

## A. Immediate Hope

First rescue card creates an obvious continuation.

```text
Lose
 ↓
Rescue
 ↓
Playable card
 ↓
Streak begins
```

Good for a player who is highly frustrated or close to quitting.

## B. Near-Miss

First rescue card does not immediately solve the board, but creates a future opportunity.

```text
Rescue
 ↓
Small progress
 ↓
Blocked
 ↓
Next rescue creates opening
```

## C. Tension Build

Early rescue cards are conservative.

The final card has a high-impact opportunity.

```text
+5
  1 → setup
  2 → setup
  3 → tension
  4 → strong opportunity
  5 → clutch possibility
```

## D. Comeback Chain

A rescue card opens multiple tableau cards and creates a streak.

## E. False Hope

A rescue creates an apparent opportunity but does not immediately solve the level.

Use carefully. This should never feel intentionally deceptive or punitive.

## F. Clutch Finish

The player reaches a near-clear state and the final rescue card determines the outcome.

## G. Almost There

The player makes significant progress but still needs another opportunity, creating a strong reason to value the next attempt.

---

# 10. Rescue Experience Modes

Instead of a fixed rescue pattern, define a small experience policy system.

```csharp
public enum RescueExperienceMode
{
    ImmediateHope,
    NearMiss,
    TensionBuild,
    ComebackChain,
    ClutchFinish,
    AlmostThere,
    Balanced
}
```

ECED chooses the mode at rescue start.

The mode should be influenced by player/game context, but not rigidly determined.

---

# 11. Player Context

Recommended inputs:

```text
Player rescue history
Recent level losses
Recent wins
Recent rescue usage
Current streak
Current level difficulty
Current session length
Recent frustration indicators
Number of cards remaining
Number of exposed playable cards
Potential immediate moves
Distance to completion
Previous rescue experience mode
```

The goal is not to punish players.

The goal is to avoid repeatedly delivering the same emotional experience.

Example:

```text
Previous rescue = ImmediateHope
Next rescue ≠ always ImmediateHope
```

---

# 12. Board-State Features

Before selecting each rescue card, ECED should evaluate:

### Immediate Playability

How many currently exposed cards can be played from the candidate rank?

```text
0 = dead
1 = narrow
2 = healthy
3+ = strong
```

### Potential Unblocks

How many hidden cards could become exposed if this card starts/continues a sequence?

### Chain Potential

Can the candidate create a short streak?

### Board Progress

How many tableau cards would become removable?

### Finish Distance

How many tableau cards remain?

### Dead-End Risk

Does selecting this card make the rescue almost certainly useless?

### Recovery Potential

Can future rescue cards still create a playable path?

---

# 13. Candidate Card Classification

Every possible rescue card should receive a gameplay classification.

```csharp
public enum RescueCardQuality
{
    Dead,
    Weak,
    Setup,
    Useful,
    Strong,
    Clutch,
    Finish
}
```

Example:

```text
Candidate A
→ 0 immediate moves
→ Dead

Candidate B
→ 1 move
→ Setup

Candidate C
→ 2 moves + unblocks
→ Strong

Candidate D
→ clears final dependency
→ Finish
```

ECED uses this classification rather than blindly selecting the strongest card.

---

# 14. The Most Important Rule: Controlled Imperfection

ECED should usually select a card from an acceptable range rather than always taking the maximum score.

For example:

```text
Candidate scores

A = 92
B = 87
C = 81
D = 48
```

Instead of always:

```text
A
```

ECED may select:

```text
A / B / C
```

depending on the selected experience mode.

But it should avoid obviously bad choices unless the intended experience specifically calls for tension.

This produces:

> **controlled imperfection**

rather than deterministic solving.

---

# 15. Hard Safety Rules

Even in a tension mode, ECED must have safety constraints.

Never intentionally create an obviously dead rescue unless the rescue state is already mathematically exhausted.

Recommended hard rules:

### Rule 1 — Don't waste the entire rescue immediately

Do not intentionally choose dead cards repeatedly.

### Rule 2 — Preserve recovery possibility

After every rescue draw, check whether at least one plausible future continuation remains whenever enough rescue cards are left.

### Rule 3 — Avoid impossible bait

Do not create an obvious playable-looking situation that is guaranteed to fail solely to manipulate the player.

### Rule 4 — Final-card fairness

If the final rescue card cannot realistically create a win, do not repeatedly present it as if it will.

### Rule 5 — No infinite rescue

ECED cannot generate cards beyond the purchased/earned rescue count.

### Rule 6 — Seen cards remain immutable

Once a rescue card is revealed, its value is locked.

---

# 16. Rescue Card Selection Algorithm

At each extra-card draw:

```text
1. Read current board state
2. Read rescue cards remaining
3. Generate candidate ranks
4. Remove impossible/out-of-supply candidates
5. Simulate candidate impact
6. Calculate:
   - immediate playability
   - chain potential
   - unblocks
   - progress
   - recovery potential
   - finish potential
   - tension value
7. Apply current RescueExperienceMode
8. Apply player-context adjustments
9. Apply monetization policy constraints
10. Select from the acceptable candidate band
11. Reveal card
12. Lock card permanently
13. Re-evaluate after player action
14. Repeat
```

---

# 17. Candidate Scoring

Recommended conceptual scoring:

```text
Score =
    ImmediatePlayability
  + ChainPotential
  + UnblockPotential
  + Progress
  + RecoveryPotential
  + FinishPotential
  + ExperienceModeAdjustment
  + PlayerContextAdjustment
  + MonetizationContextAdjustment
  - DeadEndRisk
  - RepetitionPenalty
```

The exact weights should be configurable data, NOT hard-coded permanently.

---

# 18. Do Not Make Monetization a Direct Gameplay Manipulator

This is important.

Avoid:

```csharp
if (CoinPurchase)
    GiveBetterCard();
```

or:

```csharp
if (RewardedAd)
    GiveWorseCard();
```

That can make the experience feel unfair.

Instead:

```text
Rescue Type
     ↓
Context
     ↓
Allowed experience profile
     ↓
Candidate scoring
     ↓
Card selection
```

Both +3 and +5 should feel like legitimate rescue mechanics.

The difference can be expressed through:

- available rescue budget
- probability of reaching a comeback
- pacing
- opportunity density
- progression potential
- risk/reward profile

rather than blatantly "paid = good / ad = bad."

---

# 19. Recommended Difference Between +3 and +5

The two options SHOULD differ beyond card count, but should still use the same director.

## +3 Rewarded Ad

Three-card rescue should feel:

> "One short shot at a comeback."

Characteristics:
- faster
- higher drama
- less setup
- more concentrated decisions
- greater variance
- stronger immediate opportunities
- more likely to produce a short clutch moment

## +5 Coin Rescue

Five-card rescue should feel:

> "A serious second chance."

Characteristics:
- more room for setup
- more meaningful progression
- more potential for a comeback chain
- slightly more controlled pacing
- greater opportunity to recover from a bad starting position

This creates a meaningful product distinction without requiring separate algorithms.

---

# 20. Rescue Experience Curve

Do not make every rescue card equally valuable.

A useful five-card curve:

```text
Card 1 → HOPE
Card 2 → DISCOVERY / SETUP
Card 3 → TENSION
Card 4 → OPPORTUNITY
Card 5 → CLUTCH / PAYOFF
```

But the curve should be probabilistic.

For example:

```text
Mode A
HOPE → CHAIN → CHAIN → CLUTCH → WIN

Mode B
SETUP → DEAD-END → RECOVERY → CLUTCH → FAIL

Mode C
HOPE → PROGRESS → BLOCK → HOPE → WIN

Mode D
DISCOVERY → CHAIN → BIG PROGRESS → BLOCK → ALMOST
```

This is much more replayable.

---

# 21. Three-Card Curve

For +3:

```text
Card 1 → Immediate opportunity
Card 2 → Tension / recovery
Card 3 → Clutch / final outcome
```

Again, do not force the exact pattern every time.

---

# 22. Rescue Outcome Categories

ECED should track its own outcome, independent from the original core target.

Recommended:

```csharp
public enum RescueOutcome
{
    ImmediateWin,
    StrongProgress,
    PartialComeback,
    NearWin,
    RescueExpired,
    NoRecovery
}
```

This allows telemetry to answer:

> "What happened after users chose rescue?"

---

# 23. Monetization Optimization

ECED is a monetization technology, so it should produce measurable business outcomes.

Track:

```text
Core losses
↓
Rescue offer shown
↓
Rescue option selected
↓
Coin rescue conversion
↓
Ad rescue conversion
↓
Rescue cards consumed
↓
Rescue win
↓
Level completion
↓
Next-level continuation
```

Important metrics:

### Rescue Conversion

```text
rescue selections / rescue opportunities
```

### Coin Conversion

```text
coin rescues / rescue opportunities
```

### Ad Conversion

```text
ad rescues / rescue opportunities
```

### Rescue Win Rate

```text
rescues resulting in level completion
/
rescues started
```

### Rescue Completion Rate

```text
players reaching a meaningful board-progress state
/
rescues started
```

### Post-Rescue Retention

Do rescued players continue playing?

### Frustration Signal

Do players quit immediately after rescue?

---

# 24. Monetization Goal

The optimization target should NOT simply be:

> maximize rescue wins.

It should be:

> maximize long-term player value while maintaining a satisfying rescue experience.

Conceptually:

```text
Player Value =
Revenue
+ Ad Value
+ Session Continuation
+ Retention
- Frustration
- Rage Quit
- Perceived Unfairness
```

This is why ECED should optimize for experience quality, not just conversion.

---

# 25. Dynamic Experience Budget

ECED should have an internal concept of:

```text
Rescue Experience Budget
```

The budget is the number of extra cards remaining.

As the budget decreases, the director should become increasingly aware of:

- finish distance
- clutch potential
- remaining recovery paths
- whether the player has received enough progress
- whether the rescue is becoming pointless

Example:

```text
5 cards remaining
→ setup is acceptable

3 cards remaining
→ meaningful progress required

2 cards remaining
→ stronger opportunity preferred

1 card remaining
→ final emotional beat

0 cards
→ rescue ends
```

This creates natural tension.

---

# 26. Avoid Guaranteed Rescue Wins

A major design principle:

> Buying/watching an extra-card rescue should NOT guarantee a win.

Otherwise the rescue becomes a disguised continue button.

Instead, it should provide:

> **a credible chance to recover.**

The chance should be tuned by player/level context.

---

# 27. But Avoid Pointless Rescues

The opposite is equally dangerous.

If the rescue frequently produces:

```text
+3
→ no playable card
→ no progress
→ no playable card
→ end
```

players will learn:

> "Watching the ad / spending coins is useless."

Therefore ECED needs a minimum experience-quality floor.

Example:

```text
Every rescue should normally achieve at least one:
- playable continuation
- meaningful board progress
- new reveal
- streak opportunity
- credible near-win state
```

unless the board is genuinely beyond recovery.

---

# 28. Experience Quality Score

Add a runtime score:

```text
ExperienceQualityScore = 0..100
```

Possible components:

```text
+ Playable opportunity
+ Cards removed
+ New cards revealed
+ Streak created
+ Near-win state
+ Clutch moment
- Dead rescue cards
- Repeated dead cards
- Immediate hopelessness
```

This can be used for tuning and telemetry.

---

# 29. Repetition Prevention

Store recent rescue experience modes:

```text
Last 3 rescue modes:
ImmediateHope
TensionBuild
ImmediateHope
```

The next rescue should prefer another mode.

Also track:

```text
last card quality
last rescue outcome
last rescue length
last number of playable cards
```

This prevents the game from feeling scripted.

---

# 30. Determinism and Debugging

ECED should support deterministic seeds.

For example:

```csharp
ECED.StartRescue(
    levelSeed,
    rescueSeed,
    rescueType,
    playerContext
);
```

This allows developers to reproduce:

> "Level 104 +5 rescue produced an unexpected dead sequence."

The exact rescue can then be replayed.

---

# 31. Debug UI for the Demo

The prototype should expose:

```text
EXTRA CARD EXPERIENCE DIRECTOR

Rescue:
+5 COIN

Mode:
Tension Build

Cards Remaining:
3 / 5

Current Board:
17 cards remaining

Current Opportunity:
2 playable cards

Candidate Cards:
A  Score 91  Strong
K  Score 83  Useful
5  Score 67  Setup
9  Score 31  Dead

Selected:
K

Reason:
Strong continuation + future recovery
```

This is extremely useful for validating the logic with Claude and during Unity implementation.

---

# 32. Recommended Demo Scenarios

The Claude implementation should include dedicated test scenarios.

## Scenario 1 — +5 rescue

Player loses core level.

Select +5.

Verify:
- Core AED stops
- ECED starts
- exactly 5 rescue cards available
- rescue cards are generated dynamically
- seen cards never change

## Scenario 2 — +3 rescue

Same as above with 3 cards.

## Scenario 3 — Quit

Verify:
- ECED never starts
- level ends normally

## Scenario 4 — Immediate rescue win

A rescue card creates a legal finishing path.

Verify ECED ends immediately when tableau is cleared.

## Scenario 5 — Rescue expires

All rescue cards consumed and tableau remains.

Verify:
- ECED stops
- no additional cards are generated

## Scenario 6 — Near comeback

Rescue creates significant progress but does not win.

Verify the player experiences meaningful tension.

## Scenario 7 — Different rescue modes

Run the same board multiple times with different rescue seeds.

Verify the sequence is not identical.

## Scenario 8 — Repeated rescue

Run multiple levels.

Verify the same experience pattern is not repeated excessively.

---

# 33. Acceptance Criteria

ECED is considered successful only when:

### Functional

- Core AED always ends before ECED starts.
- ECED never modifies cards already seen.
- +3 and +5 use the same director.
- +3 produces exactly three extra cards.
- +5 produces exactly five extra cards.
- Quit bypasses ECED.
- ECED ends immediately when the level is won.
- ECED ends when its rescue supply is exhausted.
- No hidden infinite-card path exists.

### Experience

- ECED does not always select the strongest card.
- Rescue sequences have multiple emotional patterns.
- Rescue does not feel mechanically identical every time.
- Rescue normally provides meaningful hope/progress.
- Rescue does not guarantee a win.
- Rescue does not routinely feel pointless.
- Final rescue cards can create clutch moments.
- Player-visible decisions remain understandable.

### Monetization

- +3 and +5 have meaningfully different experience profiles.
- Both options remain viable.
- Coin rescue has enough perceived value to justify spending.
- Rewarded-ad rescue has enough value to justify watching.
- Rescue does not create obvious pay-to-win manipulation.
- Rescue conversion, win rate, and post-rescue continuation are measurable.

### Engineering

- deterministic replay available
- debug explanation available
- configurable scoring weights
- configurable experience modes
- automated simulation tests
- no mutation of core level state after handoff except legitimate gameplay progression
- rescue card supply cannot exceed configured amount

---

# 34. Recommended Final Architecture

```text
                    ADAPTIVE EXPERIENCE SYSTEM
                              │
             ┌────────────────┴────────────────┐
             │                                 │
             ▼                                 ▼
     CORE EXPERIENCE                    RESCUE EXPERIENCE
        DIRECTOR                            DIRECTOR
             │                                 │
      Core AED owns                    Extra Card AED owns
             │                                 │
   ┌─────────┼─────────┐                 Live only
   │         │         │                      │
Verified  Replan   Reshape/Live              │
   │         │         │                      │
   └─────────┴─────────┘                      │
             │                                │
             ▼                                ▼
       CORE TERMINAL                     +3 / +5
       WIN or LOSS                       RESCUE
                                             │
                                             ▼
                                       ECED POLICY
                                             │
                                  ┌──────────┴──────────┐
                                  │                     │
                           Experience Mode       Candidate Scoring
                                  │                     │
                                  └──────────┬──────────┘
                                             ▼
                                      LIVE CARD PICK
                                             │
                                             ▼
                                        PLAYER ACTION
                                             │
                                             ▼
                                      RE-EVALUATE
                                             │
                                  ┌──────────┴──────────┐
                                  ▼                     ▼
                               WIN                 CARDS LEFT
                                  │                     │
                                END                  CONTINUE
```

---

# 35. Final Product Principle

The core AED creates the **level experience**.

ECED creates the **comeback experience**.

They must not be treated as the same system.

The core director answers:

> "How do we make this level feel like the intended difficulty/outcome?"

The Extra Card Experience Director answers:

> "Now that the player has lost, how do we make these few remaining chances feel exciting enough that the player wants to continue, while preserving fairness and monetization value?"

The desired rescue experience is:

**Thriller + Adventure + Tension + Hope + Uncertainty + Clutch Payoff**

—not:

**Best card → best card → best card → instant win.**

The director should deliberately create a range of credible rescue experiences, while maintaining hard safety constraints and measurable monetization/retention outcomes.

---

# 36. Implementation Instruction for Claude

Implement the above as an independent module in the existing TriPeaks demo.

Do NOT rewrite or modify the existing Core AED behavior except for the explicit terminal handoff.

Required integration:

```text
Existing Core AED
      ↓
Detect verified core win OR verified core loss
      ↓
Stop core director
      ↓
Show rescue choice
      ↓
If +3 or +5 selected:
      ↓
Create ExtraCardExperienceDirector
      ↓
Initialize with current board state
      ↓
Run live rescue-card selection
      ↓
Generate exactly the selected number of cards
      ↓
Adapt each unseen rescue card based on current state
      ↓
Lock every revealed rescue card
      ↓
End on board clear or rescue exhaustion
```

Do not create separate +3 and +5 algorithms.

Use one:

```text
ExtraCardExperienceDirector
```

with different:

```text
RescueContext.extraCards = 3
RescueContext.extraCards = 5
RescueContext.rescueType = Ad / Coin
```

Add a visible debug panel showing:
- rescue type
- cards remaining
- selected experience mode
- candidate card scores
- selected card
- current board state
- current rescue quality score
- reason for selection
- rescue outcome

Add deterministic seeds so every rescue can be reproduced.

Add simulation/test controls to run the same rescue many times and report:
- win rate
- average cards used
- average cards removed
- experience mode distribution
- dead-card frequency
- near-win frequency
- rescue conversion proxy
- immediate quit proxy
- repeated-pattern frequency

The implementation should prioritize **behavioral correctness first**, then tuning of experience and monetization weights.
