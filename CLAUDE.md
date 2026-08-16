# Notice Manager agent guide

This file is the canonical technical and operational reference for agents working
in this repository. Read the current source and working tree before relying on
older conversation history; the repository can change between turns.

## Non-negotiable working rules

- Use Bun for dependency installation, scripts, tests, builds, and runtime. Do
  not introduce npm, pnpm, Yarn, Node-only workflows, or another lockfile.
- Use ESM JavaScript unless the user explicitly requests TypeScript.
- Make every application schema change through a Kysely migration in
  `migrations/`. Never create or alter application tables during request
  handling.
- Preserve PostgreSQL and SQLite compatibility. Store JSON and ISO timestamps as
  text and booleans as `0`/`1`.
- Never print `.env`, LINE credentials, LIFF tokens, local session tokens, raw API
  keys, or encryption material.
- Treat existing working-tree changes as user-owned unless their origin is known.
  Do not revert, overwrite, stage, or commit unrelated changes.
- Use `apply_patch` for source and documentation edits. Use Bun commands for
  generated build output.
- Run build, development, and runtime checks in PowerShell 7 with
  `Start-Transcript`, then inspect that transcript. Do not leave test processes
  listening on ports 3000 or 5173.
- Update this file when routes, architecture, environment requirements, build
  output, or operational behavior changes.
- When commits are requested, separate them by topic and exclude unrelated user
  changes.

## Current implementation status

The backend and Vite configuration contain the new proxy/build architecture:

- With `NODE_ENV=development`, Elysia proxies `/`, `/liff`, and `/liff/*` to
  `VITE_DEV_SERVER_URL`, defaulting to `http://127.0.0.1:5173`.
- Vite binds `127.0.0.1:5173` with `strictPort`, serves the app under `/liff/`,
  and keeps its HMR WebSocket on the same IPv4 endpoint to avoid localhost
  IPv4/IPv6 readiness mismatches on Windows.
- `bun run build:ui` writes production assets to `dist/liff`.
- Outside development, Elysia serves only `dist/liff`. If the build is missing,
  `/liff` returns 503 with an instruction to build the UI.
- The obsolete checked-in `public/liff` build has been removed.
- Development uses two explicit processes: `bun dev` watches the Elysia backend
  and formats its Pino JSON logs through `pino-pretty`; `bun dev:ui` starts Vite.
- Start both commands in separate terminals. Each process owns its own lifecycle
  and fails independently when its configured port is unavailable.

## Product model and UI behavior

- One LINE Login channel hosts the LIFF management dashboard.
- One administrator LINE account owns an installation and can manage multiple
  LINE Messaging API bots.
- The LIFF dashboard relies on LINE's host navigation and account context. It
  intentionally has no duplicate global header, in-content back/title row,
  administrator profile, or sign-out button.
- Legacy bot import is not part of the product and has no management route or UI.
- Each managed bot stores its own service slug, bot user ID, channel access token,
  channel secret, and webhook endpoint.
- Adding a bot verifies its Messaging API token with LINE, sets the channel's
  webhook endpoint to `${PUBLIC_BASE_URL}/line/:service`, reads the resulting
  webhook status, and only then persists the bot.
- Rooms are discovered from valid webhook events. New active sources are
  registered automatically; sending `/hi` explicitly registers the current chat
  and replies with confirmation. `/id` replies with the chat ID and source type.
- Chat names shown in Rooms come from LINE and are read-only. Pressing the whole
  chat card selects it. The room filter sits beside `Chats · n`.
- Each chat row has a right-aligned Leave/Rejoin icon. The control is a logical
  registration toggle. Leave does not
  remove the Official Account from LINE, so Join can enable the target again.
  The separate backend physical-leave endpoint still exists for groups/rooms;
  LINE provides no API that can make a bot join the chat again afterward.
- Rooms has one refresh control above the chat list. It refreshes LINE metadata
  for every chat; individual chat rows do not have refresh buttons.
- The message composer retains Text and raw JSON modes. JSON is selected by
  default and prefilled with a compact LINE Flex card (`bubble` size `micro`).
  Test sends validate the message with LINE before push and write a
  `managed_delivery` record.
