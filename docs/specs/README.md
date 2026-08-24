# Specifications

Source authority for features. Where a spec and the code disagree, the code is
what ships — record the conflict rather than silently choosing.

| file | covers | status |
|---|---|---|
| `eced_spec.md` | Extra Card Experience Director — the +3/+5 rescue | implemented, see `docs/AI_CONTEXT.md` |
| `streak_reward_spec.md` | streak rewards, colour bonus, injection pathway | implemented; section 21 defines the cases `tools/streaktest.js` verifies |

## Missing

Referenced elsewhere in the documentation but not present. Ask for them rather
than reconstructing from inference:

- **Plus Card obstacle deep-dive** — traced against the Unity build at
  `785fcd2e4`, measured over all 2,500 level files. `docs/RULES.md` RULE-011
  exists because of the win-detection gap it identifies. Highest value of the
  missing documents.
- **ECED architecture review** — the assessment that produced D-003 (intent as a
  hard gate rather than a scoring weight).
- **Empty-rescue correction** — the analysis behind the emptiness budget.
- **Claude Project Operating Guide** (`.docx`) — the working agreement this
  repository's memory structure follows.
