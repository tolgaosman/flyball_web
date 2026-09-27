@AGENTS.md

# Flyball frontend — notes for Claude

See [README.md](README.md) for structure and conventions. The original Flutter
app (`D:\Documents\GitHub\flyball\frontend` on the author's machine) is the
design/behaviour spec — read the matching Dart screen before changing one.

- Compose classes with `cx()` (tailwind-merge aware of the custom type-scale
  utilities); reuse `PremiumCard` / `PremiumButton` instead of restyling.
- Never chain two scale animations on one element; use a single keyframed
  animation (see `SuccessPop`).
- Every user-facing string goes in `messages/en.json` AND `messages/tr.json`.
- Don't edit `src/shared/*.json` — edit `../backend/resources/shared` and run
  `npm run sync-shared`.
- Test UI flows with mocked `/api/*` responses (Playwright `page.route`)
  rather than live Gemini calls; the key's quota is small.
