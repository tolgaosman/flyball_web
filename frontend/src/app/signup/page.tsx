'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { AuthErrorBanner, AuthField, AuthPage, AuthSubmit, AuthSwitch, authErrorMessage } from '@/components/auth/AuthForm';
import { useAuthSubmit } from '@/components/auth/useAuthSubmit';
import { WelcomeBanner } from '@/components/auth/WelcomeBanner';
import { AccountErrors, AccountRules, validatePassword, validateUsername } from '@/lib/accountRules';
import { useSession } from '@/lib/session';

type Field = 'username' | 'displayName' | 'password' | 'confirm';

export default function SignupPage() {
  const t = useTranslations();
  const session = useSession();
  const { busy, errorCode, welcomed, run } = useAuthSubmit();
  const [values, setValues] = useState<Record<Field, string>>({ username: '', displayName: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const set = (field: Field) => (value: string) => setValues((v) => ({ ...v, [field]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const username = values.username.trim();
    const next: Partial<Record<Field, string>> = {
      username: !username
        ? t('authUsernameRequired')
        : validateUsername(username)
          ? authErrorMessage(t, AccountErrors.invalidUsername)
          : undefined,
      password: !values.password
        ? t('authPasswordRequired')
        : validatePassword(values.password)
          ? authErrorMessage(t, AccountErrors.weakPassword)
          : undefined,
      confirm: values.confirm === values.password ? undefined : t('authPasswordsDontMatch'),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    void run(() => session.register(username, values.password, values.displayName.trim()));
  };

  const field = (name: Field) => ({ value: values[name], onChange: set(name), error: errors[name], disabled: busy });

  return (
    <AuthPage title={t('authSignUpTitle')} icon="emoji_events" headline={t('authSignUpHeadline')} subtitle={t('authSignUpSubtitle')}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <AuthField
          label={t('authUsernameLabel')}
          icon="alternate_email"
          autoComplete="username"
          maxLength={AccountRules.username.maxLength}
          autoFocus
          {...field('username')}
        />
        <AuthField
          label={t('authDisplayNameLabel')}
          icon="badge"
          autoComplete="nickname"
          maxLength={AccountRules.displayName.maxLength}
          {...field('displayName')}
        />
        <AuthField
          label={t('authPasswordLabel')}
          icon="lock"
          type="password"
          autoComplete="new-password"
          maxLength={AccountRules.password.maxLength}
          {...field('password')}
        />
        <AuthField
          label={t('authConfirmPasswordLabel')}
          icon="lock"
          outline
          type="password"
          autoComplete="new-password"
          maxLength={AccountRules.password.maxLength}
          {...field('confirm')}
        />
        {errorCode && (
          <div className="mt-1">
            <AuthErrorBanner message={authErrorMessage(t, errorCode)} />
          </div>
        )}
        {welcomed && <WelcomeBanner name={welcomed.displayName} />}
        <div className="mt-3">
          <AuthSubmit label={t('authSignUpButton')} busy={busy} />
        </div>
        <AuthSwitch prompt={t('authHaveAccount')} action={t('authGoToSignIn')} href="/login" disabled={busy} />
      </form>
    </AuthPage>
  );
}
