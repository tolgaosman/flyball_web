import { clubByName, competitionByName, type Club } from './catalog';

/**
 * Dynamic club / league / trophy art from TheSportsDB's free keyless API
 * (flags need no lookup — see catalog.flagUrl). Lookups are cached in
 * localStorage for 30 days, deduped while in flight and spaced 250 ms apart.
 */

const API_BASE = 'https://www.thesportsdb.com/api/v1/json/123';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_REQUEST_GAP_MS = 250;
const CACHE_VERSION = 'v2';

const inFlight = new Map<string, Promise<string | null>>();
let nextSlotAt = 0;

const LEAGUE_MATCHERS: Record<string, (l: string) => boolean> = {
  'Premier League': (l) => l.includes('premier league') && l.includes('english'),
  'La Liga': (l) => l.includes('la liga'),
  Bundesliga: (l) => l.includes('bundesliga'),
  'Serie A': (l) => l.includes('serie a'),
  'Ligue 1': (l) => l.includes('ligue 1'),
  'Süper Lig': (l) => l.includes('super lig'),
  'Roshn Saudi Pro League': (l) => l.includes('saudi'),
};

export function clubLogoUrl(clubName: string): Promise<string | null> {
  const club = clubByName(clubName);
  if (!club) return Promise.resolve(null);
  return cached(`${CACHE_VERSION}:club:${club.name}`, () => fetchClubBadge(club));
}

export function leagueBadgeUrl(leagueName: string): Promise<string | null> {
  const id = competitionByName(leagueName)?.sportsDbLeagueId;
  if (id == null) return Promise.resolve(null);
  return cached(`${CACHE_VERSION}:league_badge:${leagueName}`, () => fetchLeagueField(id, 'strBadge'));
}

export function trophyUrl(tournamentName: string): Promise<string | null> {
  const id = competitionByName(tournamentName)?.sportsDbLeagueId;
  if (id == null) return Promise.resolve(null);
  return cached(`${CACHE_VERSION}:trophy:${tournamentName}`, () => fetchLeagueField(id, 'strTrophy'));
}

function readCache(key: string): string | null | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const { url, ts } = JSON.parse(raw) as { url: string; ts: number };
    return Date.now() - ts < CACHE_TTL_MS ? url : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, url: string) {
  try {
    localStorage.setItem(key, JSON.stringify({ url, ts: Date.now() }));
  } catch {
    // Storage full or blocked: the image still shows, it just isn't remembered.
  }
}

function cached(key: string, fetcher: () => Promise<string | null>): Promise<string | null> {
  const hit = readCache(key);
  if (hit !== undefined) return Promise.resolve(hit);

  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = fetcher().then((url) => {
    // Only cache a real hit: caching a transient failure would lock the
    // monogram fallback in for the whole TTL.
    if (url) writeCache(key, url);
    return url;
  });
  inFlight.set(key, promise);
  void promise.finally(() => inFlight.delete(key));
  return promise;
}

/** Reserves the next 250 ms slot, so concurrent lookups queue instead of bursting. */
async function throttle() {
  const now = Date.now();
  const slot = Math.max(now, nextSlotAt);
  nextSlotAt = slot + MIN_REQUEST_GAP_MS;
  if (slot > now) await new Promise((r) => setTimeout(r, slot - now));
}

async function getJson(url: string): Promise<Record<string, unknown> | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      if (res.ok) return (await res.json()) as Record<string, unknown>;
    } catch {
      // retried once below, then treated as "no art"
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
  }
  return null;
}

interface SportsDbTeam {
  strSport?: string;
  strLeague?: string;
  strBadge?: string;
}

async function fetchClubBadge(club: Club): Promise<string | null> {
  await throttle();
  const body = await getJson(`${API_BASE}/searchteams.php?t=${encodeURIComponent(club.sportsDbName)}`);
  const teams = (body?.teams as SportsDbTeam[] | null) ?? [];
  const soccer = teams.filter((t) => t.strSport === 'Soccer');
  const matches = LEAGUE_MATCHERS[club.league];
  const best = soccer.find((t) => matches?.((t.strLeague ?? '').toLowerCase())) ?? soccer[0];
  return best?.strBadge || null;
}

async function fetchLeagueField(leagueId: number, field: 'strBadge' | 'strTrophy'): Promise<string | null> {
  await throttle();
  const body = await getJson(`${API_BASE}/lookupleague.php?id=${leagueId}`);
  const league = (body?.leagues as Record<string, string | null>[] | null)?.[0];
  return league?.[field] || null;
}
