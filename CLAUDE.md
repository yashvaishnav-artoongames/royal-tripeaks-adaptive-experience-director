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