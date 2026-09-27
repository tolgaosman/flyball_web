'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useId, useState, type ReactNode } from 'react';
import { AccountErrors, AccountRules } from '@/lib/accountRules';
import { cx } from '@/lib/cx';
import { Icon } from '../ui/Icon';
import { FadeSlideIn } from '../ui/motion';
import { PageHeader } from '../ui/PageHeader';
import { PremiumButton } from '../ui/PremiumButton';
import { PremiumCard } from '../ui/PremiumCard';
import { Spinner } from '../ui/states';

type T = ReturnType<typeof useTranslations>;

/** Server/client error code → localized message (authErrorMessage in the Flutter app). */
export function authErrorMessage(t: T, code: string): string {
  switch (code) {
    case AccountErrors.invalidCredentials:
      return t('authInvalidCredentials');
    case AccountErrors.usernameTaken:
      return t('authUsernameTaken');
    case AccountErrors.tooManyAttempts:
      return t('authTooManyAttempts');
    case AccountErrors.invalidUsername:
      return t('authInvalidUsername', { min: AccountRules.username.minLength, max: AccountRules.username.maxLength });
    case AccountErrors.weakPassword:
      return t('authWeakPassword', { min: AccountRules.password.minLength });
    case AccountErrors.invalidDisplayName:
      return t('authDisplayNameTooLong', { max: AccountRules.displayName.maxLength });
    case 'network':
      return t('authNetworkError');
    default:
      return t('authUnknownError');
  }
}

/** Page shell: brand panel beside the form on desktop, the Flutter single column on phones. */
export function AuthPage({
  title,
  icon,
  headline,
  subtitle,
  children,
}: {
  title: string;
  icon: string;
  headline: string;
  subtitle: string;
  children: ReactNode;
}) {
  const t = useTranslations();
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title={title} />
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 pb-12 lg:grid-cols-2 lg:px-8">
        <FadeSlideIn className="hidden flex-col items-start lg:flex">
          <Image src="/flyball_app_logo.png" alt="" width={425} height={425} className="size-24" />
          <p className="mt-6 text-display-xl">
            FLY<span className="text-green">BALL</span>
          </p>
          <p className="mt-4 max-w-sm text-lg text-muted">{t('homeTagline')}</p>
        </FadeSlideIn>
        <div className="mx-auto w-full max-w-[400px] lg:mx-0 lg:justify-self-end">
          <FadeSlideIn className="flex flex-col items-center text-center">
            <Icon name={icon} size={56} className="text-green/80" />
          </FadeSlideIn>
          <FadeSlideIn delay={0.08}>
            <h2 className="mt-4 text-center text-title">{headline}</h2>
          </FadeSlideIn>
          <FadeSlideIn delay={0.12}>
            <p className="mt-2 text-center text-caption text-muted">{subtitle}</p>
          </FadeSlideIn>
          <FadeSlideIn delay={0.18} className="mt-8">
            {children}
          </FadeSlideIn>
        </div>
      </main>
    </div>
  );
}

interface FieldProps {
  label: string;
  icon: string;
  outline?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  type?: 'text' | 'password';
  autoComplete: string;
  maxLength: number;
  disabled: boolean;
  autoFocus?: boolean;
}

export function AuthField({ label, icon, outline, value, onChange, error, type = 'text', autoComplete, maxLength, disabled, autoFocus }: FieldProps) {
  const t = useTranslations();
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <PremiumCard
        className={cx(
          'flex items-center gap-3 px-4 py-1 transition-colors focus-within:border-green/60',
          error && 'border-danger/80',
          disabled && 'opacity-60',
        )}
      >
        <Icon name={icon} outline={outline} size={24} className="text-green" />
        <div className="relative flex-1">
          <input
            id={id}
            type={isPassword && !visible ? 'password' : 'text'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder=" "
            autoComplete={autoComplete}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={maxLength}
            disabled={disabled}
            autoFocus={autoFocus}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className="peer h-14 w-full bg-transparent pt-4 text-base font-medium outline-none"
          />
          <label
            htmlFor={id}
            className="pointer-events-none absolute top-1.5 left-0 text-xs text-green transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-green"
          >
            {label}
          </label>
        </div>
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t('authHidePassword') : t('authShowPassword')}
            title={visible ? t('authHidePassword') : t('authShowPassword')}
            className="flex size-9 items-center justify-center rounded-full text-text/70 hover:bg-surface-high"
          >
            <Icon name={visible ? 'visibility_off' : 'visibility'} size={20} />
          </button>
        )}
      </PremiumCard>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 pl-4 text-left text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <FadeSlideIn duration={0.4}>
      <PremiumCard role="alert" className="flex items-center gap-3 border-danger px-4 py-3 text-left">
        <Icon name="error" size={20} className="text-danger" />
        <p className="text-body">{message}</p>
      </PremiumCard>
    </FadeSlideIn>
  );
}

export function AuthSubmit({ label, busy }: { label: string; busy: boolean }) {
  return (
    <PremiumButton type="submit" disabled={busy} aria-busy={busy} className="w-full text-surface-low">
      {busy ? <Spinner size={22} /> : label}
    </PremiumButton>
  );
}

export function AuthSwitch({ prompt, action, href, disabled }: { prompt: string; action: string; href: string; disabled: boolean }) {
  return (
    <p className="mt-3 flex flex-wrap items-center justify-center gap-1 text-caption text-muted">
      {prompt}
      <Link
        href={href}
        replace
        aria-disabled={disabled}
        className={cx('rounded-chip px-2 py-1 text-sm font-medium text-green hover:bg-green/10', disabled && 'pointer-events-none opacity-50')}
      >
        {action}
      </Link>
    </p>
  );
}
