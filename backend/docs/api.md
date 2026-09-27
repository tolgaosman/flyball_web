# Flyball API

Same-origin JSON API. In production nginx sends `/api/*` and `/health` to
Laravel; in development the Next.js dev server proxies them. Errors always
look like `{"error": "<code or message>"}`.

TypeScript mirrors of these shapes: `frontend/src/lib/types.ts`.

## Shapes

```ts
Factor       { type: 'playedLeague' | 'wonLeague' | 'wonInternational' | 'team' | 'nationality',
               label: string,   // header text AND the AI condition, e.g. "Played in Serie A", "France"
               value: string }  // catalogue value: league / tournament / club / country
AnswerResult { players: string[], verified: boolean }   // verified:false = verify pass failed, unchecked list
Round        { kind: 'twoTeam' | 'teamCountry', conditionA: string /* club */,
               conditionB: string /* club or country */, answers: AnswerResult }
Board        { rows: Factor[3], columns: Factor[3], cellExamples: string[9][] }  // index row*3+col
User         { id: number, username: string, displayName: string, createdAt: number /* epoch ms */ }
```

## AI

AI endpoints can take a while on a cache miss (a live board or round is often
~45 s; the server allows up to 180 s).

| Status | Body | Meaning |
|---|---|---|
| 429 | `{"error":"AI quota exceeded — try again later"}` | Gemini's usage limit is exhausted. Retrying won't help until it resets. |
| 502 | `{"error":"AI search failed — try again"}` (answers) / `{"error":"AI unreachable — try again"}` (rounds, boards) | Network, timeout, bad response, or no API key. |

### `GET /health`
`200 {"status":"ok","aiConfigured":true}` — `aiConfigured` is false when the
server has no `GEMINI_API_KEY`.

### `POST /api/answers`
Body `{"kind": "two_team" | "team_country" | "xox", "a": string, "b": string}`.

- `two_team`: two club names (cached, order-independent).
- `team_country`: club, country (cached).
- `xox`: the two factor **labels** (not cached; the board already carries a preview).

Validation (checked in this order, all `400`):
`invalid_json_body` → `missing "a" or "b"` → `invalid "kind" (expected two_team | team_country | xox)`
→ `unknown condition`. Conditions must be catalogue values (club / country
names, or a real XOX factor label): they are embedded in Gemini prompts, so
free text is refused rather than forwarded.

AI routes are limited to 30 requests per minute per IP
(`429 {"error":"too_many_requests"}`); auth routes to 20 per minute
(`429 {"error":"too_many_attempts"}`).

`200` → `AnswerResult`.

### `GET /api/rounds/two-team`, `GET /api/rounds/team-country`
`200` → `Round` whose answers are already confirmed (buffered rounds are served
first, oldest first, each only once).

### `GET /api/xox/board`
`200` → `Board`.

## Accounts

The session lives in the `flyball_session` cookie (httpOnly, `SameSite=Lax`,
`Secure` over HTTPS, 90 days). The token is never returned in a body.
`POST` auth routes require `Content-Type: application/json` (`415` otherwise) —
a CSRF guard.

| Route | Body | Success | Errors |
|---|---|---|---|
| `POST /api/auth/register` | `{username, password, displayName?}` | `201 {user}` + cookie | `400 invalid_json_body \| invalid_username \| weak_password \| invalid_display_name`, `409 username_taken` |
| `POST /api/auth/login` | `{username, password}` | `200 {user}` + cookie | `401 invalid_credentials`, `429 too_many_attempts` |
| `POST /api/auth/logout` | `{}` | `204`, cookie cleared (always) | — |
| `GET /api/auth/me` | — | `200 {user}` | `401 unauthorized` |

Rules (`resources/shared/account_rules.json`): username 3–20 of `A-Z a-z 0-9 _ .`
(trimmed, unique case-insensitively, login is case-insensitive), password
8–128, display name 1–24 after trimming (defaults to the username). Five
failed logins for a username lock it for 15 minutes; unknown user and wrong
password return the same error.
