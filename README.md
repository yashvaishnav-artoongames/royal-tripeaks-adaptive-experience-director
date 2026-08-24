# royal-tripeaks-adaptive-experience-director

Royal TriPeaks Adaptive Experience Director (AED) — an adaptive gameplay and experience
direction system for designing, testing, and evolving dynamic TriPeaks level experiences,
with versioned demos, gameplay logic, telemetry, and persistent AI-assisted project
documentation.

## Layout

    index.html    the demo. Single file, no build step. Open it in a browser.
    tools/        verification harnesses — see tools/README.md
    levels/       level JSON as exported from the game
    docs/         project memory (to be created)

## Running the demo

Open `index.html`. Nothing to install.

## Verifying a change

    node tools/reg.js          core director, must stay 48/48
    node tools/plustest.js     Plus Card obstacle, 13/13
    node tools/streaktest.js   streak rewards, 26/26

See `tools/README.md` for the rest.
