# Flyball — web

Football trivia, played together: **Football XOX**, **2 Team 1 Player** and
**1 Team 1 Country** (Footballdle coming soon). Every answer, board and round
comes from a live, cached Gemini search grounded with Google Search — there is
no player database.

A web rebuild of the Flyball Flutter app:

| Folder | What | Docs |
|---|---|---|
| [`frontend/`](frontend/) | Next.js + TypeScript website | [frontend/README.md](frontend/README.md) |
| [`backend/`](backend/) | Laravel API: AI engine, cache, accounts | [backend/README.md](backend/README.md), [API](backend/docs/api.md), [deployment](backend/docs/deploy.md) |

Quick start: set up and run the backend (port 8000), then `npm run dev` in
`frontend/` and open http://localhost:3000.
