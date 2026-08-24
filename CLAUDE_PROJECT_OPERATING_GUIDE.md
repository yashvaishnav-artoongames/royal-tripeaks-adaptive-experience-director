# TriPeaks AED Demo — Claude Project Operating Guide

## Document Purpose

This document defines how Claude must work on the TriPeaks Adaptive Experience Director (AED) demo.

The goal is to make the project:

- persistent across Claude chats and sessions,
- version controlled,
- hosted from one permanent project,
- safe to modify,
- easy to review,
- easy to roll back,
- understandable by a new Claude session without relying on old chat history.

**Core principle:**

> The conversation is temporary. The project is permanent.

Important knowledge discovered or approved during a conversation must eventually be stored in the project repository.

---

# 1. Project Source-of-Truth Model

Use the following priority order when determining what the project means or how it should behave:

1. Current source code and current data/configuration.
2. Approved project documentation.
3. `DECISIONS.md`.
4. `RULES.md`.
5. `CHANGELOG.md`.
6. `SESSION_HANDOFF.md`.
7. Previous chat conversation.

Do not treat an old conversation as authoritative when the repository contains newer information.

If sources disagree:

- identify the conflict,
- do not silently choose,
- determine which source is newer/approved,
- update the appropriate project documentation after the decision is made.

Never invent undocumented gameplay behavior and present it as verified.

---

# 2. Repository Structure

The target project should use this structure:

```text
TRIPEAKS-AED/
│
├── index.html
├── README.md
├── CLAUDE.md
├── CHANGELOG.md
│
├── docs/
│   ├── AI_CONTEXT.md
│   ├── RULES.md
│   ├── GLOSSARY.md
│   ├── DECISIONS.md
│   ├── OPEN_QUESTIONS.md
│   ├── KNOWN_ISSUES.md
│   ├── SESSION_HANDOFF.md
│   │
│   ├── architecture/
│   ├── gameplay/
│   ├── directors/
│   ├── obstacles/
│   └── versions/
│
└── tests/
```

The structure may evolve as the project grows, but the separation of responsibilities should remain.

---

# 3. Responsibilities of Each File

## `CLAUDE.md`

This file contains only the rules Claude must consistently follow.

It should include:

- development rules,
- source-of-truth hierarchy,
- workflow rules,
- memory maintenance rules,
- release rules,
- safety rules.

Keep it concise.

Do not turn `CLAUDE.md` into the complete AED specification.

---

## `docs/AI_CONTEXT.md`

Contains stable project knowledge.

Examples:

- what TriPeaks gameplay is,
- what AED is,
- core gameplay loop,
- major systems,
- director responsibilities,
- obstacle concepts,
- deck concepts,
- telemetry concepts,
- current architecture.

Only put durable knowledge here.

---

## `docs/RULES.md`

Contains explicit AED/gameplay rules.

Example:

```text
RULE-001
Plus Card is a map obstacle.

RULE-002
A Plus Card obstacle must not be treated as every normal card
that happens to have a plus-card visual.

RULE-003
Adaptive decisions must be explainable.

RULE-004
Verified behavior must not be replaced by inferred behavior.

RULE-005
Major adaptive events must be represented in telemetry.
```

Rules should have an ID and status where useful.

---

## `docs/GLOSSARY.md`

Contains canonical definitions.

Example:

```text
Plus Card
A specific map obstacle that can affect deck/card planning.

Extra Card
A card added as a consequence of a defined game/director rule.

Wild Card
A special card/reward that can alter the playable deck or director plan.

Rescue
A recovery mechanism used when the player is approaching or entering
an undesirable gameplay state.
```

Do not create conflicting definitions in other files.

---

## `docs/DECISIONS.md`

Contains approved architectural and gameplay decisions.

Every important decision should record:

```text
Decision ID
Title
Status
Decision
Reason
Impact
Version
```

Example:

```text
D-017 — Plus Card Is a Map Obstacle

Status: APPROVED

Decision:
Plus Card is modeled as a specific obstacle placed in the level map.

Reason:
Its lifecycle can affect future deck planning and AED behavior.

Impact:
The obstacle must be represented separately from generic cards.

Version:
1.5.0
```

Do not rewrite history. If a decision changes, mark the old decision as superseded and create a new decision.

---

## `docs/OPEN_QUESTIONS.md`

Contains unresolved questions.

Example:

```text
Q-001
Question:
What exact JSON property defines Plus Card placement?

Status:
OPEN

Evidence:
Current level JSON inspection required.

Next action:
Inspect source/level data.
```

Possible statuses:

- OPEN
- INVESTIGATING
- BLOCKED
- PROPOSED
- RESOLVED

Never silently convert an open question into a fact.

---

## `docs/KNOWN_ISSUES.md`

Contains confirmed implementation problems.

Example:

```text
ISSUE-003

Problem:
Plus Card fired state does not update telemetry.

Severity:
MEDIUM

Status:
OPEN

Introduced:
1.5.0
```

Do not use this file for speculative issues.

---

## `docs/SESSION_HANDOFF.md`

Contains only the current working state.

It should answer:

- What were we working on?
- What was completed?
- What was verified?
- What remains?
- What is uncertain?
- What should happen next?

It must not become a transcript of the chat.

---

## `CHANGELOG.md`

Contains release history.

Every release should contain:

```text
Version
Date
What's New
Changed
Fixed
Known Issues
Verification
```

---

# 4. Fresh Claude Chat Protocol

When a new Claude session starts, Claude must NOT assume it has the previous conversation context.

Claude should first:

1. Read `CLAUDE.md`.
2. Read `docs/AI_CONTEXT.md`.
3. Read the latest relevant entries in `CHANGELOG.md`.
4. Read `docs/SESSION_HANDOFF.md`.
5. Read relevant `RULES.md`, `GLOSSARY.md`, and `DECISIONS.md`.
6. Inspect the current implementation related to the requested task.
7. Identify any relevant open questions or known issues.

Then provide a short internal project summary before making changes.

Do not ask the user to paste the previous conversation unless repository context is genuinely missing.

---

# 5. Development Workflow

For every requested change:

## Step 1 — Understand

Before editing:

- inspect the current implementation,
- identify related code,
- inspect relevant data/configuration,
- inspect relevant project documentation,
- identify dependencies,
- identify existing behavior that must be preserved.

Do not immediately generate a replacement file.

---

## Step 2 — Classify the Request

Determine whether the request is:

- UI-only,
- gameplay behavior,
- AED logic,
- data/configuration,
- telemetry,
- architecture,
- bug fix,
- refactor,
- documentation,
- test/validation.

If it affects multiple systems, identify those systems explicitly.

---

## Step 3 — Determine Evidence

Classify important statements as:

### VERIFIED

Directly supported by source/specification.

### LIVE

Observed in the running demo.

### INFERRED

Reasonably derived but not explicitly specified.

### PROPOSED

New behavior that has not yet been approved.

Never describe INFERRED or PROPOSED behavior as VERIFIED.

---

## Step 4 — Plan the Change

Before implementation, identify:

```text
Trigger
↓
Inputs
↓
Decision
↓
Action
↓
State mutation
↓
Player-visible result
↓
Telemetry
↓
AED consequence
↓
Fallback / invalid state
```

This structure is especially important for AED and obstacle logic.

---

## Step 5 — Modify the Existing Project

**Do not create duplicate HTML files.**

Never create:

```text
tripeaks-2.html
tripeaks-final.html
tripeaks-final-v2.html
new-demo.html
```

Instead modify:

```text
index.html
```

or the appropriate source module once the project is split into modules.

If a new file is genuinely necessary, explain why before creating it.

---

# 6. Preserve Existing Functionality

Unless explicitly requested:

- do not remove existing features,
- do not rewrite unrelated logic,
- do not change existing behavior,
- do not rename public identifiers unnecessarily,
- do not replace the architecture simply because a different approach looks cleaner.

If a refactor is necessary:

1. explain the reason,
2. identify affected behavior,
3. preserve functionality,
4. verify before/after behavior,
5. document the architectural decision.

---

# 7. AED Logic Documentation Standard

Every major AED rule should be explainable using:

```text
WHEN
What triggers the rule?

INPUTS
What information is evaluated?

DECISION
What does AED determine?

ACTION
What does AED change?

STATE
What state changes?

PLAYER EXPERIENCE
What does the player see/feel?

TELEMETRY
What is recorded?

DOWNSTREAM PLAN
How can this affect future director decisions?

FALLBACK
What happens if the expected condition cannot be satisfied?
```

This format should be used when documenting directors, obstacles, rescues, streaks, extra cards, wild cards, and other adaptive systems.

---