- Successful Rooms actions use an auto-dismissing top-center toast. Errors stay
  inline so diagnostic details remain visible.
- External systems use bot-scoped `lm_live_...` API keys. Only SHA-256 hashes are
  stored, raw keys are shown once, and keys can target only active, registered
  chats belonging to their bot.

## LINE chat identity: critical invariant

Choose the push recipient strictly from `source.type`:

- `user` -> `source.userId`
- `group` -> `source.groupId`
- `room` -> `source.roomId`

Do not use `source.userId || source.groupId || source.roomId`. Group and room
message events can contain the sender's `userId`; choosing it first sends the
message to that person's private chat. The webhook upsert contains compatibility
logic that repairs a legacy group/room row using the correct source ID when the
next event arrives.

Selected values in the LIFF UI are internal `managed_chat.id` UUIDs. Management
handlers must resolve those rows under the selected bot and pass
`managed_chat.source_id` to LINE. Bulk sends must additionally require
`registered = 1` and `active = 1`.

## LINE authentication and credential handling

- `POST /auth/liff` verifies the LIFF access token with LINE, requires the
  returned `client_id` to equal `LINE_LOGIN_CHANNEL_ID`, fetches the profile, and
  returns an opaque local session.
- Only the SHA-256 hash of a local session token is stored.
- Configure `LINE_ADMIN_USER_IDS` in production. Without it, the first valid LIFF
  user atomically claims `app_setting.owner_line_user_id`; later users are
  rejected. With an allowlist, the first valid allowlisted user becomes the
  single owner.
- Development auth bypass requires both a non-production `NODE_ENV` and
  `DEV_AUTH_BYPASS=true`; the frontend separately requires
  `VITE_DEV_AUTH_BYPASS=true`.
- A Messaging API channel access token is not a LIFF token, Channel ID, or Channel
  Secret. Normalize copied access tokens by removing optional quotes, a leading
  `Bearer`, whitespace, and invisible format characters.
- If Get bot info returns authentication failure, safely call LINE's token
  verification endpoints and return only non-secret diagnostics such as token
  type, Channel ID, expiry, LINE status/reason, and request ID.
- Encrypt channel access tokens and channel secrets at rest with AES-256-GCM and
  `CREDENTIAL_ENCRYPTION_KEY`. `BETTER_AUTH_SECRET` is only a migration fallback.
  Unprefixed legacy ciphertext/plain values remain readable for migration.
- Production must fail when no credential encryption material is configured.
- Never send a Messaging API token or Channel Secret to the browser.

## LIFF, tunnels, and redirects

- LINE does not accept `http://localhost` as a LIFF Endpoint/callback. Real LIFF
  authentication requires a public HTTPS tunnel and the same current Endpoint
  URL in LINE Developers.
- Do not hardcode temporary ngrok or tunnl.gg hosts. `PUBLIC_BASE_URL` is the
  source for generated webhook URLs and the localhost tunnel notice.
- If LINE redirects to an old tunnel, first check the LIFF Endpoint URL and the
  callback parameters generated by the current page. A stale LINE console value
  cannot be fixed only by changing local React code.
- When real LIFF auth is opened on HTTP loopback without explicit frontend bypass,
  show the blocking tunnel notice instead of starting LINE login.
- LIFF responses use `Cache-Control: no-transform`; development proxy responses
  additionally use `no-store`. This reduces tunnel/CDN HTML transformation and
  unwanted Cloudflare beacon injection.
- A group or multi-person chat can contain only one LINE Official Account at a
  time. Enable “Allow bot to join group chats” on each Messaging API channel.

## Webhooks and messaging

- Primary webhook: `POST /line/:bot`.
- Compatibility alias: `POST /webhooks/line/:bot`.
- Webhook URLs must be public HTTPS and are generated from `PUBLIC_BASE_URL`.
- Verify HMAC-SHA256 against the exact raw request body and the bot's Channel
  Secret. Reject missing or invalid `x-line-signature`.
