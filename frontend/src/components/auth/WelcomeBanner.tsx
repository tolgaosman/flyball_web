'use client';

import { useTranslations } from 'next-intl';
import { Icon } from '../ui/Icon';
import { FadeSlideIn } from '../ui/motion';
import { PremiumCard } from '../ui/PremiumCard';

export function WelcomeBanner({ name }: { name: string }) {
  const t = useTranslations();
  return (
    <FadeSlideIn duration={0.4}>
      <PremiumCard role="status" className="mt-1 flex items-center gap-3 border-green px-4 py-3 text-left">
        <Icon name="sports_soccer" size={20} className="text-green" />
        <p className="text-body">{t('authWelcome', { name })}</p>
      </PremiumCard>
    </FadeSlideIn>
  );
}
