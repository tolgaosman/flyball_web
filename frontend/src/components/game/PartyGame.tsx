'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RoundQueue } from '@/game/roundQueue';
import { AiUnavailableError, fetchTeamCountryRound, fetchTwoTeamRound } from '@/lib/api';
import { clubNames, countryLabel, countryNames } from '@/lib/catalog';
import type { Round, RoundKind } from '@/lib/types';
import { useAiStatus } from '@/lib/useAiStatus';
import { ClubLogo, CountryFlag } from '../art/Art';
import { SuccessPop } from '../ui/motion';
import { PageHeader } from '../ui/PageHeader';
import { PremiumButton } from '../ui/PremiumButton';
import { AiNotConfiguredView, AiUnavailableView, LoadingState } from '../ui/states';
import { AnswersSheet, type AnswersSource } from './AnswersSheet';
import { EditNameDialog, ScorePanel, SlotCard } from './party';

const SPIN_TICK_MS = 80;
const MIN_SPIN_MS = 2000;

const pick = (pool: string[]) => pool[Math.floor(Math.random() * pool.length)];

type Status = { kind: 'loading' } | { kind: 'error'; quotaExceeded: boolean } | { kind: 'ready' };

/**
 * 2 Team 1 Player / 1 Team 1 Country. Spin two reels, land on a round the AI
 * has already confirmed has answers, so ANSWERS opens instantly.
 */
export function PartyGame({ mode }: { mode: RoundKind }) {
  const t = useTranslations();
  const locale = useLocale();
  const aiStatus = useAiStatus();
  const isCountry = mode === 'teamCountry';
  const queue = useMemo(() => new RoundQueue(isCountry ? fetchTeamCountryRound : fetchTwoTeamRound), [isCountry]);

  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [round, setRound] = useState<Round | null>(null);
  const [display, setDisplay] = useState<[string, string]>(['', '']);
  const [spinning, setSpinning] = useState(false);
  const [players, setPlayers] = useState([
    { name: '', score: 0 },
    { name: '', score: 0 },
  ]);
  const [editing, setEditing] = useState<number | null>(null);
  const [answersOpen, setAnswersOpen] = useState(false);
  const started = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const land = (next: Round) => {
    setRound(next);
    setDisplay([next.conditionA, next.conditionB]);
    setStatus({ kind: 'ready' });
  };
  const fail = (e: unknown) => setStatus({ kind: 'error', quotaExceeded: e instanceof AiUnavailableError && e.quotaExceeded });

  useEffect(() => {
    // Ref guard: StrictMode re-runs effects in dev, and every round costs Gemini calls.
    if (aiStatus !== 'ready' || started.current) return;
    started.current = true;
    queue.next().then((r) => mounted.current && land(r), (e: unknown) => mounted.current && fail(e));
  }, [aiStatus, queue]);

  const retry = () => {
    setStatus({ kind: 'loading' });
    queue.next().then(land, fail);
  };

  const spin = async () => {
    if (spinning) return;
    setSpinning(true);
    const timer = setInterval(() => setDisplay([pick(clubNames), pick(isCountry ? countryNames : clubNames)]), SPIN_TICK_MS);
    const [next] = await Promise.allSettled([queue.next(), new Promise((r) => setTimeout(r, MIN_SPIN_MS))]);
    clearInterval(timer);
    if (!mounted.current) return;
    setSpinning(false);
    if (next.status === 'fulfilled') land(next.value);
    else fail(next.reason);
  };

  const names = [players[0].name || t('partyPlayer1Default'), players[1].name || t('partyPlayer2Default')];
  const labelB = isCountry ? countryLabel(display[1], locale) : display[1];
  const source = useMemo<AnswersSource | null>(() => (round ? { kind: 'ready', result: round.answers } : null), [round]);

  const setPlayer = (i: number, change: (p: { name: string; score: number }) => { name: string; score: number }) =>
    setPlayers((prev) => prev.map((p, j) => (j === i ? change(p) : p)));

  const title = isCountry ? t('oneTeamOneCountryTitle') : t('twoTeamOnePlayerTitle');

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title={title} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-8">
        {aiStatus === 'missing' ? (
          <AiNotConfiguredView />
        ) : status.kind === 'loading' && !round ? (
          <LoadingState />
        ) : status.kind === 'error' ? (
          <AiUnavailableView quotaExceeded={status.quotaExceeded} onRetry={retry} />
        ) : (
          <div className="flex flex-col">
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-4 lg:gap-6">
              <SuccessPop trigger={spinning ? null : display[0]} className="min-w-0">
                <SlotCard name={display[0]} label={display[0]} spinning={spinning} isCountry={false} />
              </SuccessPop>
              <span aria-label={t('partyVersus')} className="self-center font-heading text-2xl text-text/50 lg:text-4xl">
                ×
              </span>
              <SuccessPop trigger={spinning ? null : display[1]} className="min-w-0">
                <SlotCard name={display[1]} label={labelB} spinning={spinning} isCountry={isCountry} />
              </SuccessPop>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 lg:mt-8 lg:gap-6">
              {[0, 1].map((i) => (
                <div key={i} className={i === 0 ? 'col-start-1' : 'col-start-3'}>
                  <ScorePanel
                    name={names[i]}
                    score={players[i].score}
                    onEditName={() => setEditing(i)}
                    onIncrement={() => setPlayer(i, (p) => ({ ...p, score: p.score + 1 }))}
                    onDecrement={() => setPlayer(i, (p) => ({ ...p, score: Math.max(0, p.score - 1) }))}
                  />
                </div>
              ))}
              {/* Same width as the "×" above, so the panels line up under their reels. */}
              <span aria-hidden className="invisible col-start-2 row-start-1 font-heading text-2xl lg:text-4xl">
                ×
              </span>
            </div>

            <div className="mx-auto mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-2 lg:mt-10">
              <PremiumButton onClick={spin} disabled={spinning}>
                {isCountry ? t('partyNewRound') : t('partyNewTeams')}
              </PremiumButton>
              <PremiumButton tone="outline" onClick={() => setAnswersOpen(true)} disabled={spinning || !round}>
                {t('partyAnswers')}
              </PremiumButton>
            </div>
          </div>
        )}
      </main>

      <EditNameDialog
        initial={editing === null ? null : names[editing]}
        onClose={(name) => {
          if (name !== null && editing !== null) setPlayer(editing, (p) => ({ ...p, name }));
          setEditing(null);
        }}
      />

      <AnswersSheet
        open={answersOpen}
        onClose={() => setAnswersOpen(false)}
        label={round ? `${round.conditionA} × ${round.conditionB}` : ''}
        source={source}
        header={
          round && (
            <div className="flex flex-col items-center gap-2 pt-2 text-center">
              <div className="flex items-center gap-3">
                <ClubLogo name={round.conditionA} size={42} />
                <span className="text-2xl font-bold text-text/70">×</span>
                {isCountry ? <CountryFlag name={round.conditionB} size={42} /> : <ClubLogo name={round.conditionB} size={42} />}
              </div>
              <p className="text-headline">
                {round.conditionA} <span className="text-text/50">×</span>{' '}
                {isCountry ? countryLabel(round.conditionB, locale) : round.conditionB}
              </p>
            </div>
          )
        }
      />
    </div>
  );
}
