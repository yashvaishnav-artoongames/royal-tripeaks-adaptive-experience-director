# FINAL — Streak Reward & Experience Director Integration Specification

**Status:** Final handoff specification for Claude / Unity implementation  
**Scope:** 5-card Streak Rewards, Extra Card injection, Wild Card injection, and adaptive response across Verified Director, Live Director, and ECED.

> **Core rule:** A gameplay-affecting streak reward changes the authoritative future game state. Therefore, every Extra Card or Wild Card injection must be surfaced to the active Experience Director, which decides whether to **KEEP, ADJUST, or REPLAN** the remaining unseen experience.

---

# Streak Reward + Dynamic Extra-Card Integration Specification

## Purpose

Update the existing 5-card streak so that it can reward Coins or Extra Cards, support a same-color 2x reward, and safely inject earned Extra Cards into the active deck without breaking the Core Verified Director, Core Live Director, or Extra Card Experience Director (ECED).

## 1. Current Rule

The streak remains **5 eligible tableau cards**.

```text
1/5 → 2/5 → 3/5 → 4/5 → 5/5
                         ↓
                  STREAK COMPLETE
```

After completion, the streak resets and a new streak begins.

Do not change the existing streak-start/end rules as part of this feature.

---

## 2. Streak Reward Types

The higher-level concept is **Streak Reward**. A streak reward may grant economy currency or add a special gameplay card to the active deck.

Rewards must be data-driven:

```csharp
enum StreakRewardType
{
    Coins,
    ExtraCards,
    WildCard
}
```

Examples:

```text
Coins ×100
ExtraCards ×1
ExtraCards ×2
WildCard ×1
```

The most common configured reward may be Extra Cards, but the system must support all three reward types.

Important architectural distinction:

```text
STREAK REWARD
├── Coins
├── Extra Cards
└── Wild Card
```

Do not call every gameplay reward an "Extra Card". A Wild Card is a special gameplay reward with different insertion and director behavior.

---

## 3. Same-Color 2x Bonus

When all five streak cards are the same **color**, the configured streak reward receives the same-color multiplier.

For normal scalable rewards such as Coins and Extra Cards:

```text
Base Reward × 2
```

For a single Wild Card reward, keep the reward as **one Wild Card** for the initial implementation. Do not automatically convert:

```text
1 Wild × 2 = 2 Wilds
```

The Wild reward is intentionally a rarer, special reward and should not unintentionally create excessive Wild supply. If future tuning requires two Wilds, make that an explicit configuration rather than inheriting the generic x2 rule.


```text
RED  = Hearts + Diamonds
BLACK = Spades + Clubs
```

Examples:

```text
♥ ♦ ♥ ♦ ♥  → RED → x2
♠ ♣ ♠ ♣ ♠  → BLACK → x2

♥ ♠ ♥ ♠ ♥  → mixed → x1
♦ ♣ ♦ ♣ ♦  → mixed → x1
```

The bonus is **same color**, not same suit.

This is consistent with existing TriPeaks genre patterns where same-color streaks can multiply rewards. citeturn0search1turn0search2turn0search13

### Color state

Track the color across the whole streak:

```csharp
StreakState
{
    int cardsCollected;
    CardColor streakColor;
    bool sameColor;
}
```

First card establishes the color. A RED/BLACK mismatch permanently disables the x2 bonus for that streak.

---

## 4. Wild Rule

Preserve the existing Wild behavior: Wild can maintain the streak but is color-neutral.

Therefore:

```text
♥ → ♦ → Wild → ♥ → ♦
```

can still receive the RED same-color bonus.

But:

```text
♥ → ♠ → Wild → ♥ → ♦
```

cannot.

Wild must never establish RED or BLACK.

---

## 5. Reward Calculation

Centralize reward calculation:

```text
Base Reward
    ↓
Same-Color Check
    ↓
Multiplier (1x / 2x)
    ↓
Final Reward
```

Examples:

```text
1 Extra Card + mixed colors
→ +1

1 Extra Card + same color
→ +2

2 Extra Cards + mixed colors
→ +2

2 Extra Cards + same color
→ +4

100 Coins + same color
→ +200
```

The multiplier should apply to the configured streak reward unless a future reward type explicitly opts out.

---

# 6. Extra Cards Are Real Gameplay Supply

If the streak reward is Extra Cards, it must modify the **actual active card supply**.

