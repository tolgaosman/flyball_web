'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as api from './api';
import type { AccountUser } from './types';

/**
 * The signed-in account. The session token itself is an httpOnly cookie
 * (never visible here); only the public user profile is cached, so the app
 * restores instantly and re-checks /api/auth/me in the background.
 */

const STORAGE_KEY = 'flyball.session.user';

interface SessionValue {
  user: AccountUser | null;
  login: (username: string, password: string) => Promise<AccountUser>;
  register: (username: string, password: string, displayName: string) => Promise<AccountUser>;
  logout: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

function readCachedUser(): AccountUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AccountUser) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(user: AccountUser | null) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode / blocked storage: the session still works, it just isn't restored instantly.
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AccountUser | null>(null);

  const setUser = useCallback((next: AccountUser | null) => {
    setUserState(next);
    writeCachedUser(next);
  }, []);

  useEffect(() => {
    // Restoring from localStorage has to wait for the client, so it happens
    // after hydration rather than during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserState(readCachedUser());
    api.me().then(setUser, () => {
      // Offline: keep the cached account rather than signing out.
    });
  }, [setUser]);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      login: async (username, password) => {
        const signedIn = await api.login(username, password);
        setUser(signedIn);
        return signedIn;
      },
      register: async (username, password, displayName) => {
        const signedIn = await api.register(username, password, displayName);
        setUser(signedIn);
        return signedIn;
      },
      logout: () => {
        setUser(null);
        api.logout().catch(() => {});
      },
    }),
    [user, setUser],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside <SessionProvider>');
  return session;
}
