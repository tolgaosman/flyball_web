---
name: anti-slop
description: >-
  Use this skill to enforce clean, idiomatic, hyper-optimized code and reject lazy AI-generated boilerplate patterns.
---

# Anti-Slop Skill

This skill enforces strict code quality standards to prevent "slop" (verbose, generic, poorly abstracted, or redundant code).

## Guidelines

1.  **No Boilerplate**: Remove unnecessary abstractions, excessive comments explaining obvious code, and dead code.
2.  **Idiomatic Code**: Write code exactly as a senior developer of that language would. Leverage modern language features (e.g., pattern matching, early returns).
3.  **Hyper-Optimized**: Avoid O(n^2) operations where O(n) is possible. Prevent unnecessary re-renders in UI frameworks. Minimize bundle size.
4.  **Modularity**: Keep functions small and focused on a single responsibility (SOLID). Extract reusable logic into hooks or utility functions.
5.  **Directness**: Stop apologizing, stop writing filler text, and focus entirely on the exact technical solution.