Do not merely increment a cosmetic counter.

Use a central operation such as:

```csharp
ActiveDeck.AddExtraCards(amount, ExtraCardSource.StreakReward);
```

Recommended source enum:

```csharp
enum ExtraCardSource
{
    StreakReward,
    CoinRescue,
    AdRescue,
    Booster,
    Other
}
```

The deck/supply must be updated before the next gameplay action.

---

# 7. Atomic Reward Flow

The complete operation must be:

```text
5th streak card
    ↓
Complete streak
    ↓
Evaluate same-color
    ↓
Calculate x2
    ↓
Grant reward
    ↓
If ExtraCards:
    Add normal cards to active supply
    ↓
If WildCard:
    Insert one Wild at a random valid position in remaining unseen deck
    ↓
Notify active Experience Director
    ↓
Director updates its model
    ↓
Continue gameplay
```

Do not allow the UI reward and actual deck supply to become inconsistent.

---

# 8. New Event

Introduce:

```csharp
OnExtraCardsAdded
```

Payload:

```csharp
GameplaySupplyChangedEvent
{
    RewardType rewardType;
    int amount;
    ExtraCardSource source;
    int deckCountBefore;
    int deckCountAfter;
    int insertionIndex;
    CardType specialCardType;
    int levelId;
}
```

For normal Extra Cards:

```text
rewardType = ExtraCards
specialCardType = None
insertionIndex = N/A
```

For Wild:

```text
rewardType = WildCard
amount = 1
specialCardType = Wild
insertionIndex = random valid position
```

The active experience director receives this event.

A dedicated event name such as `OnGameplaySupplyChanged` is preferred over an event named only `OnExtraCardsAdded`, because the supply can now change through both Extra Cards and Wild Cards.

The Streak system must not directly manipulate ECED internals.

---

# 9. Core Architecture Boundary

Use:

```text
Streak System
      ↓
Reward Service
      ↓
Active Deck / Card Supply
      ↓
OnExtraCardsAdded
      ↓
Experience Director Coordinator
      ├── Verified Director
      ├── Live Director
      └── ECED
```

The responsibilities are:

**Streak System:** decides reward.

**Reward Service:** grants reward.

**Deck/Supply:** owns real card availability.

**Experience Director:** adapts future unseen cards.

---

# 10. Verified Director Integration

If Extra Cards are earned while the Verified Director is active:

```text
Verified plan
    ↓
+1 / +2 supply
    ↓
validate remaining plan
```

If the existing verified plan is still valid:

```text
Keep it.
```

If it becomes invalid:

```text
Re-verify / re-plan remaining unseen state.
```

If no valid plan can preserve the intended experience:

```text
Safely transition to Live Director.
```

### Critical rule

Do NOT regenerate the entire level.

Already visible/revealed cards remain immutable.

Only future unseen state may adapt.

The existing AED architecture already relies on committed revealed cards and adaptive unseen cards; the new supply must follow that same principle.

---

# 11. Live Director Integration

When Live Director receives `OnExtraCardsAdded`:

```text
Increase remaining supply
    ↓
Invalidate cached future candidate decisions
    ↓
Recalculate future steering
    ↓
Continue
```

Do not change:

- already played cards
- already revealed cards
- committed hidden values

Only future unseen cards may adapt.

---

# 12. Wild Card Reward Integration

A Wild Card can be configured as a streak reward.

The Wild reward is fundamentally different from a normal Extra Card:

```text
Extra Card
→ adds normal card supply

Wild Card
→ adds one special Wild card
→ Wild is inserted at a random valid position
```

## Random insertion rule

"Random position" means a random position inside the **remaining unseen deck**, not an arbitrary position that could modify already revealed or played cards.

Example:

```text
Remaining unseen deck:

[A][B][C][D][E][F][G]

Wild insertion:

[A][B][C][WILD][D][E][F][G]
```

The exact insertion position must be selected using the game's deterministic/randomized RNG system so the result can be reproduced in debugging and simulations.

The insertion must:

- never move or replace an already revealed card
- never modify a played card
- never invalidate the current deck structure
- preserve the Wild as a committed special card once inserted
- record the insertion index/provenance
- notify the active director immediately

## Director behavior

The active director must treat the Wild as an actual future card:

```text
Wild inserted
    ↓
Supply/deck state updated
    ↓
Wild position committed
    ↓
Director updates future-state model
```