- Reject a webhook whose `destination` does not match the managed bot user ID.
- Use `webhookEventId` plus the database unique constraint for idempotency and
  support LINE redelivery.
- Validate push message payloads through LINE before sending.
- Persist delivery status, LINE request ID, response/error payload, timestamps,
  and audit events without storing or logging raw credentials.

## Public and authenticated routes

- `GET /health` — health check.
- `GET /app/config` — safe public configuration containing only the validated
  HTTPS `publicBaseUrl`.
- `POST /auth/liff`, `POST /auth/logout` — LIFF session lifecycle.
- `POST /line/:bot` — primary signed LINE webhook.
- `/api/bots...` — authenticated bot, webhook, quota, chat, delivery, API-key,
  audit, and test-send management routes.
- `GET /api/line`, `GET /api/line/:bot/room`, and
  `GET /api/line/:bot/history` are read-only compatibility aliases.
- `GET /v1/bots/:bot/chats` and
  `POST /v1/bots/:bot/chats/:chat/messages` use bot-scoped API keys and
  per-process rate limiting.

Refer to `api/route.js` before documenting an exact management route; do not copy
an old route list from conversation history.

## Database and migrations

- `lib/db.js` selects PostgreSQL for PostgreSQL URLs and Bun native SQLite for
  `sqlite:`, `file:`, and `:memory:` values.
- Default local database: `sqlite://./notice-manager.sqlite`.
- Run `bun run migrate`; startup also calls `migrateToLatest()` safely.
- Current migrations: `001_line_management.js`, `002_management_operations.js`,
  and `003_webhook_processing.js`.
- Webhook events use processing state and attempt counters so a failed event can
  be claimed again on LINE redelivery instead of being discarded as a duplicate.
- Core tables: `app_setting`, `app_user`, `app_session`, `managed_bot`,
  `managed_chat`, `managed_webhook_event`, `managed_delivery`,
  `managed_api_key`, and `managed_audit_log`.
- The `managed_` prefix deliberately avoids collisions with legacy `line_*`
  tables. Do not reintroduce legacy import behavior without an explicit request.

## Environment variables

- Runtime/network: `PORT`, `BASE_URL`, `PUBLIC_BASE_URL`, `CORS_ORIGINS`,
  `LOG_LEVEL`.
- Database: `DATABASE_URL`.
- LINE Login/LIFF: `LINE_LOGIN_CHANNEL_ID`, `VITE_LIFF_ID`, `VITE_API_URL`.
- Ownership/session: `LINE_ADMIN_USER_IDS`, `SESSION_DAYS`.
- Security: `CREDENTIAL_ENCRYPTION_KEY`.
- External API: `EXTERNAL_API_RATE_LIMIT`.
- Explicit local bypass: `DEV_AUTH_BYPASS`, `VITE_DEV_AUTH_BYPASS`.
- Development proxy: `VITE_DEV_SERVER_URL`.

Keep actual values in ignored environment files. Do not document or print them.

## Commands and build output

```powershell
bun install
bun run migrate
bun dev
bun dev:ui
bun run typecheck
bun test
bun run build:ui
bun run verify:build
bun run smoke:dev
bun run smoke:prod
bun start
```

- `bun dev` starts the backend watcher on port 3000 and formats Pino logs with
  `pino-pretty`.
- `bun dev:ui` starts Vite on port 5173; run it in a separate terminal.
- `bun run build:ui` creates ignored production output in `dist/liff`.
- `bun start` starts Elysia and serves the production build under `/liff/`.
- `bun run typecheck` checks the JavaScript/JSX source with `checkJs`; generated
  output, dependencies, and historical docs are excluded.
- `bun run check` runs typecheck, tests, the UI build, and build verification.
- `bun run smoke:dev` starts isolated Vite and Elysia servers, then verifies HMR
  proxying and application routes without a development orchestrator.
- `bun run smoke:prod` verifies the root redirect and production HTML/assets on
  an isolated in-memory database and port.

Docker copies the repository, installs frozen Bun dependencies, builds the UI,
and then starts the server. Because the image builds after `COPY`, ignored local
`dist` output is not required in source control.

