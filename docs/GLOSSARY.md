# Glossary

Canonical definitions. Do not create conflicting ones elsewhere.

**Plus Card** — a level-authored map obstacle, declared by the `PlusCards` key in
level JSON as `{index, Value}`. It occupies a board slot, is never playable, and
when uncovered grants `Value` cards to the top of the deck and removes itself.
Not every card with a plus visual. Not the rescue. Not the streak reward.

**Extra Card Experience Director (ECED)** — the director that takes over when the
core level has ended and the player buys a +3 or +5 rescue. Owns every card it
deals until the rescue ends.

**Rescue** — the +3 (ad) or +5 (coins) offer presented when the deck is empty,
the board is not clear, and nothing is playable.

**Streak reward** — paid when the streak meter reaches `PIPS` (5). Configurable
as Coins, ExtraCards or WildCard in `STREAK_REWARD`.

**Wild** — a waste card that matches everything. Two provenances, one state
(`wr === WILD_RANK`): the Use Wild button, and a Wild card drawn from the deck.

**Verified director** — pre-commits a deck and proves the outcome over every
legal line before play.

**Live director** — holds no plan; mints each card as it is drawn.

**Target (`tv`)** — the exact value an outcome must land on. Draws unused for a
win, unreachable tableau cards for a loss.

**Band** — the range an outcome permits (`OUT[ti].lo`–`.hi`). **The band is the
promise; `tv` is a point inside it.**

**Intent** — what a rescue is trying to do: `win`, `almost` or `progress`.
Enforced as a hard gate, not a scoring preference.

**Dry rescue** — a rescue deliberately chosen to clear nothing.

**Supply change** — any mid-level mutation of the deck, whatever caused it.

**Granted card** — a card added by a reward or obstacle rather than dealt by the
level. Tagged `dk[i][3] === true` and excluded from core rank-supply accounting.