The director must **not replace the Wild with a normal card value**.

It should adapt surrounding/future unseen behavior while preserving the Wild itself.

## Same-color interaction

For the initial implementation:

```text
1 Wild reward + same-color streak
→ 1 Wild
```

Do not create two Wilds unless a separate configuration explicitly requests it.

## Wild provenance

Record:

```text
source = StreakReward
rewardType = WildCard
cardType = Wild
insertionIndex = X
```

This allows debugging, analytics, replay validation, and differentiation from Wilds created by normal level generation.

---

# 12. ECED Integration

If the streak completes during an Extra Card rescue:

```text
ECED active
    ↓
Streak completes
    ↓
+1 / +2 earned
    ↓
ECED rescue supply increases
    ↓
Invalidate stale candidate calculations
    ↓
Re-evaluate future rescue cards
    ↓
Continue current ECED experience
```

Do NOT restart ECED.

Do NOT reset:

- current experience mode
- tension phase
- rescue history
- cards already revealed
- current rescue progress

The earned card is an **earned extension of the current rescue**, not a new rescue.

---

# 13. Extra Card Value Selection

The newly added card must have a real rank/value.

The current active director should determine the value using its existing adaptive candidate system.

It should:

- respect the current deck model
- preserve committed cards
- avoid impossible state
- preserve the intended level outcome where possible
- maintain current pacing
- create meaningful opportunity without automatically guaranteeing a win

Do not create a second card-selection algorithm just for streak rewards.

---

# 14. Prevent Infinite Reward Loops

A streak-earned Extra Card can theoretically enable another streak, which could earn another Extra Card.

Example:

```text
5-card streak
→ +1
→ another 5-card streak
→ +1
→ another streak
→ +1
→ ...
```

Add configurable limits:

```csharp
MaxStreakExtraCardsPerLevel
```

and optionally:

```csharp
MaxStreakExtraCardRewardsPerLevel
```

The final tuning value should remain data-driven.

If the cap is reached, use a configured fallback reward rather than silently giving nothing.

---

# 15. Level-Win Priority

If the 5th streak card also clears the final tableau:

```text
5th card
    ↓
LEVEL WIN
```

takes priority.

Do not append cards to an already completed level.

If product wants the player to receive the streak reward on level completion, grant it as an end-level reward rather than injecting cards into an inactive deck.

---

# 16. Rescue/Director Compatibility

The same event mechanism must work regardless of which director owns the level:

```text
Verified + Extra Card
→ validate/replan

Live + Extra Card
→ update supply and steer

ECED + Extra Card
→ extend current rescue and continue
```

This prevents streak logic from becoming coupled to a specific director.

---

# 17. UI

Normal:

```text
🔥 STREAK COMPLETE
+1 EXTRA CARD
```

Same color:

```text
🔥 SAME COLOR STREAK!
2x REWARD
+2 EXTRA CARDS
```

For Coins:

```text
🔥 STREAK COMPLETE
+100 COINS
```

Same color:

```text
🔥 SAME COLOR!
2x REWARD
+200 COINS
```

Recommended animation:

```text
5th card
  ↓
Streak completion
  ↓
Same-color confirmation
  ↓
x2 celebration if applicable
  ↓
Reward amount
  ↓
Extra cards fly into deck
  ↓
Deck count updates
```

The player should clearly understand why the reward doubled.

---

# 18. Recommended Player-Facing Preview

If feasible, show the possible streak bonus while the streak is building:

```text
STREAK 4/5
SAME COLOR ×2
```

This creates a small strategic objective: maintain the same color while continuing the streak.

Do not expose internal probability or director information.

---

# 19. Telemetry

Every streak completion should record:

```json
{
  "levelId": 104,
  "streakLength": 5,
  "cards": ["H7", "D8", "H9", "D10", "HJ"],
  "color": "RED",
  "sameColor": true,
  "rewardType": "ExtraCards",
  "baseReward": 1,
  "multiplier": 2,
  "finalReward": 2,
  "deckBefore": 3,
  "deckAfter": 5,
  "directorMode": "Live",
  "source": "StreakReward"
}
```

Also track:

- streak completion rate
- same-color completion rate
- x2 rate
- Extra Card reward rate
- earned Extra Cards consumed
- earned Extra Card → level win rate
- number of streak-earned cards per level
- repeated streak-reward chains

