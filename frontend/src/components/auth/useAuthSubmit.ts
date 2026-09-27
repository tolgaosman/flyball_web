'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AccountError } from '@/lib/api';
import type { AccountUser } from '@/lib/types';

const WELCOME_MS = 900;

/** Busy/error/welcome state for the auth forms; on success shows the welcome line, then returns home. */
export function useAuthSubmit() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [welcomed, setWelcomed] = useState<AccountUser | null>(null);

  const run = async (action: () => Promise<AccountUser>) => {
    (document.activeElement as HTMLElement | null)?.blur();
    setBusy(true);
    setErrorCode(null);
    try {
      const user = await action();
      setWelcomed(user);
      setTimeout(() => router.push('/'), WELCOME_MS);
    } catch (e) {
      setErrorCode(e instanceof AccountError ? e.code : 'unknown');
      setBusy(false);
    }
  };

  return { busy: busy || welcomed !== null, errorCode, welcomed, run };
}
