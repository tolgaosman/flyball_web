---
name: framer-motion
description: >-
  Use this skill to implement advanced Framer Motion techniques in React, including layout animations, variants, and spring physics.
---

# Framer Motion Skill

This skill guides the creation of highly dynamic, performant React interfaces using Framer Motion.

## Implementation Guide

1.  **Layout Animations**: Use the `layout` prop to automatically animate components between different CSS layouts (e.g., flexbox reordering, size changes).
2.  **Variants**: Define complex, multi-stage animations using the `variants` prop. This keeps markup clean and allows orchestration (e.g., staggering children).
3.  **AnimatePresence**: Use `<AnimatePresence>` to animate components *out* of the React tree when they are unmounted. Critical for modals, toasts, and route transitions.
4.  **Scroll Animations**: Utilize `useScroll` and `useTransform` to tie element properties (opacity, scale, y-position) directly to the scroll progress for parallax effects.
5.  **Performance**: Add `layoutId` for smooth shared-element transitions. Prefer animating `transform` over width/height to avoid layout thrashing.