---

# 20. Persistence / Transaction Safety

The reward must be safely persisted before the player can perform another deck action.

Persist:

```text
streak completion
reward type
base amount
multiplier
final amount
extra cards added
deck count
reward source
```

If the app closes immediately after the reward, the reward must not be duplicated on restore.

Also keep monetization entitlement state separate from gameplay undo state.

Undo must never refund or duplicate an already-granted reward.

---

# 21. Required Test Cases

### A — Normal 1 Extra Card

```text
mixed colors
→ +1
→ deck +1
```

### B — Same-color 1 Extra Card

```text
all RED
→ x2
→ +2
→ deck +2
```

### C — Normal 2 Extra Cards

```text
mixed
→ +2
→ deck +2
```

### D — Same-color 2 Extra Cards

```text
same color
→ x2
→ +4
→ deck +4
```

### E — Normal 1 Wild

```text
mixed colors
→ +1 Wild
→ exactly one Wild inserted
→ random valid unseen position
```

### F — Same-color 1 Wild

```text
same color
→ configured Wild reward
→ exactly one Wild
→ no automatic second Wild
```

### J — Wild Insertion Safety

```text
Wild inserted
→ revealed cards unchanged
→ played cards unchanged
→ insertion index recorded
→ director notified
```

### H — Normal Coins

```text
mixed
→ configured coin amount
```

### I — Same-color Coins

```text
same color
→ 2x configured coin amount
```

### J — Wild

```text
Wild maintains streak
Wild does not establish color
Wild does not destroy same-color status
```

### K — Mixed Color

```text
♥ ♦ ♥ ♠ ♦
→ no x2
```

### L — Same Color, Different Suit

```text
♥ ♦ ♥ ♦ ♥
→ x2
```

### M — ECED

```text
ECED active
→ streak reward +1
→ rescue supply +1
→ same ECED mode continues
```

### N — Verified

```text
Verified active
→ +1
→ verify remaining plan
→ preserve visible state
```

### O — Live

```text
Live active
→ +1
→ update supply
→ invalidate future cached decisions
```

### P — Level Win

```text
5th streak card clears final tableau
→ level wins
→ no deck injection
```

### Q — Reward Chain Limit

```text
streak → extra card → streak → extra card...
```

must stop at configured limits.

### R — App Restart

Reward immediately before app close must restore exactly once.

---

# 22. Important Design Principle

The player should feel:

> **"I earned another chance by playing well."**

not:

> **"The game regenerated the level because I got a reward."**

Therefore:

```text
STREAK
  ↓
REWARD
  ↓
SUPPLY CHANGE
  ↓
DIRECTOR ADAPTS
```

The director should absorb the new card supply without visibly breaking the level experience already in progress.

---

# 23. Implementation Instructions for Claude

Implement this specification in the existing demo.

### Do NOT

- rewrite Core AED
- rewrite ECED
- change the 5-card streak length
- change normal streak start/end behavior
- make same-color mean same-suit
- treat Wild as a color
- directly manipulate ECED from Streak UI
- regenerate revealed cards
- create a separate director for streak rewards
- allow infinite streak-extra-card loops

### DO

1. Add whole-streak color tracking.
2. Add configurable reward types: Coins, ExtraCards, WildCard.
3. Add configurable reward amounts.
4. Add the same-color x2 multiplier for scalable rewards.
5. Keep a single Wild reward as one Wild even when the streak qualifies for x2.
6. Create a real gameplay-supply reward transaction.
7. Add normal Extra Cards to actual active supply.
8. Insert a streak-earned Wild at a random valid position in the remaining unseen deck.
9. Emit `OnGameplaySupplyChanged`.
10. Update Verified Director on supply change.
11. Update Live Director on supply change.
12. Update ECED on supply change.
13. Preserve all committed/revealed cards.
14. Preserve the inserted Wild as a special card.
15. Recalculate only future unseen behavior.
16. Add configurable per-level reward limits.
17. Add deterministic tests for all cases above.
18. Add debug information showing:
    - streak cards
    - streak color
    - same-color status
    - base reward
    - multiplier
    - final reward
    - deck before
    - deck after
    - active director
    - generated extra-card value
16. Run regression simulations across the existing level set.

---

# 24. Final Architecture

