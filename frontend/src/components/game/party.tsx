'use client';

import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { cx } from '@/lib/cx';
import { ClubLogo, CountryFlag } from '../art/Art';
import { Dialog } from '../ui/Dialog';
import { Icon } from '../ui/Icon';
import { PremiumButton } from '../ui/PremiumButton';
import { PremiumCard } from '../ui/PremiumCard';

/** One slot-machine reel: art + name. Art is NOT fetched while spinning (names change every 80 ms). */
export function SlotCard({ name, label, spinning, isCountry }: { name: string; label: string; spinning: boolean; isCountry: boolean }) {
  return (
    <PremiumCard
      className={cx(
        'flex h-full flex-col items-center justify-center px-3 py-4 text-center transition-colors duration-200 lg:px-6 lg:py-10',
        spinning ? 'border-green' : 'border-line',
      )}
    >
      <div className="flex h-[84px] items-center justify-center lg:hidden">
        {isCountry ? <CountryFlag name={name} size={72} enabled={!spinning} /> : <ClubLogo name={name} size={72} enabled={!spinning} />}
      </div>
      <div className="hidden h-[150px] items-center justify-center lg:flex">
        {isCountry ? <CountryFlag name={name} size={140} enabled={!spinning} /> : <ClubLogo name={name} size={128} enabled={!spinning} />}
      </div>
      <p className="mt-3 line-clamp-2 text-headline lg:mt-6 lg:text-title">{label}</p>
    </PremiumCard>
  );
}

export function ScorePanel({
  name,
  score,
  onEditName,
  onIncrement,
  onDecrement,
}: {
  name: string;
  score: number;
  onEditName: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const t = useTranslations();
  return (
    <PremiumCard className="flex h-full flex-col items-center px-2 py-4 lg:px-5">
      <button
        type="button"
        onClick={onEditName}
        title={t('partyEditNameTooltip')}
        className="flex h-11 max-w-full items-center gap-1 rounded-chip px-2 text-caption transition-colors hover:bg-surface-high"
      >
        <span className="truncate">{name}</span>
        <Icon name="edit" size={14} className="text-text/70" />
        <span className="sr-only">{t('partyEditNameTooltip')}</span>
      </button>
      <p className="mt-2 font-heading text-[44px] text-green tabular-nums lg:text-[56px]" aria-live="polite">
        {score}
      </p>
      <div className="mt-3 grid w-full grid-cols-2 gap-2">
        <PremiumButton tone="muted" onClick={onDecrement} aria-label={t('partyScoreDown')} className="px-2 py-2">
          <Icon name="remove" size={20} />
        </PremiumButton>
        <PremiumButton onClick={onIncrement} aria-label={t('partyScoreUp')} className="px-2 py-2">
          <Icon name="add" size={20} />
        </PremiumButton>
      </div>
    </PremiumCard>
  );
}

const NAME_MAX = 24;

/** Rename a player; an empty or cancelled edit keeps the old name. */
export function EditNameDialog({ initial, onClose }: { initial: string | null; onClose: (name: string | null) => void }) {
  const t = useTranslations();
  const titleId = useId();
  return (
    <Dialog open={initial !== null} onClose={() => onClose(null)} labelledBy={titleId}>
      {initial !== null && <EditNameForm key={initial} initial={initial} titleId={titleId} onClose={onClose} t={t} />}
    </Dialog>
  );
}

function EditNameForm({
  initial,
  titleId,
  onClose,
  t,
}: {
  initial: string;
  titleId: string;
  onClose: (name: string | null) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [value, setValue] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onClose(value.trim() || null);
      }}
    >
      <h2 id={titleId} className="text-title">
        {t('partyEditNameTitle')}
      </h2>
      <input
        autoFocus
        value={value}
        maxLength={NAME_MAX}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.target.select()}
        className="mt-5 w-full border-b border-text/70 bg-transparent pb-2 text-base font-medium outline-none focus:border-b-2 focus:border-green"
      />
      <p className="mt-1 text-right text-xs text-muted">
        {value.length}/{NAME_MAX}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={() => onClose(null)} className="rounded-chip px-4 py-2 text-sm font-medium text-text/70 hover:bg-surface">
          {t('cancel')}
        </button>
        <button type="submit" className="rounded-chip px-4 py-2 text-sm font-medium text-green hover:bg-green/10">
          {t('save')}
        </button>
      </div>
    </form>
  );
}
