'use client';

import { motion } from 'motion/react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FactorImage } from '@/components/art/Art';
import { AnswersSheet, type AnswersSource } from '@/components/game/AnswersSheet';
import { markColor, XoxBoard } from '@/components/game/XoxBoard';
import { Icon } from '@/components/ui/Icon';
import { FadeSlideIn, SuccessPop } from '@/components/ui/motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { AiNotConfiguredView, AiUnavailableView, LoadingState } from '@/components/ui/states';
import { claimCell, createGame, filledCount, isOver, passTurn, type XoxGame } from '@/game/xox';
import { AiUnavailableError, fetchBoard, searchAnswers } from '@/lib/api';
import { cx } from '@/lib/cx';
import { pressSpring } from '@/lib/motion';
import { upperFor } from '@/lib/text';
import { useAiStatus } from '@/lib/useAiStatus';

export default function XoxPlayPage() {
  return (
    <Suspense>
      <XoxPlay />
    </Suspense>
  );
}

type LoadState = { status: 'loading' } | { status: 'error'; quotaExceeded: boolean } | { status: 'ready'; game: XoxGame; matchId: number };

function XoxPlay() {
  const t = useTranslations();
  const params = useSearchParams();
  const aiStatus = useAiStatus();
  const playerX = params.get('x')?.trim() || 'Player X';
  const playerO = params.get('o')?.trim() || 'Player O';

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [revealed, setRevealed] = useState<number | null>(null);
  const requestId = useRef(0);
  const started = useRef(false);

  // Only the newest request may land (a slow old board never replaces a newer one).
  const load = useCallback(() => {
    const id = ++requestId.current;
    fetchBoard().then(
      (board) => id === requestId.current && setState({ status: 'ready', game: createGame(board, playerX, playerO), matchId: id }),
      (e: unknown) =>
        id === requestId.current && setState({ status: 'error', quotaExceeded: e instanceof AiUnavailableError && e.quotaExceeded }),
    );
  }, [playerX, playerO]);

  const newGame = () => {
    setState({ status: 'loading' });
    setRevealed(null);
    load();
  };

  useEffect(() => {
    // Ref guard: StrictMode re-runs effects in dev, and every board costs a Gemini call.
    if (aiStatus !== 'ready' || started.current) return;
    started.current = true;
    load();
  }, [aiStatus, load]);

  const update = (next: (game: XoxGame) => XoxGame) =>
    setState((s) => (s.status === 'ready' ? { ...s, game: next(s.game) } : s));

  const loading = state.status === 'loading';
  const refresh = (
    <motion.button
      type="button"
      onClick={newGame}
      disabled={loading || aiStatus !== 'ready'}
      whileTap={{ scale: 0.9 }}
      transition={pressSpring}
      aria-label={t('xoxNewGameTooltip')}
      title={t('xoxNewGameTooltip')}
      className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-surface-high disabled:opacity-40"
    >
      <Icon name="refresh" />
    </motion.button>
  );

  return (
    <div className="flex h-dvh flex-col">
      <PageHeader title={t('xoxTitle')} backHref="/xox" action={refresh} />
      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 pb-4 lg:px-8 lg:pb-8">
        {aiStatus === 'missing' ? (
          <Centered>
            <AiNotConfiguredView />
          </Centered>
        ) : state.status === 'ready' ? (
          <Match
            key={state.matchId}
            game={state.game}
            onClaim={(i) => update((g) => claimCell(g, i))}
            onPass={() => update(passTurn)}
            onPlayAgain={newGame}
            onReveal={setRevealed}
          />
        ) : state.status === 'error' ? (
          <Centered>
            <AiUnavailableView quotaExceeded={state.quotaExceeded} title={t('xoxBoardUnavailableTitle')} onRetry={newGame} />
          </Centered>
        ) : (
          <Centered>
            <LoadingState message={t('xoxBuildingBoard')} />
          </Centered>
        )}
      </main>
      {state.status === 'ready' && <CellAnswers game={state.game} index={revealed} onClose={() => setRevealed(null)} />}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center">{children}</div>;
}

function Match({
  game,
  onClaim,
  onPass,
  onPlayAgain,
  onReveal,
}: {
  game: XoxGame;
  onClaim: (index: number) => void;
  onPass: () => void;
  onPlayAgain: () => void;
  onReveal: (index: number) => void;
}) {
  const t = useTranslations();
  const over = isOver(game);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">
      <div className="lg:order-2 lg:flex lg:flex-col lg:justify-center lg:gap-4">
        <StatusBar game={game} onPass={onPass} />
        <p className="mt-4 hidden text-caption text-muted lg:block">{t('xoxRevealHint')}</p>
        {over && (
          <div className="mt-4 hidden lg:block">
            <ResultBanner game={game} onPlayAgain={onPlayAgain} />
          </div>
        )}
      </div>
      <FadeSlideIn className="min-h-0 flex-1 lg:order-1">
        <XoxBoard game={game} onClaim={onClaim} onReveal={onReveal} />
      </FadeSlideIn>
      {over && (
        <div className="lg:hidden">
          <ResultBanner game={game} onPlayAgain={onPlayAgain} />
        </div>
      )}
    </div>
  );
}