```text
                 STREAK CONTROLLER
                        │
                        ▼
              STREAK REWARD EVALUATOR
                        │
                ┌───────┴───────┐
                │               │
             Normal          Same Color
              x1                x2
                │               │
                └───────┬───────┘
                        ▼
                REWARD SERVICE
                        │
                ┌───────┴────────┐
                │                │
              Coins          Extra Cards
                                 │
                                 ▼
                         ACTIVE CARD SUPPLY
                                 │
                         OnExtraCardsAdded
                                 │
                                 ▼
                   EXPERIENCE DIRECTOR
                                 │
              ┌──────────────────┼─────────────────┐
              ▼                  ▼                 ▼
           Verified            Live              ECED
              │                  │                 │
            Validate           Adapt            Extend
              │                  │                 │
              └──────────────────┴─────────────────┘
                                 │
                                 ▼
                         CONTINUE EXPERIENCE
```

The core requirement is that **Streak owns the reward decision, Deck owns the supply, and the active director owns future card behavior**.

That keeps the feature modular and makes the same mechanism safe to port into Unity.


# Critical Director Rule: Every Gameplay-Card Reward Can Change the Plan

This is a critical correction to the previous design.

A rewarded gameplay card is not simply an increase in deck count.

Both:

```text
Extra Card
Wild Card
```

can change the future level state and therefore can change the active Experience Director's plan.

The director must treat **any injected gameplay card as a state mutation that may invalidate its current future plan**.

---

## 26. Extra Card and Wild Card Are Both Plan-Changing Events

The previous implementation must NOT assume:

```text
Extra Card → supply +1 → continue old plan
Wild Card → supply +1 → continue old plan
```

Instead:

```text
Gameplay Card Injected
        ↓
Current level state changes
        ↓
Current director plan may become invalid
        ↓
Director evaluates plan validity
        ↓
KEEP / ADJUST / REPLAN
        ↓
Continue experience
```

This applies equally to:

```text
Normal Extra Card
Wild Card
```

The difference is the **type and constraints of the injected card**, not whether the director needs to react.

---

## 27. Why Extra Card Can Change the Plan

Suppose the director currently has:

```text
Remaining tableau:
A → B → C

Remaining deck:
D → E
```

The director may have verified a specific future sequence.

Now the player earns:

```text
+1 Extra Card
```

and the new card is inserted into the deck:

```text
D → NEW CARD → E
```

The previous plan was calculated against a different future state.

The new card can:

- create a new playable route
- remove the need for a previous planned rescue
- change the number of available draws
- change the close-win/win probability
- create or remove a streak opportunity
- change the optimal card sequence
- alter tension/pacing
- make the previous plan unnecessarily generous
- make the previous plan invalid

Therefore the director must reassess.

---

## 28. Why Wild Can Change the Plan Even More

A Wild is not merely:

```text
+1 supply
```

It is:

```text
+1 supply
+
special card behavior
```

A Wild may create a new route that was not available when the director generated its previous plan.

For example:

```text
Current foundation = 7

Remaining:
6 → 9 → 4
```

Without Wild, the planned route may be:

```text
7 → 6 → 5 → ...
```

Now a Wild is inserted.

The Wild can potentially bridge a state that previously required a specific sequence.

Therefore:

```text
Wild injection
        ↓
Future state changes
        ↓
Previous plan may no longer be optimal/valid
```

The director must evaluate the Wild as part of the future gameplay state.

---

# 29. The Correct Director Response

Every gameplay-card injection should follow:

```text
ON GAMEPLAY SUPPLY CHANGE
            ↓
Update authoritative deck state
            ↓
Update special-card state
            ↓
Invalidate stale future-plan assumptions
            ↓
Validate current plan
            ↓
       ┌────┴────┐
       │         │
     VALID     INVALID
       │         │
       │       REPLAN
       │         │
       └────┬────┘
            ↓
      Continue Experience
```

Do not automatically replan every time.

Do not automatically keep the old plan every time.

The director should decide.

---

# 30. Three Possible Outcomes

The director should support three outcomes after a gameplay-card reward.

### A. KEEP

The existing plan remains valid and still provides the intended experience.

```text
Injected card
    ↓
Plan remains valid
    ↓
KEEP
```

Use this when the new card does not materially affect the planned future.

---

### B. ADJUST

The plan remains fundamentally valid, but one or more future decisions should be updated.

