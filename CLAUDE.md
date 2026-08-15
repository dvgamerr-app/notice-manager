# LINE Manager project memory

This file is the canonical instruction and architecture reference for every coding
agent working in this repository.

## Non-negotiable rules

- Use Bun for installing packages, scripts, tests, builds, and runtime. Do not add
  npm, pnpm, yarn, Node-only CLI workflows, or a second lockfile.
- Use ESM JavaScript unless the user explicitly asks for TypeScript.
- All application schema changes must be Kysely migrations in `migrations/`.
  Never create or alter application tables ad hoc during request handling.
- Both PostgreSQL and SQLite are supported. Keep migrations and queries portable:
  JSON is stored as text, timestamps are ISO-8601 text, and booleans use `0`/`1`.
- Preserve user secrets. Never print `.env`, channel access tokens, channel
  secrets, LIFF access tokens, or session tokens.
- Run build, development, and project runtime commands in a visible PowerShell 7
  session with `Start-Transcript`, and read the same transcript when checking the
  result. Never launch these sessions with `-NoExit`; the terminal must close
  automatically after the command exits or is stopped.
- `CLAUDE.md` is the source of truth. Keep it updated whenever architecture,
  setup, constraints, routes, or operational behavior changes.

## Product model

- One LINE Login channel hosts one LIFF dashboard.
- One administrator LINE account owns the installation and can register many
  LINE Messaging API bots.
- Each bot has its own channel access token, channel secret, bot user ID, and
  webhook endpoint.
- Bot credentials are entered and verified once, then reused server-side.
- Chats are discovered only from valid LINE webhook events. A chat can be a
  `user`, `group`, or `room`, and can be registered/unregistered in the dashboard.
- Test sends validate the message through LINE before push and are recorded in
  `managed_delivery`.
- The dashboard has four bot workspaces: Rooms, Monitor, API Keys, and Settings.
  Rooms supports aliasing, registration, profile refresh, group/room leave,
  multi-select sends, plain text, and raw LINE message JSON.
- External clients use bot-scoped API keys. Only a SHA-256 key hash is stored;
  the raw `lm_live_...` value is shown exactly once and can target only active,
  registered chats belonging to that bot.

## LINE platform constraints

- LIFF apps belong to LINE Login channels. New LIFF apps cannot be created on
  Messaging API channels.
- Put LINE Login and Messaging API channels under the same provider when the
  service needs the same LINE user ID across channels.
- A group or multi-person chat can contain only one LINE Official Account at a
  time. Enable "Allow bot to join group chats" per Messaging API channel.
- A webhook URL must be public HTTPS. `PUBLIC_BASE_URL` is used to build
  `/webhooks/line/:service`.
- Always verify the exact raw body with HMAC-SHA256 and the bot's channel secret.
  Reject missing signatures.
- Use `webhookEventId` for idempotency because LINE may redeliver events.
- A LIFF access token is short-lived and must be verified server-side. The
  verification response's `client_id` must equal `LINE_LOGIN_CHANNEL_ID`.
- Never send a Messaging API channel access token to the browser.
- Encrypt Messaging API channel access tokens and channel secrets at rest using
  AES-256-GCM and `CREDENTIAL_ENCRYPTION_KEY`. `BETTER_AUTH_SECRET` is accepted
  only as a migration fallback. Unprefixed legacy values remain readable.

## Authentication

- `POST /auth/liff` verifies the LIFF token with LINE, checks its channel ID,
  obtains the profile, then returns an opaque local session.
- Only the SHA-256 hash of a local session token is stored.
- Set `LINE_ADMIN_USER_IDS` in production. If it is empty, the first valid LIFF
  user atomically claims `app_setting.owner_line_user_id`; all other users are
  rejected. If the allowlist is set, the first valid allowlisted user still
  becomes the installation's single owner.
