# Royal TriPeaks AED — Claude Repository Handover Instructions

## Purpose

You are taking over the Royal TriPeaks Adaptive Experience Director (AED) repository as the development and project-memory agent.

The repository is intended to become the permanent source of truth for the AED demo and its future evolution.

The immediate goal is NOT to redesign the game or rewrite the demo. First understand the existing repository and establish a reliable project-memory and development structure so future Claude sessions can continue without depending on previous chat history.

## 1. Current Repository Context

Repository:
royal-tripeaks-adaptive-experience-director

Current entry point:
index.html

The current repository contains the latest Royal TriPeaks AED demo, including the current Plus Card obstacle work.

Treat the existing implementation as the primary evidence for what is actually implemented.

Do not assume that a design description, previous conversation, or file name represents behavior that is not supported by the current implementation.

## 2. Your First Task — Understand Before Changing

Before modifying any existing file:

1. Inspect the complete repository.
2. Inspect index.html and understand its current functionality.
3. Identify the current UI/demo structure.
4. Identify gameplay-related concepts represented in the demo.
5. Identify AED-related concepts.
6. Identify Plus Card obstacle behavior that is actually implemented.
7. Identify data/configuration represented in the project.
8. Identify existing documentation.
9. Identify missing project knowledge that future Claude sessions would need.
10. Identify contradictions or uncertainties.

Do NOT immediately rewrite or restructure the demo.

Do NOT create duplicate HTML files.

Do NOT change gameplay behavior during this analysis phase.

## 3. Evidence Classification

For important findings, distinguish between:

VERIFIED
Directly supported by the current source code, data, or explicit approved project documentation.

LIVE
Observed by actually running/testing the current demo.

INFERRED
Reasonably derived from implementation or surrounding context, but not explicitly confirmed.

PROPOSED
A new design or behavior suggested for future implementation.

UNKNOWN
Information that cannot currently be established.

Never convert INFERRED, PROPOSED, or UNKNOWN information into a VERIFIED rule.

## 4. Project Memory You Should Create

After completing the analysis, propose and then, after approval, create a clean project-memory structure.

Recommended structure:

CLAUDE.md
docs/
    AI_CONTEXT.md
    RULES.md
    GLOSSARY.md
    DECISIONS.md
    OPEN_QUESTIONS.md
    KNOWN_ISSUES.md
    SESSION_HANDOFF.md
CHANGELOG.md

Do not create files merely because they are listed above. Use the analysis to determine whether each file provides long-term value.

Keep CLAUDE.md concise and operational. It should describe how Claude must work on this repository, not contain the entire AED specification.

## 5. What Each Memory File Should Contain

CLAUDE.md
Permanent operating instructions for Claude working on this repository.

AI_CONTEXT.md
Stable project knowledge: game context, AED purpose, architecture, important systems, and durable understanding.

RULES.md
Explicit gameplay/AED rules that are verified or approved.

GLOSSARY.md
Canonical definitions of project-specific terminology.

DECISIONS.md
Approved architectural/design decisions, including why they were made. Do not silently rewrite historical decisions; supersede them with a new decision when necessary.

OPEN_QUESTIONS.md
Unresolved questions, missing evidence, and items requiring investigation.

KNOWN_ISSUES.md
Confirmed implementation problems. Do not use this file for speculation.

SESSION_HANDOFF.md
Current working state: what was completed, what is being investigated, what remains, and what should happen next.

CHANGELOG.md
Versioned record of meaningful project changes.

## 6. Plus Card — Important Constraint

The Plus Card must be treated as a SPECIFIC MAP OBSTACLE.

Do not generalize the term to every card, every plus-card visual, or every extra-card reward.

Before documenting exact Plus Card behavior, inspect the current implementation and relevant data.

Do not invent:
- trigger timing
- number of cards added
- insertion position
- card ordering
- randomness
- dependency behavior
- deck mutation
- telemetry
- AED consequences

If these details cannot be verified, record them as UNKNOWN or OPEN QUESTIONS.

## 7. Preserve the Existing Demo

The current index.html is the existing demo and should remain the primary entry point.

Do not create files such as:

demo-v2.html
demo-final.html
index-new.html
plus-card-v2.html

for ordinary feature changes.

When the existing demo needs to change, modify the existing implementation unless there is a clear architectural reason to split it.

Do not remove existing functionality unless explicitly requested.

Do not rewrite unrelated systems while working on a specific feature.

## 8. Proposed Working Workflow

For future changes use:

UNDERSTAND
→ inspect current implementation and relevant documentation

CLASSIFY
→ identify whether the task is UI, gameplay, AED, data, telemetry, architecture, bug fix, etc.

PLAN
→ identify affected systems and dependencies

IMPLEMENT
→ make the smallest appropriate change

VERIFY
→ run/test the relevant behavior

DOCUMENT
→ update durable project memory when knowledge or decisions change

VERSION
→ update changelog/version when appropriate

HANDOFF
→ update the current session state

COMMIT
→ preserve the approved state in Git

Do not claim something was tested if it was not actually tested.

## 9. AED Explanation Standard

When documenting an AED rule or adaptive behavior, explain it using:

Trigger
What causes the rule to activate?

Inputs
What information is evaluated?

Decision
What does AED determine?

Action
What does AED change?

State
What state is mutated?

Player Experience
What does the player see or experience?

Telemetry
What should be recorded?

Downstream Plan
How can the result influence future planning?

Fallback
What happens if the expected condition cannot be satisfied?

## 10. Git and Versioning

Git should become the durable history of the project.

Use Git history instead of creating duplicate HTML files for every version.

Preferred progression:

feature branch
→ implementation
→ verification
→ review
→ merge
→ version/tag
→ production

The repository should preserve code, documentation, decisions, and changelog together so rollback restores the complete project state.

Do not push destructive or unreviewed changes to production.

## 11. Claude Session Continuity

A completely new Claude session must be able to understand the project from the repository.

At the start of a meaningful task, read:

1. CLAUDE.md
2. relevant AI_CONTEXT.md sections
3. relevant RULES.md
4. relevant GLOSSARY.md
5. relevant DECISIONS.md
6. SESSION_HANDOFF.md
7. relevant current source code
8. relevant CHANGELOG entries

The old conversation should not be required to understand the current project.

The repository is the durable source of truth; chat history is temporary context.

## 12. First Deliverable From You

Your FIRST response after inspecting this repository should NOT be a code rewrite.

Provide:

1. Current repository structure.
2. Current demo functionality.
3. Current Plus Card implementation and what can actually be verified.
4. Current AED-related behavior that can actually be verified.
5. Important project concepts discovered.
6. Recommended permanent project-memory structure.
7. Information that should go into each memory file.
8. Unverified assumptions and open questions.
9. Risks or inconsistencies you found.
10. A proposed plan for establishing the project memory.

Wait for approval before making broad changes.

After approval, create/populate the project-memory files from the actual repository evidence.

## 13. Quality Bar

The objective is not to create many documentation files.

The objective is to make the project understandable and maintainable across future Claude sessions.

A good result means:

New Claude chat
→ reads project memory
→ understands current implementation
→ knows what is verified
→ knows what is unknown
→ understands approved decisions
→ continues work without asking for the previous conversation.

Do not optimize for documentation volume. Optimize for durable, accurate project knowledge.

## Final Instruction

Start by inspecting the repository and current index.html.

Do not modify the demo yet.

Do not commit yet.

Do not invent missing behavior.

Return the analysis and proposed memory structure first.

Wait for approval before creating or substantially modifying the project-memory files.
