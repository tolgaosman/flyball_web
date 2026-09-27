# Flyball — backend (Laravel)

The API behind [flyball_web](../README.md): the Gemini-powered answer engine,
the answer/round/board cache, and username + password accounts. It is a
faithful port of the Dart backend and `flyball_core` package from the original
Flutter app; the prompts and search logic are the product, so they are copied,
not reinvented.

**Everything is AI-first.** There is no player database. Every answer, every
XOX board and every party round comes from a live Gemini call grounded with
Google Search (cached for a while). Nothing ever falls back to fake data — if
the AI can't answer, the API says so (`502`, or `429` when the quota is gone).

- API contract: [docs/api.md](docs/api.md)
- Production setup (nginx, php-fpm, queue worker): [docs/deploy.md](docs/deploy.md)

## Requirements

PHP 8.3+ with `pdo_sqlite`, `sqlite3`, `openssl`, `mbstring`, `fileinfo`,
`curl` and `intl`; Composer 2. On Windows, PHP also needs a CA bundle
(`curl.cainfo` / `openssl.cafile` in `php.ini`, e.g. https://curl.se/ca/cacert.pem),
or every HTTPS call to Gemini fails silently as "AI unreachable".

## Local setup

```bash
composer install
cp .env.example .env          # then set GEMINI_API_KEY (https://aistudio.google.com/apikey)
php artisan key:generate
touch database/flyball_app.sqlite database/flyball_cache.sqlite
php artisan migrate

# API on :8000 (the frontend dev server proxies /api and /health here)
PHP_CLI_SERVER_WORKERS=4 php artisan serve --no-reload
# background buffer refills (only needed when FLYBALL_BUFFER_TARGET > 0)
php artisan queue:work --timeout=900 --tries=1
```

`--no-reload` is required for `PHP_CLI_SERVER_WORKERS` to take effect; without
it the dev server handles one request at a time, and a 45-second AI call blocks
every other request.

## Tests

```bash
php artisan test
```

Tests never call Gemini: `tests/Support/ScriptedTransport.php` replays canned
responses (or a `'quota'` 429) in order. They cover the ported Dart suites —
parser, two-phase search, board builder, round picker, cache store, service,
routes and auth.

## Configuration (`.env`)

| Variable | Default | Meaning |
|---|---|---|
| `GEMINI_API_KEY` | — | Required for any AI feature. `/health` reports `aiConfigured: false` without it. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model for every call. |
| `GEMINI_TIMEOUT` | `60` | Seconds per Gemini call. |
| `FLYBALL_BUFFER_TARGET` | `3` | Ready rounds (per kind) and boards kept warm by the queue worker. `0` = build on request only (slower, less quota). |
| `DB_DATABASE` | `database/flyball_app.sqlite` | Accounts, sessions, queue. |
| `AI_CACHE_DB_DATABASE` | `database/flyball_cache.sqlite` | The disposable AI cache. |
| `CACHE_STORE` | `file` | Locks for in-flight dedupe + the login throttle. |
| `APP_TIMEZONE` | `UTC` | "Today" in prompts and the answer-cache TTL window. |

## How it works

```
app/Flyball/Catalog/   clubs / countries / competitions (from resources/shared/*.json)
app/Flyball/Model/     Factor, FactorPool (axis rules), Board, Round, AnswerResult
app/Flyball/Ai/        Prompts, GeminiTransport, GeminiParser, AnswerFinder, BoardBuilder, RoundPicker
app/Services/          FlyballService (cache-then-AI), AiCacheStore, AuthService, AccountRules
app/Jobs/TopUpBuffer   background refill of ready rounds/boards
app/Http/              AiController, AuthController, ResolveSessionUser, RequireJson
resources/shared/      the catalogue + account rules — ALSO read by the Next.js frontend
```

**Finding answers** ([AnswerFinder](app/Flyball/Ai/AnswerFinder.php)) — two grounded calls:
1. *Recall*: a deliberately wide net; the model is told not to filter, so it
   never drops a correct-but-uncertain name.
2. *Verify*: the candidates go back and only names a source links to BOTH
   conditions survive.

A failed or empty recall returns `null` (nothing to show). A failed verify —
including a quota hit — falls back to the unchecked recall list with
`verified: false`, and the UI shows an "unverified" warning.

**XOX boards** ([BoardBuilder](app/Flyball/Ai/BoardBuilder.php)) draw 3 + 3
factors obeying `FactorPool::axesAreValid` (no nationality on both axes, no
international tournament on both axes, never Euros with Copa América, no
impossible nationality × tournament cell), then ONE call fills all 9 cells
with example players. Empty cells trigger up to 3 attempts, each swapping the
factor responsible for the most empty cells (a tie swaps the row).

**Party rounds** ([RoundPicker](app/Flyball/Ai/RoundPicker.php)) draw a club
pair (65% from the same league) or a club + nationality, search it, and only
hand out a round with confirmed answers (4 attempts).

**Quota** — Gemini's HTTP 429 becomes `GeminiQuotaExceededException`, which
is deliberately *not* a `null` result: it escapes every retry loop instantly
(retrying a call that must fail just burns what quota is left) and becomes a
`429 {"error":"AI quota exceeded — try again later"}` response, so the UI can
say "AI LIMIT REACHED" instead of "unreachable".

**Speed** ([FlyballService](app/Services/FlyballService.php)) — answers are
cached (2 days during transfer windows, 7 otherwise); identical concurrent
searches share one Gemini call through a cache lock; and a queued job keeps a
few ready rounds/boards in the cache so most requests are instant.

**Accounts** ([AuthService](app/Services/AuthService.php)) — bcrypt passwords,
43-character random session tokens stored only as SHA-256, 90-day sessions in
an httpOnly `SameSite=Lax` cookie (never in a response body), 5 failed logins
per username lock that username for 15 minutes, identical errors for unknown
user vs wrong password. Username/password rules live in
`resources/shared/account_rules.json`, shared with the frontend form.

## Changing things

- **Catalogue / account rules**: edit `resources/shared/*.json`, then run
  `npm run sync-shared` in `../frontend` (its tests fail until you do).
- **Prompts**: [app/Flyball/Ai/Prompts.php](app/Flyball/Ai/Prompts.php) — tuned
  text; change deliberately.
- **New factor type**: add to `FactorType`, `FactorPool::allFactors()` and the
  axis rules, and to `FactorImage` in the frontend.