```text
Injected card
    ↓
Core plan still valid
    ↓
Adjust future card values / pacing
    ↓
Continue
```

This is preferable to rebuilding the entire plan when only a small correction is necessary.

---

### C. REPLAN

The injected card materially changes the future state.

```text
Injected card
    ↓
Existing plan no longer represents the intended experience
    ↓
REPLAN unseen future state
```

Already committed/revealed state remains immutable.

---

# 31. Verified Director

Verified Director must treat both Extra Card and Wild Card injection as a **plan validity checkpoint**.

```text
Verified Plan
     ↓
Gameplay Card Injected
     ↓
Update deck state
     ↓
Validate verified plan
```

If valid:

```text
KEEP
```

If partially affected:

```text
ADJUST
```

If invalid:

```text
REPLAN remaining unseen state
```

If no valid verified plan can be generated under the current constraints:

```text
Fallback → Live Director
```

The fallback must preserve:

- revealed cards
- played cards
- inserted Wild
- actual remaining deck
- current tableau
- target outcome constraints
- current gameplay state

---

# 32. Live Director

Live Director should not have a fixed "old plan" that it blindly follows after an injection.

Instead, gameplay-card injection should invalidate stale future candidate calculations.

```text
Extra Card / Wild
       ↓
Supply changed
       ↓
Invalidate affected future evaluations
       ↓
Re-score candidates
       ↓
Continue adaptive steering
```

This allows the Live Director to use the newly available card as part of the ongoing experience.

---

# 33. ECED

This rule is especially important for ECED.

If a player earns:

```text
+1 Extra Card
```

or:

```text
+1 Wild
```

during an active rescue, the rescue plan can change.

Therefore ECED must:

```text
receive injection event
        ↓
update actual rescue supply
        ↓
update Wild/special-card state if applicable
        ↓
invalidate stale rescue calculations
        ↓
evaluate current rescue plan
        ↓
KEEP / ADJUST / REPLAN
        ↓
continue current ECED experience
```

ECED must NOT simply say:

```text
rescueCardsRemaining += 1
```

and continue blindly.

That count is necessary but not sufficient.

---

# 34. Wild Insertion Position Is Part of the State

For a Wild reward:

```text
Wild
+
random insertion position
```

the insertion position itself affects the future plan.

Example:

```text
Before:

[A][B][C][D][E][F]

Wild inserted at position 2:

[A][B][WILD][C][D][E][F]
```

This is materially different from:

```text
[A][B][C][D][WILD][E][F]
```

Therefore the director must receive the actual insertion result.

The event should contain:

```csharp
GameplaySupplyChangedEvent
{
    RewardType rewardType;
    int amount;
    ExtraCardSource source;

    int deckCountBefore;
    int deckCountAfter;

    int insertionIndex;

    CardType specialCardType;

    int levelId;
}
```

For normal Extra Cards:

```text
specialCardType = None
```

For Wild:

```text
specialCardType = Wild
insertionIndex = actual chosen position
```

---

# 35. Do Not Hide Injection From the Director

A dangerous implementation would be:

```text
Streak System
    ↓
quietly modify deck
    ↓
director continues
```

This creates stale internal director state.

Instead:

```text
Streak System
    ↓
Reward Service
    ↓
Authoritative Deck Mutation
    ↓
GameplaySupplyChangedEvent
    ↓
Active Director
```

The director must always know that the authoritative gameplay state changed.

---

# 36. Plan Validity Should Be Based on Gameplay State, Not Card Count Alone

Do not implement:

```csharp
if (deckCountChanged)
    replan;
```

That is too simplistic.

The director should evaluate:

```text
Does the injected card materially change the reachable future state?
```

Relevant factors include:

- remaining deck count
- inserted card position
- card rank/value
- Wild presence
- reachable tableau cards
- draw availability
- current streak potential
- target outcome
- current tension phase
- current rescue phase
- remaining planned sequence
- economy/rescue context where applicable

This is what makes the system adaptive rather than merely reactive.

---

# 37. Do Not Over-Replan

Replanning after every injection can create unstable behavior.

For example:

```text
+1 Extra Card
→ full replan
→ +1 Wild
→ full replan
→ another reward
→ full replan
```

This can make the level feel artificial and can also create unnecessary computational complexity.

Use:

```text
KEEP → ADJUST → REPLAN
```

rather than:

```text
EVERY CHANGE → FULL REPLAN
```

