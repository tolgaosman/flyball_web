---
name: task-observer
description: >-
  Use this skill to monitor processes, track goals, detect stalled tasks, and ensure alignment with the original plan.
---

# Task Observer Skill

This skill acts as an internal supervisor, ensuring that long-running or complex tasks do not derail.

## Observation Protocol

1.  **Goal Tracking**: Explicitly define the end goal before starting. Periodically check current progress against this goal.
2.  **Stall Detection**: If a command is running too long, or a bug is taking too many iterations to fix, halt and re-evaluate the approach. Do not get stuck in infinite loops.
3.  **Deviation Correction**: If the implementation starts drifting into unrelated feature creep, forcefully pull focus back to the immediate task.
4.  **Milestone Logging**: Report to the user when significant milestones of a multi-step plan are achieved.
