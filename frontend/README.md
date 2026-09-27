# Flyball — frontend (Next.js)

The website for [flyball_web](../README.md): Football XOX, 2 Team 1 Player,
1 Team 1 Country (and a Footballdle "coming soon" page), ported from the
Flutter app with its "Night Pitch" design — warm charcoal, pitch green and
trophy gold, Space Grotesk headings, soft diffuse shadows, spring motion.

It is a full-screen, responsive site: purpose-built landscape layouts from
1024 px, and the Flutter phone layouts below that.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

The dev server proxies `/api/*` and `/health` to the Laravel backend at
`BACKEND_URL` (default `http://127.0.0.1:8000`) — start the backend first (see
[../backend/README.md](../backend/README.md)). The browser only ever talks to
its own origin; the Gemini key never reaches it.

| Script | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js (runs `sync-shared` first) |
| `npm run test` | Vitest unit tests |
| `npm run lint`, `npm run typecheck` | ESLint, `tsc --noEmit` |
| `npm run sync-shared` | copy `../backend/resources/shared/*.json` into `src/shared/` |

Production: `npm run build && npm run start` behind nginx — see
[../backend/docs/deploy.md](../backend/docs/deploy.md).

## Layout

```
src/app/                 one folder per route: / (home), xox (lobby), xox/play, two-team-one-player,
                         one-team-one-country, footballdle, login, signup
src/components/ui/       design system: PremiumCard, PremiumButton, motion (FadeSlideIn, SuccessPop),
                         states (loading/empty/error/AI views), Sheet, Dialog, PitchBackdrop, Icon
src/components/art/      ClubLogo, CountryFlag, LeagueBadge, TrophyImage, FactorImage, Monogram
src/components/game/     XoxBoard, AnswersSheet, PartyGame, SlotCard / ScorePanel / EditNameDialog
src/components/auth/     auth form pieces
src/game/                pure game logic: xox.ts (state machine), roundQueue.ts (1 round prefetched)
src/lib/                 api.ts (backend client), session.tsx, art.ts, catalog.ts, text.ts, accountRules.ts
src/shared/              catalogue + account rules synced from the backend (do not edit here)
src/i18n/, messages/     next-intl: en.json + tr.json (from the Flutter .arb files)
```

## Things worth knowing

- **AI states** — every AI call can end in: *not configured* (`/health` says
  no key), *AI LIMIT REACHED* (HTTP 429, hourglass), *AI UNAVAILABLE* (anything
  else, with Retry), or *unverified* (the verify pass failed; red warning in
  the answers panel). `lib/api.ts` maps responses to `AiUnavailableError`
  with a `quotaExceeded` flag.
- **Design tokens** live in `src/app/globals.css` (`@theme`), ported 1:1 from
  the Flutter `app_colors.dart` / `app_theme.dart`. Use `cx()` for class
  names — it merges conflicting Tailwind classes, so callers can override a
  component's padding or colours.
- **Motion** — `SuccessPop` is ONE keyframed scale animation (1 → 1.1 → 1).
  Never chain two scale animations on the same element: they compose
  multiplicatively and leave it oversized (a bug the Flutter app hit).
  Presses use a stiff spring; `prefers-reduced-motion` is respected.
- **Art** — club / league / trophy images come from TheSportsDB's keyless API
  (browser fetch; it sends CORS headers), flags from flagcdn.com. Lookups are
  cached in localStorage for 30 days — **only successful ones**, so a
  transient failure never locks in the monogram fallback. Art is not fetched
  while a slot is spinning.
- **i18n** — English and Turkish. The locale comes from the `flyball.locale`
  cookie (the EN/TR toggle), else the browser language. Use `upperFor()` from
  `lib/text.ts` to uppercase names (Turkish `i` → `İ`), and `foldContains()`
  for accent-insensitive search. New strings go in BOTH `messages/*.json`.
- **Accounts** — the session is an httpOnly cookie set by Laravel; JS never
  sees the token. `SessionProvider` caches only the public user profile for an
  instant restore and re-checks `/api/auth/me` in the background.
- **Gemini quota is small** — pages guard their first fetch with a ref so
  React StrictMode's double effects in dev don't build two boards.