---

# 38. Preserve Experience Continuity

Even when the plan changes, the player should not see:

```text
"the level changed"
```

The visible experience should remain continuous.

The director can silently adapt:

```text
Old future plan
     ↓
new gameplay supply
     ↓
new future plan
```

while preserving the player's current reality.

This is one of the core requirements of the Adaptive Experience Director architecture.

---

# 39. Recommended Debug Output

When either Extra Card or Wild is injected, expose:

```text
════════════════════════════════════════
GAMEPLAY SUPPLY CHANGE
════════════════════════════════════════

SOURCE       : STREAK_REWARD
REWARD       : EXTRA_CARD / WILD
AMOUNT       : 1
DECK BEFORE  : 3
DECK AFTER   : 4
INSERT INDEX : 2
SPECIAL      : WILD / NONE

DIRECTOR     : VERIFIED / LIVE / ECED

PLAN STATUS  : KEEP / ADJUST / REPLAN

REASON:
    New Wild creates alternate route
    OR
    Extra card does not affect current verified path
    OR
    Existing rescue plan is invalidated

VISIBLE STATE:
    PRESERVED ✓

UNSEEN STATE:
    ADAPTED ✓
════════════════════════════════════════
```

This will be extremely useful when testing the demo and later debugging Unity.

---

# 40. Updated Core Principle

The system should now be understood as:

```text
A STREAK REWARD DOES NOT JUST GIVE A REWARD.

A GAMEPLAY-CARD REWARD CHANGES THE LEVEL STATE.
```

Therefore:

```text
Coins
→ Economy state change

Extra Card
→ Gameplay supply state change
→ Director may need to adapt

Wild Card
→ Gameplay supply + special-card state change
→ Director may need to adapt
```

The director is responsible for absorbing these changes while preserving the player's already-committed experience.

---

# 41. Updated Claude Implementation Requirement

Claude must implement **one generic gameplay-state-change pathway** for both Extra Card and Wild.

Do NOT create:

```text
ExtraCardDirectorUpdate()
WildCardDirectorUpdate()
```

Instead use:

```csharp
OnGameplaySupplyChanged(GameplaySupplyChangedEvent change)
```

The active director then determines:

```text
KEEP
ADJUST
REPLAN
```

based on the actual state change.

This is important because future streak rewards may also introduce new gameplay-affecting objects. The architecture should not need another special director integration every time a new reward is introduced.




## Final Implementation Gate

Before considering the implementation live-ready, Claude must demonstrate all of the following:

- [ ] A 5-card streak can reward Coins, Extra Cards, or one Wild Card.
- [ ] Same-color RED/BLACK streak detection works across the entire streak.
- [ ] Same-color doubles scalable rewards such as Coins and Extra Cards.
- [ ] A configured single Wild reward remains one Wild unless explicitly configured otherwise.
- [ ] Extra Cards are inserted into the actual remaining deck/supply.
- [ ] A Wild is inserted at a random valid position in the remaining unseen deck.
- [ ] Revealed and played cards are never modified by reward insertion.
- [ ] Both Extra Card and Wild injection emit the same generic gameplay-state-change event.
- [ ] Verified validates the existing plan and adjusts/replans only when required.
- [ ] Live adapts future unseen state after the injection.
- [ ] ECED updates and adapts the current rescue state without blindly restarting it.
- [ ] The inserted Wild remains a committed special card and is never silently replaced by the director.
- [ ] The director receives the actual Wild insertion position.
- [ ] Stale cached future evaluations are invalidated when necessary.
- [ ] Reward transactions cannot duplicate after app restart.
- [ ] Streak-earned gameplay cards cannot create an uncontrolled infinite reward loop.
- [ ] Debug output clearly shows reward, deck mutation, director response, and reason.
- [ ] Regression tests cover normal, same-color, Wild, Verified, Live, ECED, level-win, and restart scenarios.

### Final behavioral guarantee

```text
STREAK REWARD
     ↓
GAMEPLAY STATE CHANGES
     ↓
ACTIVE DIRECTOR NOTIFIED
     ↓
PLAN VALIDITY EVALUATED
     ↓
KEEP / ADJUST / REPLAN
     ↓
CONTINUE THE SAME PLAYER EXPERIENCE
```

The player should experience the reward as an earned extension of the current level—not as a visible level regeneration or a disconnected reward system.
