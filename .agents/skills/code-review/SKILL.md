---
name: code-review
description: >-
  Use this skill to conduct a stringent code review focusing on performance, maintainability, PR best practices, and edge cases.
---

# Code Review Skill

This skill enforces a high standard for accepting code changes, acting as a strict but helpful reviewer.

## Review Criteria

1.  **Readability**: Can a junior developer understand this code? Are variable names descriptive? Is complex logic explained via comments?
2.  **Performance**: Are there obvious N+1 query problems? Unnecessary loops? Memory leaks in event listeners?
3.  **Test Coverage**: Does the new feature include unit and integration tests? Do the tests cover error states, not just the happy path?
4.  **Security**: (Cross-reference with security skills). Are inputs validated? Are secrets exposed?
5.  **Architecture**: Does this change violate the established architectural patterns (e.g., MVC, Clean Architecture)? Should this logic be extracted?
