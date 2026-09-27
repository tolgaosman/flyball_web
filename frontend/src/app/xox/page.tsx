'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { FadeSlideIn } from '@/components/ui/motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { cx } from '@/lib/cx';
import { upperFor } from '@/lib/text';

const NAME_MAX = 16;
const REVEAL_MS = 1800;

export default function XoxLobbyPage() {
  const t = useTranslations();
  const router = useRouter();
  const [names, setNames] = useState(['', '']);
  const [errors, setErrors] = useState<(string | null)[]>([null, null]);
  const [assigned, setAssigned] = useState<{ x: string; o: string } | null>(null);
  const secondField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!assigned) return;
    const timer = setTimeout(() => {
      router.push(`/xox/play?${new URLSearchParams({ x: assigned.x, o: assigned.o })}`);
    }, REVEAL_MS);
    return () => clearTimeout(timer);
  }, [assigned, router]);

  const start = (e: FormEvent) => {
    e.preventDefault();
    const [a, b] = names.map((n) => n.trim());
    const next = [a ? null : t('lobbyNameRequired'), b ? null : t('lobbyNameRequired')];
    if (a && b && a.toLowerCase() === b.toLowerCase()) next[1] = t('lobbyNamesMustDiffer');
    setErrors(next);
    if (next.some(Boolean)) return;
    (document.activeElement as HTMLElement | null)?.blur();
    // Coin flip: either name can end up as X (who always starts).
    setAssigned(Math.random() < 0.5 ? { x: a, o: b } : { x: b, o: a });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title={t('lobbyTitle')} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 pb-16">
        {assigned ? (
          <Reveal assigned={assigned} />
        ) : (
          <form onSubmit={start} noValidate className="flex w-full flex-col items-center text-center">
            <FadeSlideIn>
              <Icon name="grid_3x3" size={64} className="text-green/70" />
            </FadeSlideIn>
            <FadeSlideIn delay={0.12}>
              <p className="mt-4 text-caption text-muted lg:text-body">{t('lobbyRandomAssignHint')}</p>
            </FadeSlideIn>
            <div className="mt-8 grid w-full gap-4 md:grid-cols-2 lg:mt-10 lg:gap-6">
              {[0, 1].map((i) => (
                <FadeSlideIn key={i} delay={0.18 + i * 0.08}>
                  <NameField
                    ref={i === 1 ? secondField : undefined}
                    icon="person"
                    outline={i === 1}
                    label={i === 0 ? t('lobbyPlayerXLabel') : t('lobbyPlayerOLabel')}
                    value={names[i]}
                    error={errors[i]}
                    autoFocus={i === 0}
                    onChange={(v) => setNames((prev) => prev.map((n, j) => (j === i ? v : n)))}
                    onEnter={i === 0 ? () => secondField.current?.focus() : undefined}
                    placeholder={t('lobbyNameHint')}
                  />
                </FadeSlideIn>
              ))}
            </div>
            <FadeSlideIn delay={0.34} className="mt-8 lg:mt-10">
              <PremiumButton type="submit" className="px-8 py-4 text-[22px] text-surface-low">
                <Icon name="play_arrow" size={28} />
                {t('lobbyStart')}
              </PremiumButton>
            </FadeSlideIn>
          </form>
        )}
      </main>
    </div>
  );
}

interface NameFieldProps {
  ref?: React.Ref<HTMLInputElement>;
  icon: string;
  outline: boolean;
  label: string;
  value: string;
  error: string | null;
  autoFocus: boolean;
  placeholder: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
}

function NameField({ ref, icon, outline, label, value, error, autoFocus, placeholder, onChange, onEnter }: NameFieldProps) {
  return (
    <div className="text-left">
      <PremiumCard className={cx('flex items-center gap-3 px-4 py-2 transition-colors focus-within:border-green/60', error && 'border-danger/80')}>
        <Icon name={icon} outline={outline} size={28} className="text-green" />
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onEnter) {
              e.preventDefault();
              onEnter();
            }
          }}
          maxLength={NAME_MAX}
          autoFocus={autoFocus}
          autoCapitalize="words"
          autoComplete="off"
          aria-label={label}
          aria-invalid={!!error}
          placeholder={placeholder}
          className="h-12 w-full bg-transparent text-headline outline-none placeholder:text-text/30"
        />
      </PremiumCard>
      {error && <p className="mt-2 pl-4 text-caption text-danger">{error}</p>}
    </div>
  );
}

function Reveal({ assigned }: { assigned: { x: string; o: string } }) {
  const locale = useLocale();
  return (
    <div className="flex w-full flex-col items-center" aria-live="polite">
      <FadeSlideIn>
        <span className="text-[56px] leading-none" aria-hidden>
          ⚡
        </span>
      </FadeSlideIn>
      <div className="mt-6 grid w-full max-w-2xl gap-4 md:grid-cols-2">
        <FadeSlideIn delay={0.5}>
          <MarkChip mark="X" name={upperFor(assigned.x, locale)} className="text-green" border="border-green/30" />
        </FadeSlideIn>
        <FadeSlideIn delay={0.7}>
          <MarkChip mark="O" name={upperFor(assigned.o, locale)} className="text-gold" border="border-gold/30" />
        </FadeSlideIn>
      </div>
    </div>
  );
}

function MarkChip({ mark, name, className, border }: { mark: string; name: string; className: string; border: string }) {
  return (
    <PremiumCard className={cx('flex items-center gap-4 px-6 py-4', border)}>
      <span className={cx('flex size-[52px] shrink-0 items-center justify-center rounded-chip border-[1.5px] bg-surface-low font-display text-[36px] leading-none font-bold', border, className)}>
        {mark}
      </span>
      <span className="truncate text-headline">{name}</span>
    </PremiumCard>
  );
}
