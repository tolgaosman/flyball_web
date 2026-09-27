---
name: image-to-code
description: >-
  Use this skill for translating design mockups (images) into pixel-perfect code, handling responsive breakpoints, and estimating missing metrics.
---

# Image to Code Skill

This skill is essential when converting a static image or mockup into a functional web component.

## Translation Workflow

1.  **Structural Analysis**: Before writing CSS, break the image down into its semantic HTML structure. What is a list? What is a button?
2.  **Layout Estimation**: Guess the grid/flexbox structure. Is it a row with `justify-content: space-between`?
3.  **Metric Approximation**: Estimate paddings and margins. Assume a standard 4px/8px scale. If something looks like 16px padding, use `1rem` (assuming 16px base).
4.  **Responsive Extrapolation**: If only a desktop mockup is provided, logically infer the mobile layout (usually stacking columns into rows).
5.  **Typography Matching**: Estimate font weights, sizes, and line-heights visually. Look for established hierarchies in the image.
