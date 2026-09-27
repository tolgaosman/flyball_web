'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useTransition } from 'react';
import { LOCALE_COOKIE } from '@/i18n/locale';
import { pressSpring, panelSpring } from '@/lib/motion';
import { useSession } from '@/lib/session';
import { Monogram } from './art/Art';
import { Icon } from './ui/Icon';
import { PremiumButton } from './ui/PremiumButton';

const pill =
  'flex h-10 items-center gap-2 rounded-chip border border-line bg-surface-high/85 px-3 shadow-soft backdrop-blur-sm transition-colors hover:border-line-high';

export function TopBar() {
  return (
    <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 pt-3 lg:px-8 lg:pt-6">
      <AccountPill />
      <LocalePill />
    </div>
  );
}

function LocalePill() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = locale === 'tr' ? 'en' : 'tr';
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.95 }}
      transition={pressSpring}
      title={t('languageToggleTooltip')}
      aria-label={t('languageToggleTooltip')}
      className={`${pill} text-overline text-green ${pending ? 'opacity-70' : ''}`}
    >
      {locale.toUpperCase()}
    </motion.button>
  );
}

function AccountPill() {
  const { user, logout } = useSession();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <motion.div whileTap={{ scale: 0.95 }} transition={pressSpring}>
        <Link href="/login" className={`${pill} text-overline text-green`}>
          <Icon name="person" size={16} />
          {t('authAccountButton')}
        </Link>
      </motion.div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.95 }}
        transition={pressSpring}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={t('accountTooltip')}
        className={`${pill} max-w-[220px] pl-1.5`}
      >
        <Monogram text={user.displayName} size={28} />
        <span className="truncate text-[13px] font-medium">{user.displayName}</span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={t('accountTooltip')}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={panelSpring}
            className="absolute top-12 left-0 z-30 flex w-72 origin-top-left flex-col items-center rounded-card border border-line bg-surface-high p-6 text-center shadow-soft-lg"
          >
            <Monogram text={user.displayName} size={56} />
            <p className="mt-3 text-title">{user.displayName}</p>
            <p className="mt-1 text-caption text-muted">{t('authSignedInAs', { username: user.username })}</p>
            <PremiumButton
              tone="danger"
              className="mt-6 w-full py-3"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            >
              <Icon name="logout" size={20} />
              {t('authSignOut')}
            </PremiumButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