- Development bypass requires both a non-production `NODE_ENV` and
  `DEV_AUTH_BYPASS=true`; the frontend separately requires
  `VITE_DEV_AUTH_BYPASS=true`.
- With `NODE_ENV=development`, the server renders the LIFF entry page directly
  at `/` for local browser checks. LIFF login still uses the HTTPS Endpoint URL
  configured in LINE Developers because LINE doesn't accept HTTP localhost as
  a LIFF Endpoint/callback. Without the explicit frontend development auth
  bypass, opening LIFF on localhost shows a blocking tunnel notice linked to
  `PUBLIC_BASE_URL` instead of starting LINE Login. Other environments keep the
  canonical dashboard path at `/liff/`.

## Database and migrations

- `lib/db.js` detects PostgreSQL or SQLite from `DATABASE_URL`.
- PostgreSQL URLs use Kysely's `PostgresDialect` with `pg`.
- `sqlite:`, `file:`, and `:memory:` use Bun's native `bun:sqlite` through the
  small compatibility adapter in `lib/db.js`.
- Run migrations with `bun run migrate`; server startup also calls
  `migrateToLatest()` safely.
- Current core tables:
  `app_setting`, `app_user`, `app_session`, `managed_bot`, `managed_chat`,
  `managed_webhook_event`, `managed_delivery`, `managed_api_key`, and
  `managed_audit_log`. The `managed_` prefix is deliberate so migrations can
  coexist with the legacy `line_*` tables.
- `POST /api/bots/import-legacy` is the supported bridge from the old
  `line_bot` table. It verifies every old token with LINE, encrypts credentials,
  and never returns secrets.

## Source map

- `index.js`: Elysia bootstrap, security headers, static LIFF assets, migrations.
- `api/route.js`: public webhook/auth routes and authenticated management routes.
- `api/management.js`: bot, webhook configuration, chat, and test-send handlers.
- `api/external.js`: bot-scoped API-key endpoints with per-process rate limiting.
- `api/line-bot/index.js`: raw signed webhook ingestion and chat discovery.
- `lib/auth.js`: LIFF verification, owner policy, and reusable sessions.
- `lib/sdk-line.js`: Messaging API client and signature verification.
- `lib/secrets.js`: credential encryption/decryption at the database boundary.
- `lib/api-keys.js`, `lib/delivery.js`, `lib/audit.js`: external authorization,
  shared delivery records, and operation audit trail.
- `migrations/`: ordered Kysely migrations.
- `liff/src/`: React LIFF dashboard.
- `liff/src/components/`: shared page shell, status/notice feedback, and loading
  primitives. Reuse these before duplicating JSX or Tailwind utility groups.

## Required verification before handoff

Run with Bun:

```bash
bun run typecheck
bun test
bun run build:ui
```

Also run `bun run migrate` against SQLite (at least `:memory:` during automated
verification). When PostgreSQL credentials are available, run the same migrations
there without exposing the connection string.

## Optimization log

### 2026-08-02

- Consolidated repeated loading indicators, error alerts, credential visibility
  controls, and monitor record containers into shared JSX implementations.
- Removed one presentation-only header wrapper from every dashboard page, one
  bot-summary wrapper, and one nested wrapper from every rendered delivery row.
- Reduced native JSX start tags in source from 239 to 214 (25 fewer, 10.5%) while
  preserving the existing labels, actions, request flow, and Tailwind appearance.
- Memoized the token-bound API client and stabilized bot reload callbacks so
  effects do not capture a stale client or recreate it on unrelated renders.
- Production LIFF JavaScript fell from 396.49 kB to 395.19 kB before gzip.
- Verification passed with frozen Bun dependencies, TypeScript checks, 8 tests,
  a production LIFF build, and both migrations against SQLite `:memory:`.
- `bun audit` still reports one high-severity transitive React Router advisory.
  The latest compatible 7.x release remains inside the advisory range, so a
  breaking router upgrade requires a separate compatibility pass.
