'use client';

import { motion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/Icon';
import { FadeSlideIn } from '@/components/ui/motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { PremiumLink } from '@/components/ui/PremiumButton';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { cx } from '@/lib/cx';
import { easeInOutSine } from '@/lib/motion';
import { upperFor } from '@/lib/text';

const PREVIEW_WORD = 'MESSI';
const tileTones = ['bg-green text-surface-low', 'bg-gold text-surface-low', 'bg-surface-high text-text border border-line'];
const features = [
  { icon: 'calendar_today', key: 'footballdleFeatureDaily' },
  { icon: 'lightbulb', key: 'footballdleFeatureHints' },
  { icon: 'ios_share', key: 'footballdleFeatureShare' },
] as const;

/** Footballdle is not built yet — a "coming soon" page, as in the Flutter app. */
export default function FootballdlePage() {
  const t = useTranslations();
  const locale = useLocale();
  const title = t('footballdleTitle');

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title={upperFor(title, locale)} />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 pb-12 text-center">
        <div className="relative flex size-32 items-center justify-center">
          <motion.div
            aria-hidden
            className="absolute inset-1 rounded-full bg-[radial-gradient(circle,rgb(47_209_107/0.26)_0%,rgb(240_180_41/0.10)_55%,transparent_100%)]"
            animate={{ scale: [0.96, 1.04, 0.96] }}
            transition={{ duration: 3.6, ease: easeInOutSine, repeat: Infinity }}
          />
          <Icon name="abc" size={56} className="relative text-green" />
        </div>
        <FadeSlideIn delay={0.06}>
          <span className="mt-4 inline-block rounded-full border border-gold/50 bg-gold/16 px-3 py-[5px] text-overline text-gold">
            {t('comingSoonBadge')}
          </span>
        </FadeSlideIn>
        <FadeSlideIn delay={0.1}>
          <h1 className="mt-3 text-display">{upperFor(title, locale)}</h1>
        </FadeSlideIn>
        <FadeSlideIn delay={0.14}>
          <p className="mt-3 text-body text-muted">{t('footballdleTagline')}</p>
        </FadeSlideIn>

        <div className="mt-8 flex flex-wrap justify-center gap-2" aria-hidden>
          {[...PREVIEW_WORD].map((letter, i) => (
            <FadeSlideIn key={i} delay={0.18 + i * 0.06} offset="30%">
              <span className={cx('flex size-10 items-center justify-center rounded-chip font-heading text-xl lg:size-14 lg:text-2xl', tileTones[i % 3])}>
                {letter}
              </span>
            </FadeSlideIn>
          ))}
        </div>

        <FadeSlideIn delay={0.26} className="mt-8 w-full">
          <PremiumCard className="px-4 py-3 text-left">
            <ul className="divide-y divide-line">
              {features.map((f) => (
                <li key={f.key} className="flex items-center gap-3 py-3">
                  <Icon name={f.icon} size={20} className="text-green" />
                  <span className="text-body">{t(f.key)}</span>
                </li>
              ))}
            </ul>
          </PremiumCard>
        </FadeSlideIn>

        <FadeSlideIn delay={0.32} className="mt-8">
          <PremiumLink href="/" tone="secondary" className="px-6 py-3">
            {t('comingSoonBack')}
          </PremiumLink>
        </FadeSlideIn>
      </main>
    </div>
  );
}
