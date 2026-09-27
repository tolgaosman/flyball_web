'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AiUnavailableError } from '@/lib/api';
import { foldContains } from '@/lib/text';
import type { AnswerResult } from '@/lib/types';
import { Icon } from '../ui/Icon';
import { FadeSlideIn } from '../ui/motion';
import { PremiumButton } from '../ui/PremiumButton';
import { PremiumCard } from '../ui/PremiumCard';
import { Sheet } from '../ui/Sheet';
import { AiUnavailableView, EmptyState, LoadingState } from '../ui/states';

export type AnswersSource =
  /** Party rounds: already verified by the server, so no loading state. */
  | { kind: 'ready'; result: AnswerResult }
  /** XOX cells: show the board's preview, fetch the authoritative list live. */
  | { kind: 'live'; preview: string[]; fetch: () => Promise<AnswerResult> };

interface Props {
  open: boolean;
  onClose: () => void;
  label: string;
  header: ReactNode;
  source: AnswersSource | null;
}

const sourceKeys = new WeakMap<AnswersSource, number>();
let nextSourceKey = 0;

/** A fresh body (and fresh live search) per source object. */
function keyFor(source: AnswersSource): number {
  let key = sourceKeys.get(source);
  if (key === undefined) sourceKeys.set(source, (key = nextSourceKey++));
  return key;
}

export function AnswersSheet({ open, onClose, label, header, source }: Props) {
  return (
    <Sheet open={open} onClose={onClose} label={label}>
      {header}
      {source && <AnswersBody key={keyFor(source)} source={source} onClose={onClose} />}
    </Sheet>
  );
}

type LiveState =
  | { status: 'loading' }
  | { status: 'done'; result: AnswerResult }
  | { status: 'error'; quotaExceeded: boolean };

function AnswersBody({ source, onClose }: { source: AnswersSource; onClose: () => void }) {
  const t = useTranslations();
  const [query, setQuery] = useState('');
  const [live, setLive] = useState<LiveState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (source.kind !== 'live') return;
    let active = true;
    source.fetch().then(
      (result) => active && setLive({ status: 'done', result }),
      (e: unknown) => active && setLive({ status: 'error', quotaExceeded: e instanceof AiUnavailableError && e.quotaExceeded }),
    );
    return () => {
      active = false;
    };
  }, [source, attempt]);

  const load = () => {
    setLive({ status: 'loading' });
    setAttempt((a) => a + 1);
  };

  const { names, verified, loading, error } = useMemo(() => {
    if (source.kind === 'ready') return { names: source.result.players, verified: source.result.verified, loading: false, error: null };
    switch (live.status) {
      case 'loading':
        return { names: source.preview, verified: true, loading: true, error: null };
      case 'done':
        return { names: live.result.players, verified: live.result.verified, loading: false, error: null };
      case 'error':
        // A failed live search still has the board's confirmed preview to show.
        return source.preview.length
          ? { names: source.preview, verified: true, loading: false, error: null }
          : { names: [], verified: true, loading: false, error: live };
    }
  }, [source, live]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col justify-center">
        {error.quotaExceeded ? (
          <AiUnavailableView quotaExceeded onRetry={load} />
        ) : (
          <EmptyState
            icon="wifi_off"
            iconClassName="text-danger"
            title={t('answersSearchFailedTitle')}
            message={t('answersSearchFailedMessage')}
            action={
              <PremiumButton onClick={load} className="px-7 py-3.5">
                {t('retry')}
              </PremiumButton>
            }
          />
        )}
      </div>
    );
  }

  const filtered = names.filter((n) => foldContains(n, query));

  return (
    <>
      <p className="mt-3 text-overline text-green" aria-live="polite">
        {loading ? t('answersSearching') : t('answersCount', { count: names.length })}
      </p>
      {!loading && names.length > 0 && !verified && <p className="mt-1 text-overline text-danger">{t('answersUnverifiedWarning')}</p>}

      {names.length > 0 && (
        <label className="mt-4 flex h-12 items-center gap-2 rounded-card border border-line bg-surface-low px-4 focus-within:border-2 focus-within:border-green">
          <Icon name="search" size={20} className="text-text/70" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('answersSearchHint')}
            aria-label={t('answersSearchHint')}
            className="h-full w-full bg-transparent text-sm font-medium outline-none placeholder:text-text/70"
          />
        </label>
      )}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {loading ? (
          <LoadingState message={t('answersSearching')} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search_off" title={t('answersNoneFound')} />
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((name, i) => (
              <li key={`${i}:${name}`}>
                <FadeSlideIn delay={0.03 * Math.min(i, 12)} duration={0.5}>
                  <PremiumCard className="bg-surface-low px-4 py-3 text-body">{name}</PremiumCard>
                </FadeSlideIn>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PremiumButton onClick={onClose} className="mt-4 w-full">
        {t('close')}
      </PremiumButton>
    </>
  );
}
