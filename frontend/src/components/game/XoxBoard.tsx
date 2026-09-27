'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import type { Mark, XoxGame } from '@/game/xox';
import { isOver } from '@/game/xox';
import { cx } from '@/lib/cx';
import { pressSpring } from '@/lib/motion';
import { useElementSize } from '@/lib/useElementSize';
import type { Factor } from '@/lib/types';
import { FactorImage } from '../art/Art';
import { Icon } from '../ui/Icon';
import { SuccessPop } from '../ui/motion';

const LONG_PRESS_MS = 500;
const GAP = 8;

export const markColor: Record<Mark, string> = { x: 'text-green', o: 'text-gold' };
const markBorder: Record<Mark, string> = { x: 'border-green', o: 'border-gold' };

/**
 * 4×4 layout: an empty corner, 3 column headers, 3 row headers and the 3×3
 * grid. Art and mark sizes follow the measured cell size (never fixed), like
 * the Flutter LayoutBuilder version.
 */
export function XoxBoard({ game, onClaim, onReveal }: { game: XoxGame; onClaim: (index: number) => void; onReveal: (index: number) => void }) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const side = Math.min(width, height, 680);
  const cell = side > 0 ? (side - GAP * 3) / 4 : 0;
  const artSize = Math.min(Math.max(cell * 0.5, 24), 56);
  const markFont = Math.min(Math.max(cell * 0.32, 16), 40);
  const over = isOver(game);

  return (
    <div ref={ref} className="flex h-full min-h-0 w-full items-center justify-center">
      {cell > 0 && (
        <div
          className="grid"
          style={{ width: side, height: side, gap: GAP, gridTemplateColumns: `repeat(4, ${cell}px)`, gridTemplateRows: `repeat(4, ${cell}px)` }}
        >
          <div aria-hidden />
          {game.board.columns.map((f, i) => (
            <Header key={`c${i}`} factor={f} size={artSize} />
          ))}
          {game.board.rows.map((row, r) => [
            <Header key={`r${r}`} factor={row} size={artSize} />,
            ...game.board.columns.map((_, c) => {
              const index = r * 3 + c;
              return (
                <Cell
                  key={index}
                  label={`${row.label} × ${game.board.columns[c].label}`}
                  mark={game.cells[index]}
                  markFont={markFont}
                  canClaim={!over && !game.cells[index]}
                  onClaim={() => onClaim(index)}
                  onReveal={() => onReveal(index)}
                />
              );
            }),
          ])}
        </div>
      )}
    </div>
  );
}

function Header({ factor, size }: { factor: Factor; size: number }) {
  return (
    <div
      title={factor.label}
      className="flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-chip border border-line/50 bg-surface-high/92 p-1.5 shadow-soft"
    >
      <FactorImage factor={factor} size={size} />
      <span className="sr-only">{factor.label}</span>
      <span aria-hidden className="line-clamp-2 hidden px-1 text-center text-[11px] leading-tight text-muted xl:block">
        {factor.label}
      </span>
    </div>
  );
}

function Cell({
  label,
  mark,
  markFont,
  canClaim,
  onClaim,
  onReveal,
}: {
  label: string;
  mark: Mark | null;
  markFont: number;
  canClaim: boolean;
  onClaim: () => void;
  onReveal: () => void;
}) {
  const t = useTranslations();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  return (
    <SuccessPop trigger={mark} className="group relative">
      <motion.button
        type="button"
        whileTap={canClaim ? { scale: 0.95 } : undefined}
        transition={pressSpring}
        aria-label={mark ? `${label}: ${mark.toUpperCase()}` : label}
        onPointerDown={(e) => {
          if (e.pointerType !== 'touch') return;
          longPressed.current = false;
          pressTimer.current = setTimeout(() => {
            longPressed.current = true;
            onReveal();
          }, LONG_PRESS_MS);
        }}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        onContextMenu={(e) => {
          e.preventDefault();
          cancelPress();
          if (!longPressed.current) onReveal();
        }}
        onClick={() => {
          if (longPressed.current) {
            longPressed.current = false;
            return;
          }
          if (canClaim) onClaim();
        }}
        className={cx(
          'flex size-full items-center justify-center rounded-chip border p-1 shadow-soft transition-colors select-none [-webkit-touch-callout:none]',
          mark ? cx('bg-surface/92', markBorder[mark]) : 'border-line/50 bg-surface-low/92 hover:border-line-high hover:bg-surface',
          !canClaim && 'cursor-default',
        )}
      >
        {mark ? (
          <span className={cx('font-heading leading-none', markColor[mark])} style={{ fontSize: markFont }}>
            {mark.toUpperCase()}
          </span>
        ) : (
          <Icon name="add" size={28} className="text-text/70" />
        )}
      </motion.button>
      <button
        type="button"
        onClick={onReveal}
        aria-label={t('xoxShowAnswers')}
        title={t('xoxShowAnswers')}
        className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-surface-high/90 text-text/80 opacity-0 transition-opacity group-hover:opacity-100 hover:text-green focus-visible:opacity-100 [@media(hover:none)]:hidden"
      >
        <Icon name="search" size={16} />
      </button>
    </SuccessPop>
  );
}
