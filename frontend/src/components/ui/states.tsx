'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { easeInOutSine } from '@/lib/motion';
import { Icon } from './Icon';
import { FadeSlideIn } from './motion';
import { PremiumButton } from './PremiumButton';

export function Spinner({ size = 36, stroke = 2.5, className }: { size?: number; stroke?: number; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={`animate-spin ${className ?? 'text-green'}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * 0.28} ${c}`}
      />
    </svg>
  );
}

export function LoadingState({ message }: { message?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-4 p-6">
      <motion.div
        animate={{ scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 1.6, ease: easeInOutSine, repeat: Infinity }}
      >
        <Spinner />
      </motion.div>
      {message && (
        <FadeSlideIn offset="20%" duration={0.5}>
          <p className="text-overline text-muted">{message}</p>
        </FadeSlideIn>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  iconClassName = 'text-text/70',
  title,
  message,
  action,
}: {
  icon: string;
  iconClassName?: string;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <FadeSlideIn className="flex flex-col items-center justify-center p-6 text-center">
      <Icon name={icon} size={56} className={iconClassName} />
      <h2 className="mt-4 text-title">{title}</h2>
      {message && <p className="mt-2 max-w-md text-body text-text/70">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </FadeSlideIn>
  );
}

export function RetryButton({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations();
  return (
    <PremiumButton onClick={onRetry} className="px-7 py-3.5">
      {t('retry')}
    </PremiumButton>
  );
}

export function AiNotConfiguredView() {
  const t = useTranslations();
  return <EmptyState icon="cloud_off" iconClassName="text-danger" title={t('aiNotConfiguredTitle')} message={t('aiNotConfiguredMessage')} />;
}

/** Quota exhaustion (429) gets its own hourglass + "limit reached" copy, distinct from "unreachable". */
export function AiUnavailableView({
  quotaExceeded,
  onRetry,
  title,
}: {
  quotaExceeded: boolean;
  onRetry?: () => void;
  title?: string;
}) {
  const t = useTranslations();
  return (
    <EmptyState
      icon={quotaExceeded ? 'hourglass_bottom' : 'wifi_off'}
      iconClassName="text-danger"
      title={quotaExceeded ? t('aiQuotaExceededTitle') : (title ?? t('aiUnavailableTitle'))}
      message={quotaExceeded ? t('aiQuotaExceededMessage') : t('aiUnavailableMessage')}
      action={onRetry && <RetryButton onRetry={onRetry} />}
    />
  );
}