# 8. Plus Card Obstacle Rules

The Plus Card must be treated as a **specific map obstacle**.

Do not generalize it to every plus-card visual or every extra card.

The lifecycle must be understood as:

```text
Level JSON / Map Placement
        ↓
Plus Card Obstacle Exists
        ↓
Obstacle Becomes Active / Fires
        ↓
Extra-Card Resolution
        ↓
Card Placement / Deck Mutation
        ↓
Updated Gameplay State
        ↓
AED Plan May Adapt
        ↓
Telemetry
```

The exact behavior at each stage must be verified against source/specification.

Claude must not invent:

- insertion position,
- card ordering,
- trigger timing,
- number of cards,
- randomness,
- dependency behavior,
- telemetry behavior,

unless those rules are supported by the current implementation/specification or explicitly approved by the user.

---

# 9. Versioning

Use release versions such as:

```text
1.0.0
1.1.0
1.2.0
1.2.1
2.0.0
```

General convention:

- MAJOR = significant architecture/behavior change.
- MINOR = new feature or gameplay capability.
- PATCH = bug fix or small safe correction.

Every approved release must update:

```text
CHANGELOG.md
```

and, when applicable:

```text
DECISIONS.md
AI_CONTEXT.md
RULES.md
GLOSSARY.md
```

---

# 10. Git Workflow

Use Git as the actual source of truth.

Recommended:

```text
main
│
└── production
```

Feature work:

```text
feature/plus-card-obstacle
feature/rescue-director
feature/streak-reward
bugfix/deck-order
```

Workflow:

```text
Feature branch
      ↓
Implementation
      ↓
Validation
      ↓
Preview deployment
      ↓
User review
      ↓
Merge
      ↓
Version tag
      ↓
Production
```

Never overwrite history to hide a bad implementation.

---

# 11. Rollback

If a release is broken:

Do NOT ask Claude to recreate the previous version manually.

Instead:

```text
Production v1.6.0
       ↓
Problem detected
       ↓
Rollback
       ↓
Production v1.5.0
```

Git history must preserve:

- code,
- documentation,
- AI memory,
- decisions,
- changelog.

Memory and code should therefore evolve together.

---

# 12. Preview vs Production

Production should always represent an approved version.

Claude development should happen in a feature branch and preview environment where possible.

```text
Claude change
     ↓
Feature branch
     ↓
Preview URL
     ↓
Testing
     ↓
Approval
     ↓
Merge
     ↓
Production
```

Do not directly experiment on the production deployment.

---

# 13. AI Memory Maintenance

At the end of meaningful work:

### If a stable rule was discovered

Update:

```text
CLAUDE.md
or
RULES.md
or
GLOSSARY.md
```

### If an architectural decision was approved

Update:

```text
DECISIONS.md
```

### If stable project knowledge was learned

Update:

```text
AI_CONTEXT.md
```

### If something remains unresolved

Update:

```text
OPEN_QUESTIONS.md
```

### If a confirmed bug exists

Update:

```text
KNOWN_ISSUES.md
```

### If the current work changed

Update:

```text
SESSION_HANDOFF.md
```

### If a release occurred

Update:

```text
CHANGELOG.md
```

Do not dump the entire conversation into project memory.

---

# 14. Preventing Memory Pollution

Do not store:

- temporary conversation details,
- irrelevant user messages,
- repeated explanations,
- speculative ideas as facts,
- obsolete implementation details,
- large conversation transcripts.

Memory should contain information that helps future Claude sessions make correct decisions.

A useful test:

> If a completely new Claude session started one month from now, would this information help it work correctly?

If not, it probably does not belong in permanent memory.

---

# 15. Change Impact Analysis

Before implementing a major change, identify:

```text
Feature
│
├── UI
├── Gameplay
├── Deck
├── Level data
├── AED Director
├── Telemetry
├── Rewards/Economy
├── Validation
└── Documentation
```

Only modify affected areas.

After the change, verify that unrelated areas still work.

---

# 16. Testing Requirements

Before considering a change complete:

### Basic

- application loads,
- no blocking JavaScript errors,
- existing major UI works.

### Feature

- requested feature behaves correctly,
- edge cases are considered,
- invalid states are handled.

### Regression

- existing behavior still works,
- existing controls still work,
- existing demo scenarios still work.

### AED

- decision is explainable,
- state mutation is correct,
- telemetry is correct,
- downstream planning is considered.

