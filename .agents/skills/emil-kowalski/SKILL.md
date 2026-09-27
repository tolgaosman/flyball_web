---
name: emil-kowalski
description: >-
  Use this skill to recreate Emil Kowalski's signature UI/UX style: smooth animations, spring physics, and delightful micro-interactions.
---

# Emil Kowalski Skill

Emil Kowalski's style is defined by organic, physics-based animations, incredible attention to detail, and seamless transitions.

## Key Techniques

1.  **Spring Physics**: Never use linear or basic ease animations for spatial changes. Always use spring physics (e.g., framer-motion springs) with carefully tuned stiffness and damping to make UI feel physical.
2.  **Micro-Interactions**: Every click, hover, and state change should have a crafted animation. Think of the Vaul drawer or Sonner toasts.
3.  **Shared Element Transitions**: When an item expands or moves to a new page, use `layoutId` (Framer Motion) to seamlessly morph it into its new state.
4.  **Interruptibility**: Animations must always be interruptible. If a user clicks away mid-animation, it should reverse fluidly, not jump.
5.  **Hardware Acceleration**: Ensure animations are smooth (60-120fps) by animating `transform` and `opacity` only.
