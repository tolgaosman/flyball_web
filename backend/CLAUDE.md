# Flyball backend — notes for Claude

Laravel 13 API; see [README.md](README.md) for architecture and
[docs/api.md](docs/api.md) for the contract the Next.js frontend relies on.

- The AI engine in `app/Flyball/Ai` is a port of the original Dart
  `flyball_core` package (`D:\Documents\GitHub\flyball\packages\flyball_core`
  on the author's machine). Keep prompts verbatim and behaviour identical
  unless deliberately changing the product.
- Never add static/fallback player data. No answer → `null` → 502; Gemini 429 →
  `GeminiQuotaExceededException` → 429. Never catch the quota exception inside
  a retry loop (only `AnswerFinder`'s verify step and `FlyballService::topUp`
  may swallow it).
- `resources/shared/*.json` is the single source of truth for the catalogue and
  account rules, also consumed by the frontend. After editing, run
  `npm run sync-shared` in `../frontend`.
- Tests use `Tests\Support\ScriptedTransport` — never hit the real Gemini API
  in tests (quota is small).
- Run tests with `php artisan test`. On this Windows machine PHP lives at
  `%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe`
  (Composer: `php <that dir>\composer\composer.phar`).
- Must stay PHP 8.3 compatible (no `array_any` etc.).
