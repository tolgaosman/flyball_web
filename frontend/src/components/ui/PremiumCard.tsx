import type { ComponentProps } from 'react';
import { cx } from '@/lib/cx';

/**
 * The shared container: 92%-opaque fill, a 1px border at half strength, soft
 * diffuse shadow. Pass bg-* / border-* classes to recolor.
 */
export function PremiumCard({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cx('rounded-card border border-line/50 bg-surface/92 shadow-soft', className)}
      {...props}
    />
  );
}
