# Director test — 25 levels, all outcomes, 5 plays each

Streak reward **+1 extra card**, ruthlessness **0.50**. 25 levels × 5 outcomes × 5 passes = **625 runs**, 486 rescues.

## 1. Can the director build these levels?

| Outcome | runs | built | verified | live |
|---|---|---|---|---|
| Comfortable Win | 125 | 92% | 58% | 34% |
| Close Win | 125 | 92% | 57% | 35% |
| Last Card Win | 125 | 100% | 64% | 36% |
| Close Lose | 125 | 100% | 38% | 62% |
| Comfortable Lose | 125 | 100% | 26% | 74% |

**Overall: 97% built, 48% verified, 48% live.**

Levels mostly on live steering: **L10, L12, L13, L16, L17, L18, L19, L20, L22, L24**

## 2. Does it land on the targeted outcome?

| | runs | outcome type held | landed on exact target |
|---|---|---|---|
| **All** | 605 | **95.5%** | 65% |
| verified | 302 | 100.0% | 100% |
| live | 303 | 91.1% | 30% |

| Outcome | runs | held | exact |
|---|---|---|---|
| Comfortable Win | 115 | 100.0% | 86% |
| Close Win | 115 | 100.0% | 85% |
| Last Card Win | 125 | 100.0% | 77% |
| Close Lose | 125 | 90.4% | 49% |
| Comfortable Lose | 125 | 88.0% | 32% |

**Outcome-type failures: 27 of 605**

| failure | count |
|---|---|
| Comfortable Lose → WON (live) | 15 |
| Close Lose → WON (live) | 12 |

## 3. Streak rewards and deck absorption

| | |
|---|---|
| Runs that completed at least one streak | 97% (585) |
| Total streaks completed | 1340 |
| Extra cards granted | 1404 |
| Supply changes absorbed | 1298 |

**How the director absorbed them:**

| rung | count | share |
|---|---|---|
| live | 884 | 68% |
| keep | 212 | 16% |
| adjust | 177 | 14% |
| replan | 25 | 2% |

Fell through to live steering on **68%** of supply changes.

| | runs | outcome held |
|---|---|---|
| no streak fired | 20 | 100.0% |
| streak fired | 585 | 95.4% |

## 4. Extra Card Experience Director

| | result | target |
|---|---|---|
| Rescues bought | 486 | |
| Cleared nothing at all | **23%** | 10–20% |
| Dead cards | 55% | |
| Cards cleared per rescue | **1.6** | |
| Rescues that cleared the board | 46% | |
| Worst blanks inside one rescue | 5 | 2 |

**By board size when the rescue was bought:**

| board | rescues | empty | dead cards | cleared/rescue | cleared board | worst blanks |
|---|---|---|---|---|---|---|
| 1 card | 220 | **36%** | 69% | 0.6 | 64% | 5 |
| 2–3 | 147 | **17%** | 59% | 1.6 | 39% | 5 |
| 4–6 | 106 | **6%** | 33% | 3.2 | 23% | 5 |
| 7+ | 13 | **0%** | 29% | 3.8 | 0% | 2 |

**Intent gate:**

| intent | rescues | cleared the board |
|---|---|---|
| almost | 237 | 0.0% |
| progress | 26 | 0.0% |
| win | 223 | 100.0% |

Rescues **deliberately** empty (budgeted): 5%. Empty but not budgeted: 22% — these are the 1-card boards where "did not win" and "empty" are the same event.

## 5. Safety invariants

| invariant | result |
|---|---|
| A rescue told to fall short never wins | **0 breaches** |
| Rank supply never oversubscribed | **0 violations** |
| Live pool never negative | **0** |
| No exceptions during play | **0 thrown** |

## 6. Per level

| level | cards | deck | built | verified | outcome held | rescues | empty |
|---|---|---|---|---|---|---|---|
| L1 | 15 | 1 | 60% | 60% | 100.0% | 28 | 14% |
| L2 | 12 | 6 | 100% | 100% | 100.0% | 20 | 20% |
| L3 | 18 | 12 | 100% | 84% | 100.0% | 20 | 10% |
| L4 | 18 | 8 | 100% | 96% | 100.0% | 22 | 14% |
| L5 | 17 | 7 | 100% | 100% | 100.0% | 24 | 13% |
| L6 | 21 | 10 | 100% | 92% | 100.0% | 26 | 23% |
| L7 | 11 | 10 | 100% | 80% | 100.0% | 27 | 30% |
| L8 | 19 | 10 | 100% | 88% | 100.0% | 23 | 13% |
| L9 | 20 | 16 | 100% | 60% | 100.0% | 26 | 15% |
| L10 | 24 | 16 | 100% | 48% | 100.0% | 23 | 26% |
| L11 | 15 | 1 | 60% | 60% | 100.0% | 27 | 15% |
| L12 | 21 | 10 | 100% | 20% | 96.0% | 17 | 24% |
| L13 | 20 | 20 | 100% | 4% | 88.0% | 13 | 38% |
| L14 | 17 | 7 | 100% | 76% | 100.0% | 21 | 29% |
| L15 | 15 | 15 | 100% | 56% | 100.0% | 16 | 13% |
| L16 | 24 | 8 | 100% | 0% | 96.0% | 22 | 32% |
| L17 | 32 | 17 | 100% | 0% | 60.0% | 0 | — |
| L18 | 25 | 17 | 100% | 4% | 92.0% | 11 | 27% |
| L19 | 24 | 18 | 100% | 4% | 84.0% | 11 | 36% |
| L20 | 25 | 16 | 100% | 0% | 96.0% | 20 | 35% |
| L21 | 16 | 12 | 100% | 60% | 92.0% | 13 | 15% |
| L22 | 24 | 17 | 100% | 0% | 96.0% | 17 | 41% |
| L23 | 15 | 10 | 100% | 60% | 96.0% | 20 | 25% |
| L24 | 26 | 14 | 100% | 0% | 96.0% | 15 | 27% |
| L25 | 19 | 13 | 100% | 56% | 100.0% | 24 | 29% |

