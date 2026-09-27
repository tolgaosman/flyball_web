'use client';

import { useEffect, useState } from 'react';
import { fetchHealth } from './api';

let healthCheck: Promise<{ aiConfigured: boolean } | null> | null = null;

/**
 * 'missing' only when the server positively reports no Gemini key; an
 * unreachable server is left to each screen's own error/retry state.
 */
export function useAiStatus(): 'checking' | 'ready' | 'missing' {
  const [status, setStatus] = useState<'checking' | 'ready' | 'missing'>('checking');

  useEffect(() => {
    let active = true;
    healthCheck ??= fetchHealth().then((h) => {
      if (!h) healthCheck = null;
      return h;
    });
    void healthCheck.then((h) => {
      if (active) setStatus(h && !h.aiConfigured ? 'missing' : 'ready');
    });
    return () => {
      active = false;
    };
  }, []);

  return status;
}