function StatusBar({ game, onPass }: { game: XoxGame; onPass: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const over = isOver(game);
  const tone = game.winner ?? game.current;
  const color = tone ? markColor[tone] : 'text-text/70';

  const text = game.winner
    ? t('xoxWins', { name: upperFor(game.names[game.winner], locale) })
    : game.isDraw
      ? t('xoxDraw')
      : t('xoxTurn', { name: game.names[game.current ?? 'x'] });

  return (
    <PremiumCard
      className={cx(
        'flex items-center gap-3 px-4 py-3 lg:flex-col lg:items-stretch lg:gap-5 lg:p-6',
        tone === 'x' ? 'border-green' : tone === 'o' ? 'border-gold' : 'border-text/40',
      )}
      aria-live="polite"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SuccessPop trigger={`${game.current}-${over}`}>
          <span
            className={cx(
              'flex size-9 shrink-0 items-center justify-center rounded-chip border-[2.5px] bg-surface-low text-headline lg:size-14 lg:text-title',
              color,
              tone === 'x' ? 'border-green' : tone === 'o' ? 'border-gold' : 'border-text/40',
            )}
          >
            {over ? '🏁' : (game.current ?? 'x').toUpperCase()}
          </span>
        </SuccessPop>
        <p className={cx('truncate text-headline lg:text-title', color)}>{text}</p>
      </div>
      {over ? (
        <span className="text-caption text-muted">{filledCount(game)}/9</span>
      ) : (
        <PremiumButton tone="muted" onClick={onPass} className="px-3 py-1 lg:py-3">
          {t('xoxPass')}
        </PremiumButton>
      )}
    </PremiumCard>
  );
}

function ResultBanner({ game, onPlayAgain }: { game: XoxGame; onPlayAgain: () => void }) {
  const t = useTranslations();
  return (
    <FadeSlideIn>
      <PremiumCard className={cx('flex items-center gap-3 p-4 lg:flex-col lg:items-stretch lg:p-6', game.winner === 'x' ? 'border-green' : game.winner === 'o' ? 'border-gold' : 'border-text/40')}>
        <p className="line-clamp-2 flex-1 text-body">
          {game.winner ? t('xoxCompletedLine', { name: game.names[game.winner] }) : t('xoxNoMoreMoves')}
        </p>
        <PremiumButton onClick={onPlayAgain} className="px-4 py-3">
          {t('xoxPlayAgain')}
        </PremiumButton>
      </PremiumCard>
    </FadeSlideIn>
  );
}

function CellAnswers({ game, index, onClose }: { game: XoxGame; index: number | null; onClose: () => void }) {
  const { board } = game;
  const row = index === null ? null : board.rows[Math.floor(index / 3)];
  const col = index === null ? null : board.columns[index % 3];

  const source = useMemo<AnswersSource | null>(() => {
    if (index === null) return null;
    const r = board.rows[Math.floor(index / 3)];
    const c = board.columns[index % 3];
    return { kind: 'live', preview: board.cellExamples[index], fetch: () => searchAnswers('xox', r.label, c.label) };
  }, [index, board]);

  return (
    <AnswersSheet
      open={index !== null}
      onClose={onClose}
      label={row && col ? `${row.label} × ${col.label}` : ''}
      source={source}
      header={
        row &&
        col && (
          <div className="flex flex-col items-center gap-3 pt-2 text-center">
            <div className="flex items-center gap-3">
              <FactorImage factor={row} size={48} />
              <span className="font-bold text-text/70">×</span>
              <FactorImage factor={col} size={48} />
            </div>
            <p className="text-headline">
              {row.label} <span className="text-text/50">×</span> {col.label}
            </p>
          </div>
        )
      }
    />
  );
}
