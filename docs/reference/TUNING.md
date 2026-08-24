# Tuning reference

Every value here is VERIFIED from `index.html`. What each does; not what it
should be set to.

## `EC_TUNE.intensity` — one dial, 0 to 1

`ecApplyIntensity(r)` interpolates twelve values through `EC_ENDS` between the
0-end and the 1-end. 0 leaves every derived number where it was; 1 is as tight as
the rescue director goes.

| key | at 0 | at 1 | effect |
|---|---|---|---|
| `base` | 0.55 | 0.02 | odds on the first rescue of a board |
| `inc` | 0.25 | 0.03 | how fast persistence pays |
| `cap` | 0.95 | 0.25 | ceiling however many are bought |
| `floor` | 0.30 | 0.01 | lower bound on the odds |
| `holdAlmost` | 1 | 3 | cards left standing when a rescue falls short |
| `holdProgress` | 2 | 5 | as above for the `progress` intent |
| `minAllow` | 1 | 1 | clearing room every rescue is guaranteed |
| `almostBias` | 0.45 | 0.05 | share of non-win intents that are `almost` |
| `band` | 18 | 34 | candidate band width — wider is less optimal, more varied |
| `deadEnd` | −30 | 0 | penalty for a card matching nothing |
| `deadPull` | 0 | 30 | appetite for one. This is the dead-card rate |
| `paceSlack` | 1 | 0 | 0 spends the clearing allowance one card at a time |
| `frustCap` | 1 | 3 | empty rescues in a row before the next must land |
| `endCap` | 1 | 3 | as above, on a one-card board |
| `emptyEdge/Close/Far/Remote` | low | high | how often a rescue is deliberately empty, per board bucket |

Board size does **not** bend the odds. An earlier version softened them on a
nearly-finished board; that was removed deliberately — the dial governs, the
board does not get a vote.

## `EC_RULES` — floors above the dial

Hold at every intensity.

| key | default | effect |
|---|---|---|
| `maxDeadRun` | 2 | never more than N blanks in a row |
| `minLive` | 1 | every rescue contains at least N cards that do something |
| `active` | true | turn both off to see the raw dial |

Neither can fire when every card that would clear also wins the board — a one- or
two-card board. That limit is arithmetic, not a defect.

## `STREAK_REWARD`

| key | default | effect |
|---|---|---|
| `type` | `'ExtraCards'` | `Coins` \| `ExtraCards` \| `WildCard` |
| `amount` | 1 | base reward |
| `sameColorMultiplier` | 2 | applied to scalable rewards |
| `wildScales` | false | a single Wild stays one Wild |
| `maxExtraCardsPerLevel` | 6 | loop guard |
| `maxRewardsPerLevel` | 4 | loop guard |
| `fallbackType` / `fallbackAmount` | Coins / 100 | paid once a cap is reached |

**`type: 'ExtraCards'` is the current default and is the direct cause of
ISSUE-002.** `Coins` never touches the deck.

## Outcome bands — `OUT`

| outcome | win | band |
|---|---|---|
| Comfortable Win | yes | 4–6 draws unused |
| Close Win | yes | 1–3 |
| Last Card Win | yes | 0 |
| Close Lose | no | 3–5 tableau cards unreachable |
| Comfortable Lose | no | 5–8 |

The lose bands were widened from 1–3 / 4–6. Wider bands give the rescue director
room to work but are harder to verify — see `docs/DECISIONS.md`.
