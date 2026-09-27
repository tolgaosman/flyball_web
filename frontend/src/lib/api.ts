import type { AccountUser, AnswerKind, AnswerResult, Board, Round } from './types';

/**
 * The browser only ever talks to its own origin: /api/* is routed to Laravel
 * (nginx in production, Next rewrites in dev). The Gemini key never reaches here.
 */

/** A live AI answer failed. quotaExceeded = Gemini's usage limit (HTTP 429), not a connectivity problem. */
export class AiUnavailableError extends Error {
  constructor(readonly quotaExceeded = false) {
    super(quotaExceeded ? 'AI quota exceeded' : 'AI is unavailable');
  }
}

export class AccountError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

// Longer than the Flutter client's 35 s / 45 s: a live (unbuffered) round or
// board regularly takes ~45 s, and the server allows up to 180 s.
const ANSWERS_TIMEOUT_MS = 100_000;
const BUILD_TIMEOUT_MS = 150_000;
const ACCOUNT_TIMEOUT_MS = 15_000;

async function aiJson<T>(path: string, init: RequestInit, timeoutMs: number): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    throw new AiUnavailableError();
  }
  if (res.status === 429) throw new AiUnavailableError(true);
  if (!res.ok) throw new AiUnavailableError();
  try {
    return (await res.json()) as T;
  } catch {
    throw new AiUnavailableError();
  }
}

function isAnswerResult(value: unknown): value is AnswerResult {
  const v = value as AnswerResult | null;
  return !!v && Array.isArray(v.players) && v.players.every((p) => typeof p === 'string');
}

function normalizeAnswers(value: AnswerResult): AnswerResult {
  return { players: value.players, verified: value.verified ?? true };
}

export async function searchAnswers(kind: AnswerKind, a: string, b: string): Promise<AnswerResult> {
  const result = await aiJson<unknown>(
    '/api/answers',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, a, b }) },
    ANSWERS_TIMEOUT_MS,
  );
  if (!isAnswerResult(result)) throw new AiUnavailableError();
  return normalizeAnswers(result);
}

async function fetchRound(path: string): Promise<Round> {
  const round = await aiJson<Round>(path, {}, BUILD_TIMEOUT_MS);
  if (typeof round?.conditionA !== 'string' || typeof round.conditionB !== 'string' || !isAnswerResult(round.answers)) {
    throw new AiUnavailableError();
  }
  return { ...round, answers: normalizeAnswers(round.answers) };
}

export const fetchTwoTeamRound = () => fetchRound('/api/rounds/two-team');
export const fetchTeamCountryRound = () => fetchRound('/api/rounds/team-country');

export async function fetchBoard(): Promise<Board> {
  const board = await aiJson<Board>('/api/xox/board', {}, BUILD_TIMEOUT_MS);
  if (board?.rows?.length !== 3 || board.columns?.length !== 3) throw new AiUnavailableError();
  const cellExamples = Array.from({ length: 9 }, (_, i) => (board.cellExamples?.[i] ?? []).map(String));
  return { rows: board.rows, columns: board.columns, cellExamples };
}

/** null = the server is unreachable. */
export async function fetchHealth(): Promise<{ aiConfigured: boolean } | null> {
  try {
    const res = await fetch('/health', { signal: AbortSignal.timeout(10_000) });
    return res.ok ? ((await res.json()) as { aiConfigured: boolean }) : null;
  } catch {
    return null;
  }
}

async function accountRequest(path: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: init.method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      signal: AbortSignal.timeout(ACCOUNT_TIMEOUT_MS),
    });
  } catch {
    throw new AccountError('network');
  }
  if (res.status === 204) return {};
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new AccountError(typeof body.error === 'string' ? body.error : `http_${res.status}`);
  return body;
}

export async function register(username: string, password: string, displayName: string): Promise<AccountUser> {
  const payload: Record<string, string> = { username, password };
  if (displayName.trim()) payload.displayName = displayName;
  const body = await accountRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  return body.user as AccountUser;
}

export async function login(username: string, password: string): Promise<AccountUser> {
  const body = await accountRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  return body.user as AccountUser;
}

export async function logout(): Promise<void> {
  await accountRequest('/api/auth/logout', { method: 'POST', body: '{}' });
}

/** The signed-in user, or null when the session is missing/expired. Throws AccountError('network') when offline. */
export async function me(): Promise<AccountUser | null> {
  try {
    const body = await accountRequest('/api/auth/me');
    return body.user as AccountUser;
  } catch (e) {
    if (e instanceof AccountError && e.code === 'unauthorized') return null;
    throw e;
  }
}