## Source map

- `index.js` — migrations and Elysia startup.
- `app.js` — security headers, development Vite HTTP proxy, production dist
  serving, and top-level error handling.
- `api/route.js` — public, authentication, webhook, and management route wiring.
- `api/management/` — domain handlers for bots, chats, activity, API keys, and
  shared management concerns.
- `api/webhooks/line.js` — raw signed webhook ingestion, retryable idempotency, chat
  discovery/repair, `/hi`, and `/id`.
- `api/routes/external.js` — bot-scoped external API-key endpoints and rate limiting.
- `lib/auth.js` — LIFF verification, single-owner policy, and local sessions.
- `lib/sdk-line.js` — LINE API client, message normalization, token diagnostics,
  and signature verification.
- `lib/delivery.js` — shared validate/push/delivery/audit flow.
- `lib/secrets.js` — credential encryption and legacy read compatibility.
- `lib/db.js` — PostgreSQL/SQLite Kysely setup.
- `lib/logger.js` — shared structured Pino logger and credential redaction.
- `migrations/` — portable application schema.
- `scripts/smoke-*.js` and `scripts/verify-build.js` — repeatable runtime/build
  verification without production data.
- `src/` — React LIFF dashboard.
- `src/flex.js` — compact Flex card builder.
- `vite.config.js` — `/liff/` base, port 5173 HMR, API proxies, and
  `dist/liff` build output.

## Mistakes and lessons learned

1. **Wrong group recipient:** selecting the first available source ID chose a
   group sender's `userId`, causing a selected group message to be delivered to
   a private chat. Always branch on `source.type` and test a group event that
   contains both `groupId` and `userId`.
2. **Backend watch is not frontend HMR:** `bun --watch index.js` watches the
   backend dependency graph and serves compiled files; it cannot hot-reload
   `src`. Vite must be running and the browser must receive its HMR client.
3. **Development ownership must stay explicit:** `bun dev` owns only the backend
   and `bun dev:ui` owns only Vite. Keep two terminals open and diagnose each
   process directly instead of assuming one command supervises the other.
4. **Structured logs need a single boundary:** application code writes Pino JSON;
   only the interactive backend development command pipes it through
   `pino-pretty`. Production and automation retain machine-readable records.
5. **Missing dist should be explicit:** initializing the static plugin against a
   nonexistent output directory produced noisy `ENOENT` messages during tests.
   Check for `dist/liff` and return a clear 503 until the UI is built.
6. **UI wording was misread once:** “move the filter beside Chats” was initially
   interpreted as “add a duplicate-name filter.” For ambiguous layout requests,
   restate the exact placement and label before making a nontrivial UI choice.
7. **LINE Leave is not reversible by API:** physically removing an Official
   Account cannot be followed by a programmatic Join. The reversible UI control
   must toggle local registration instead.
8. **LINE redirects are console-sensitive:** localhost is not a valid LIFF
   callback, and stale tunnel redirects can come from the LINE Developers
   Endpoint configuration. Inspect the current callback URL before changing app
   routing.
9. **Credential fields are easy to confuse:** Channel Access Token and Channel
    Secret can be pasted into the opposite inputs. Verify token type safely and
    return diagnostics without echoing secrets.

## Required verification before handoff

Run all of the following with Bun:

```powershell
bun run typecheck
bun test
bun run build:ui
$env:DATABASE_URL=':memory:'; bun run migrate
```

Also run `git diff --check`. For PostgreSQL-sensitive changes, migrate against an
available PostgreSQL database without revealing its URL.

For development proxy changes, additionally verify:

- Vite is actually listening on 5173.
- The backend response at port 3000 contains `/liff/@vite/client`.
- `/app/config`, `/api`, and `/auth` still resolve to Elysia.
- The command fails before backend startup when its required Vite instance cannot
  start.
- stopping the command leaves no process on ports 3000 or 5173.

For production asset changes, verify `/liff/` and one hashed asset return 200 from
`dist/liff`, and the HTML does not contain the Vite HMR client.
