'use client';

import { motion, type HTMLMotionProps } from 'motion/react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { pressSpring } from '@/lib/motion';

export type ButtonTone = 'primary' | 'secondary' | 'outline' | 'muted' | 'danger';

const tones: Record<ButtonTone, string> = {
  primary: 'bg-green text-surface-low shadow-glow [--glow:var(--color-green)]',
  secondary: 'bg-surface-high text-text border border-line shadow-soft',
  outline: 'bg-surface text-text border border-green shadow-glow [--glow:var(--color-green)]',
  muted: 'bg-surface-low text-text border border-line',
  danger: 'bg-surface text-danger border border-danger shadow-glow [--glow:var(--color-danger)]',
};

const base =
  'inline-flex items-center justify-center gap-3 rounded-card font-heading text-base select-none ' +
  'transition-[background-color,color,box-shadow] duration-150 ' +
  'active:shadow-none disabled:bg-surface-low disabled:text-muted disabled:border-line disabled:shadow-none ' +
  'hover:brightness-110 disabled:hover:brightness-100';

interface Props extends Omit<HTMLMotionProps<'button'>, 'children'> {
  tone?: ButtonTone;
  icon?: string;
  children: ReactNode;
}

/** Presses down to 95% on a spring; fires on release (click), like the Flutter button. */
export function PremiumButton({ tone = 'primary', className, children, disabled, ...props }: Props) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={pressSpring}
      disabled={disabled}
      className={cx(base, 'px-6 py-[18px]', tones[tone], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}

const MotionLink = motion.create(Link);

/** Same look as PremiumButton, for navigation. */
export function PremiumLink({
  href,
  tone = 'primary',
  className,
  children,
  ...props
}: { href: string; tone?: ButtonTone; className?: string; children: ReactNode } & Omit<
  HTMLMotionProps<'a'>,
  'href' | 'children'
>) {
  return (
    <MotionLink
      href={href}
      whileTap={{ scale: 0.95 }}
      transition={pressSpring}
      className={cx(base, 'px-6 py-[18px]', tones[tone], className)}
      {...props}
    >
      {children}
    </MotionLink>
  );
}
