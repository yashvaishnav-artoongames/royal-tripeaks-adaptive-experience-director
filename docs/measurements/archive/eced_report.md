# Extra Card Experience Director — bot report

Intensity **0.60**. 2 passes over all 10 levels against both losing outcomes, with four player personalities, buying up to 8 rescues per board.

**158 boards reached a dead state · 428 rescues bought · 1240 rescue cards dealt.**

## Headline

| | |
|---|---|
| Rescues that cleared the board | **37%** |
| Boards eventually cleared | **100%** (158 of 158) |
| Dead cards (matched nothing) | **53%** |
| Rescues that cleared nothing at all | **22%** |
| Tableau cards cleared per rescue | **1.7** |
| Cards dealt per rescue | 2.9 of 3.8 granted |
| Rescues bought per board | **2.71** |
| Worst run of consecutive empty rescues | **2** (cap is 2) |
| Worst run of blanks inside one rescue | **5** (rule caps at 2) |
| Average rescue quality | 29/100 |

## Levels

Ten built-in levels. No external levels supplied.

| Level | cards | deck | scrolling | source | boards run | reached a dead state |
|---|---|---|---|---|---|---|
| L1 | 15 | 1 | no | built-in | 16 | 16 |
| L2 | 12 | 6 | no | built-in | 16 | 16 |
| L3 | 18 | 12 | no | built-in | 16 | 16 |
| L4 | 18 | 8 | no | built-in | 16 | 16 |
| L5 | 17 | 7 | no | built-in | 16 | 16 |
| L6 | 21 | 10 | no | built-in | 16 | 15 |
| L7 | 11 | 10 | no | built-in | 16 | 16 |
| L8 | 19 | 10 | no | built-in | 16 | 16 |
| L9 | 20 | 16 | no | built-in | 16 | 16 |
| L10 | 24 | 16 | no | built-in | 16 | 15 |

_2 boards were cleared by the bot despite a losing target, so no rescue was offered._

## Safety invariants

| Invariant | Result |
|---|---|
| A rescue told to fall short never wins | **0 breaches** — holds |
| Rank supply never oversubscribed | **0 violations** |
| No exceptions during play | **0 thrown** |

## Is the advertised number honest?

The offer tells the player their odds. This compares what was shown against what happened.

| Rescue # | n | shown | actually cleared | gap |
|---|---|---|---|---|
| 1 | 158 | 11% | 12% | +1 |
| 2 | 139 | 33% | 34% | +0 |
| 3 | 92 | 68% | 61% | -7 |
| 4 | 36 | 87% | 92% | +5 |

Mean absolute gap: **3.3 points**.

| Intent chosen | rescues | actually cleared |
|---|---|---|
| almost | 253 | 0% |
| progress | 17 | 0% |
| win | 158 | 100% |

## How many rescues does a board take?

| Rescues bought | boards |
|---|---|
| 1 | 19 (12%) |
| 2 | 47 (30%) |
| 3 | 56 (35%) |
| 4 | 33 (21%) |
| 5 | 3 (2%) |

## By core outcome

| Core outcome | rescues | cleared | dead cards | empty rescues | cleared/rescue | avg quality |
|---|---|---|---|---|---|---|
| Close Lose | 202 | 39% | 56% | 25% | 1.4 | 28 |
| Comfortable Lose | 226 | 35% | 50% | 20% | 1.9 | 31 |

## By rescue type

| Bought | rescues | cleared | dead cards | empty rescues | cleared/rescue | avg quality |
|---|---|---|---|---|---|---|
| +3 ad | 253 | 31% | 38% | 16% | 1.9 | 31 |
| +5 coins | 175 | 46% | 68% | 31% | 1.4 | 27 |

_+3 and +5 carry the same odds by design; they differ in variance and pacing._

## By player personality

| Plays like | rescues | cleared | dead cards | empty rescues | cleared/rescue | avg quality |
|---|---|---|---|---|---|---|
| greedy | 99 | 40% | 48% | 20% | 1.8 | 31 |
| random | 110 | 36% | 54% | 23% | 1.6 | 29 |
| safe | 105 | 36% | 54% | 25% | 1.6 | 28 |
| sloppy | 114 | 35% | 54% | 22% | 1.8 | 29 |

