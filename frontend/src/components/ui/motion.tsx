'use client';

import { motion, useAnimate, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { easeOutCirc, easeOutCubic, emphasized } from '@/lib/motion';

/** Entrance: fade in while sliding up from 5% of its own height (FadeSlideIn). */
export function FadeSlideIn({
  delay = 0,
  offset = '5%',
  duration = 0.7,
  children,
  ...props
}: { delay?: number; offset?: string | number; duration?: number; children: ReactNode } & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: emphasized }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Pop-and-settle (1 → 1.1 → 1 over 400 ms) whenever `trigger` changes to a new
 * non-null value. ONE keyframed animation on one element: chaining two scale
 * animations would compose multiplicatively and leave the element oversized.
 */
export function SuccessPop({
  trigger,
  className,
  children,
}: {
  trigger: string | null;
  className?: string;
  children: ReactNode;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const previous = useRef(trigger);

  useEffect(() => {
    if (trigger === previous.current) return;
    previous.current = trigger;
    if (trigger === null || reduceMotion) return;
    animate(scope.current, { scale: [1, 1.1, 1] }, { duration: 0.4, times: [0, 0.375, 1], ease: [easeOutCubic, easeOutCirc] });
  }, [trigger, reduceMotion, animate, scope]);

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
