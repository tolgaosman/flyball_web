import { cx } from '@/lib/cx';

/**
 * Material Symbols Rounded — the same icon family as the Flutter app. The font
 * is subset to exactly these names (see ICON_NAMES in app/layout.tsx).
 */
export function Icon({
  name,
  size = 24,
  outline = false,
  className,
}: {
  name: string;
  size?: number;
  outline?: boolean;
  className?: string;
}) {
  return (
    <span aria-hidden className={cx('icon', outline && 'icon-outline', className)} style={{ fontSize: size, width: size, height: size }}>
      {name}
    </span>
  );
}