_If the director only holds up for one of these, it is overfitted to that player._

## By board size when the rescue was bought

| Board | rescues | cleared | dead cards | empty rescues | cleared/rescue | avg quality |
|---|---|---|---|---|---|---|
| 1-3 cards left | 292 | 46% | 66% | 31% | 1.0 | 25 |
| 4-6 cards left | 119 | 19% | 29% | 4% | 3.1 | 41 |
| 7+ cards left | 17 | 0% | 18% | 0% | 3.2 | 28 |

## By level

| Level | rescues | cleared | dead cards | empty rescues | cleared/rescue | avg quality |
|---|---|---|---|---|---|---|
| L1 | 49 | 33% | 56% | 24% | 1.6 | 27 |
| L10 | 40 | 38% | 59% | 25% | 1.4 | 28 |
| L2 | 40 | 40% | 62% | 35% | 1.8 | 30 |
| L3 | 42 | 38% | 56% | 26% | 1.5 | 28 |
| L4 | 45 | 36% | 48% | 20% | 1.8 | 29 |
| L5 | 43 | 37% | 42% | 14% | 1.9 | 30 |
| L6 | 39 | 38% | 47% | 21% | 2.0 | 33 |
| L7 | 37 | 43% | 57% | 27% | 1.6 | 29 |
| L8 | 48 | 33% | 45% | 15% | 1.8 | 29 |
| L9 | 45 | 36% | 55% | 20% | 1.6 | 31 |

## Experience modes used

| Mode | rescues | cleared | dead cards | empty rescues | cleared/rescue | avg quality |
|---|---|---|---|---|---|---|
| Almost There | 61 | 34% | 42% | 15% | 2.2 | 32 |
| Balanced | 41 | 32% | 55% | 24% | 1.5 | 26 |
| Clutch Finish | 123 | 37% | 58% | 26% | 1.4 | 27 |
| Comeback Chain | 14 | 36% | 38% | 14% | 2.2 | 35 |
| Immediate Hope | 82 | 44% | 56% | 30% | 1.3 | 25 |
| Near-Miss | 55 | 29% | 43% | 15% | 2.3 | 35 |
| Tension Build | 52 | 40% | 59% | 19% | 1.8 | 32 |

## Where the rules could not be enforced

`maxDeadRun` caps blanks in a row at 2 and `minLive` guarantees one card
that does something. Neither can fire when every card that would clear also wins the
board, which is the case on a board of one or two cards. This is where that bites.

| | rescues | over the blank-run cap | fully empty |
|---|---|---|---|
| 1-2 cards left | 226 | 44% | 40% |
| 3-6 cards left | 185 | 11% | 3% |
| 7+ cards left | 17 | 0% | 0% |

**28% of all rescues exceeded the blank-run cap.**

### Blanks in a row, within one rescue

| run length | rescues |
|---|---|
| 0 | 195 (46%) |
| 1 | 72 (17%) |
| 2 | 41 (10%) |
| 3 (over cap) | 50 (12%) |
| 4 (over cap) | 15 (4%) |
| 5 (over cap) | 55 (13%) |

### Empty rescues in a row, across a board

A player paying repeatedly and getting nothing at all. `frustCap` is 2 at this intensity.

| streak | times |
|---|---|
| 1 | 64 |
| 2 | 16 |

## Rescue outcomes

| Outcome | count | share |
|---|---|---|
| Near win | 125 | 29% |
| Immediate win | 109 | 25% |
| No recovery | 96 | 22% |
| Rescue win | 49 | 11% |
| Partial comeback | 30 | 7% |
| Strong progress | 19 | 4% |

## Tuning used

```
intensity     0.6
base          0.23200000000000004
inc           0.118
cap           0.53
floor         0.126
holdAlmost    4
holdProgress  6
minAllow      1
frustCap      2
deadPull      18
band          28
floorFirst    0.4
paceSlack     0
maxDeadRun    2
minLive       1
```

Re-run: `node eced_bot.js 0.6 2 8`
