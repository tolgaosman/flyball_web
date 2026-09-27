'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { AuthErrorBanner, AuthField, AuthPage, AuthSubmit, AuthSwitch, authErrorMessage } from '@/components/auth/AuthForm';
import { useAuthSubmit } from '@/components/auth/useAuthSubmit';
import { WelcomeBanner } from '@/components/auth/WelcomeBanner';
import { AccountRules } from '@/lib/accountRules';
import { useSession } from '@/lib/session';

export default function LoginPage() {
  const t = useTranslations();
  const session = useSession();
  const { busy, errorCode, welcomed, run } = useAuthSubmit();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = {
      username: username.trim() ? undefined : t('authUsernameRequired'),
      password: password ? undefined : t('authPasswordRequired'),
    };
    setErrors(next);
    if (next.username || next.password) return;
    void run(() => session.login(username.trim(), password));
  };

  return (
    <AuthPage title={t('authSignInTitle')} icon="sports_soccer" headline={t('authSignInHeadline')} subtitle={t('authSignInSubtitle')}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <AuthField
          label={t('authUsernameLabel')}
          icon="person"
          value={username}
          onChange={setUsername}
          error={errors.username}
          autoComplete="username"
          maxLength={AccountRules.username.maxLength}
          disabled={busy}
          autoFocus
        />
        <AuthField
          label={t('authPasswordLabel')}
          icon="lock"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
          maxLength={AccountRules.password.maxLength}
          disabled={busy}
        />
        {errorCode && (
          <div className="mt-1">
            <AuthErrorBanner message={authErrorMessage(t, errorCode)} />
          </div>
        )}
        {welcomed && <WelcomeBanner name={welcomed.displayName} />}
        <div className="mt-3">
          <AuthSubmit label={t('authSignInButton')} busy={busy} />
        </div>
        <AuthSwitch prompt={t('authNoAccount')} action={t('authGoToSignUp')} href="/signup" disabled={busy} />
      </form>
    </AuthPage>
  );
}
