'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { TopBar } from '@/components/TopBar';
import { Icon } from '@/components/ui/Icon';
import { FadeSlideIn } from '@/components/ui/motion';
import { PremiumLink } from '@/components/ui/PremiumButton';
import { cx } from '@/lib/cx';

const games = [
  { href: '/xox', icon: 'grid_3x3', label: 'playFootballXox', primary: true },
  { href: '/two-team-one-player', icon: 'group', label: 'playTwoTeamOnePlayer' },
  { href: '/one-team-one-country', icon: 'public', label: 'playOneTeamOneCountry' },
  { href: '/footballdle', icon: 'password', label: 'playFootballdle', soon: true },
] as const;

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-6 py-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8">
        <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <FadeSlideIn offset="18%">
            <GlowingLogo />
          </FadeSlideIn>
          <FadeSlideIn delay={0.08}>
            <h1 className="mt-4 text-display-xl">
              <span>FLY</span>
              <span className="text-green">BALL</span>
            </h1>
          </FadeSlideIn>
          <FadeSlideIn delay={0.14}>
            <p className="mt-4 max-w-md text-body text-muted lg:text-lg">{t('homeTagline')}</p>
          </FadeSlideIn>
        </section>

        <nav aria-label="Games" className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
          {games.map((game, i) => (
            <FadeSlideIn key={game.href} delay={0.2 + i * 0.07} className="h-full">
              <PremiumLink
                href={game.href}
                tone={'primary' in game ? 'primary' : 'secondary'}
                className={cx(
                  'h-full w-full justify-start px-[22px] py-5',
                  'lg:min-h-44 lg:flex-col lg:items-start lg:justify-between lg:p-7',
                )}
              >
                <Icon name={game.icon} size={30} className="lg:text-[40px]" />
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="truncate text-2xl leading-tight">{t(game.label)}</span>
                  {'soon' in game && (
                    <span className="shrink-0 rounded-full border border-current/40 bg-surface-low/50 px-2 py-[3px] text-overline text-[10px]">
                      {t('comingSoonBadge')}
                    </span>
                  )}
                </span>
              </PremiumLink>
            </FadeSlideIn>
          ))}
        </nav>
      </main>
    </div>
  );
}

function GlowingLogo() {
  return (
    <div className="relative flex size-[200px] items-center justify-center lg:size-[260px]">
      <div
        aria-hidden
        className="absolute inset-[5px] rounded-full bg-[radial-gradient(circle,rgb(47_209_107/0.28)_0%,rgb(240_180_41/0.10)_55%,rgb(47_209_107/0)_100%)]"
      />
      <Image src="/flyball_app_logo.png" alt="Flyball" width={425} height={425} priority className="relative size-28 lg:size-36" />
    </div>
  );
}
