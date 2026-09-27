---
name: claude-mem
description: >-
  Use this skill to manage context effectively, maintain deep project understanding, and build semantic graphs of the codebase in memory.
---

# Claude-Mem Skill

This skill ensures the agent maintains exceptional long-term context of the project architecture and decisions.

## Memory Practices

1.  **Context Anchoring**: Before making changes to a complex system, summarize the current architecture and state in your thought process to anchor your memory.
2.  **Semantic Mapping**: Understand how files relate to each other. When modifying `A`, explicitly recall if `B` and `C` depend on `A`.
3.  **Decision Logging**: If a significant architectural decision is made (e.g., choosing a state management library), document the *why* so it can be referenced in future sessions.
4.  **Self-Correction via History**: If an error occurs, review the recent transcript of actions to identify the precise misstep rather than guessing.
