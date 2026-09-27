import type { Transition } from 'motion/react';

/** Curves from AppTheme, as cubic-bezier tuples. */
export const easeOutCirc = [0.075, 0.82, 0.165, 1] as const;
export const easeOutCubic = [0.215, 0.61, 0.355, 1] as const;
export const emphasized = [0.18, 1, 0.04, 1] as const;
export const easeInOutSine = [0.445, 0.05, 0.55, 0.95] as const;

/** Press feedback: a stiff, quickly-settling spring (interruptible, unlike a fixed tween). */
export const pressSpring: Transition = { type: 'spring', stiffness: 600, damping: 32, mass: 0.6 };

/** Panels and sheets. */
export const panelSpring: Transition = { type: 'spring', stiffness: 380, damping: 38 };