If automated tests exist, run them.

If automated tests do not exist, perform structured manual verification and document what was checked.

---

# 17. Release Checklist

Before release:

```text
[ ] Current implementation inspected
[ ] Requirement understood
[ ] Change scope identified
[ ] Existing behavior preserved
[ ] New behavior implemented
[ ] Edge cases considered
[ ] Validation completed
[ ] Version incremented
[ ] CHANGELOG updated
[ ] Relevant memory updated
[ ] Relevant decision recorded
[ ] Open questions updated
[ ] Known issues updated
[ ] Preview tested
[ ] Production-ready
```

---

# 18. What Claude Must Report After a Change

After implementation, provide:

## Changed

What was modified.

## Why

Why the change was necessary.

## Behavior

How the new behavior works.

## Verification

What was tested.

## Files Changed

List the relevant files.

## Version

Current/new version.

## Documentation Updated

List memory/changelog/decision files updated.

## Remaining Questions

Anything still unverified.

Do not claim a test passed if it was not actually performed.

---

# 19. Fresh-Chat Recovery Test

The project should periodically be tested from a completely new Claude session.

Use:

```text
Continue the TriPeaks AED project.

Read the project instructions and memory first.
Do not ask me to provide previous chat context unless something
important is genuinely missing.

Summarize:
1. current project state,
2. current version,
3. latest changes,
4. important AED rules,
5. current Plus Card understanding,
6. open questions,
7. current next step.

Then wait for my task.
```

A successful fresh-chat test means Claude can reconstruct the project without the old conversation.

---

# 20. Recommended Claude Project Instructions

When creating the Claude Project, use this high-level instruction:

```text
You are working on the TriPeaks Adaptive Experience Director (AED) project.

Treat the connected repository and its documentation as the durable source of truth.

Before making changes:
1. Read CLAUDE.md.
2. Read relevant project context.
3. Read the latest session handoff.
4. Inspect the current implementation.
5. Identify verified behavior versus assumptions.

Never create duplicate HTML files for normal feature changes.
Modify the existing project.

Preserve existing functionality unless the task explicitly changes it.

For AED logic, always reason through:
trigger → inputs → decision → action → state → player experience → telemetry → downstream plan → fallback.

Never present inferred or proposed behavior as verified.

When a durable rule, decision, or project fact is established, update the appropriate project memory file.

At the end of meaningful work:
- update the session handoff,
- update changelog/version when applicable,
- record important decisions,
- record open questions or known issues.

The goal is that a completely new Claude chat can continue this project without relying on previous conversation history.
```

---

# 21. What Claude Should Never Do

Claude must NOT:

1. Generate a new HTML demo for every request.
2. Delete existing functionality without explicit instruction.
3. Invent gameplay rules.
4. Present assumptions as facts.
5. Ignore existing project decisions.
6. Modify production without a safe review path.
7. Rewrite project memory with temporary conversation details.
8. Forget to update durable documentation after important discoveries.
9. Claim validation that was not performed.
10. Use old conversation context when the repository contains newer information.
11. Silently contradict an approved design decision.
12. Change unrelated systems while implementing a feature.

---

# 22. Long-Term Evolution

The project may eventually evolve from:

```text
index.html
```

into:

```text
src/
├── game/
├── aed/
├── directors/
├── obstacles/
├── telemetry/
├── rewards/
└── ui/
```

This is acceptable.

However, the AI-memory architecture should remain:

```text
CLAUDE.md
AI_CONTEXT.md
RULES.md
GLOSSARY.md
DECISIONS.md
OPEN_QUESTIONS.md
KNOWN_ISSUES.md
SESSION_HANDOFF.md
CHANGELOG.md
```

The code architecture can change without losing project continuity.

---

# 23. Final Operating Principle

The AED project is not a collection of Claude-generated files.

It is a single evolving product/design system.

The desired behavior is:

```text
New idea
   ↓
Claude investigates current project
   ↓
Implementation
   ↓
Verification
   ↓
Decision / knowledge captured
   ↓
Git commit
   ↓
Version
   ↓
Preview
   ↓
Approval
   ↓
Production
```

And when the next Claude chat starts:

```text
New Claude Chat
      ↓
Read Project Memory
      ↓
Read Current Code
      ↓
Understand Current State
      ↓
Continue Work
```

**The objective is continuity without dependence on conversation history.**
