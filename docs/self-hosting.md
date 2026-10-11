# Self-hosting guide

LINE Manager runs as a single container. This guide covers everything beyond the
[5-minute quick start](../README.md#-deploy-in-5-minutes).

## Requirements

- A Linux server or VPS with Docker and the Compose plugin (amd64 or arm64)
- A public **HTTPS** URL that reaches the container (LINE does not accept plain HTTP or `localhost`)
- A LINE account that will own the installation

## 1. LINE Developers Console

1. Create a **provider**, then one **LINE Login** channel under it.
2. In that channel add a **LIFF app**.
   - Endpoint URL: `https://YOUR_DOMAIN/liff/`
   - Scopes: `openid`, `profile`
3. Copy the **LIFF ID** (`<channelId>-<random>`). It is the only LINE Login value you need,
   because the channel ID is derived from it.
4. For each bot you want to manage, create a **Messaging API** channel under the same provider
   so user IDs match. Enable **Allow bot to join group chats** if the bot should work in groups.
   Keep its *Channel access token* and *Channel secret* for the dashboard.
5. Optional: set the privacy policy and terms URLs in the console to
   `https://YOUR_DOMAIN/privacy-policy` and `https://YOUR_DOMAIN/terms-of-use`.

## 2. Configure

Copy `.env.example` to `.env`. Three values are required:

| Variable | Description |
|---|---|
| `LIFF_ID` | LIFF ID from step 1. It is read at runtime, so no rebuild is needed. |
| `PUBLIC_BASE_URL` | Public HTTPS origin, without a trailing slash. Webhook URLs are generated from it. |
| `CREDENTIAL_ENCRYPTION_KEY` | 32+ random characters (`openssl rand -hex 32`). Back it up. Stored bot credentials cannot be decrypted without it. |

Useful optional values:

| Variable | Default | Description |
|---|---|---|
| `DOMAIN` | | Used by the `https` profile (Caddy) for automatic certificates. |
| `LINE_ADMIN_USER_IDS` | | Comma-separated LINE user IDs allowed to own the installation. When empty, the first user who signs in becomes the permanent owner. Set it in production. |
| `DATABASE_URL` | SQLite in the data volume | `postgresql://user:pass@host:5432/db` to use PostgreSQL. |
| `PORT` | `3000` | Host port published by Compose. |
| `IMAGE_TAG` | `latest` | Pin a release such as `v7.2.0`. |
| `EXTERNAL_API_RATE_LIMIT` | `60` | Requests per minute per API key. |
| `LOG_LEVEL`, `LOG_FORMAT` | `info`, `json` | Pino level, and `text` for pretty logs. |
| `RETENTION_*` | see `.env.example` | How long webhook events, deliveries, audit logs and so on are kept. |

## 3. Run

```bash
docker compose --profile https up -d     # with automatic HTTPS (Caddy)
docker compose up -d                     # behind your own proxy or tunnel
```

Check it with `curl https://YOUR_DOMAIN/health`, which returns `{"ok":true}`. Then open
`https://YOUR_DOMAIN/liff/` inside LINE and sign in.

### HTTPS options

| Option | How |
|---|---|
| Built-in Caddy | Set `DOMAIN`, point its DNS A/AAAA record at the server, and use `--profile https`. Ports 80 and 443 must be open. |
| Your own reverse proxy | Proxy your domain to `127.0.0.1:3000`. Forward `Host` and the original headers. Do not buffer or rewrite the request body. |
| Cloudflare Tunnel | Run `cloudflared tunnel --url http://localhost:3000` (or a named tunnel) and use its HTTPS hostname as `PUBLIC_BASE_URL` and the LIFF endpoint. |

Webhook signatures are computed over the exact raw body, so proxies must not alter it.

## PostgreSQL

SQLite is fine for a single instance. For several instances or managed backups, use PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@host:5432/line_manager
```

Migrations run automatically at startup, and `docker compose run --rm app bun run migrate`
runs them on demand. The distributed rate limit and the webhook-forward worker are safe to run
on many instances against one database.

## Upgrade

```bash
docker compose pull
docker compose up -d
```

Migrations are applied on start and never edited after release. Set `IMAGE_TAG` to pin a version.

## Backup

- SQLite: stop the stack briefly (`docker compose stop app`), archive the data volume, then start it again:
  `docker run --rm -v <project>_notice-manager-data:/data -v "$PWD":/backup alpine tar czf /backup/data.tgz /data`
  (`docker volume ls` shows the exact volume name).
- PostgreSQL: use `pg_dump` as usual.
- Always keep a copy of `CREDENTIAL_ENCRYPTION_KEY` and `.env` separately.

## Scheduled retention cleanup

Run once a day from cron or a scheduler:

```bash
docker compose exec app bun run retention
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `docker compose` complains about a missing variable | Fill `LIFF_ID`, `PUBLIC_BASE_URL` and `CREDENTIAL_ENCRYPTION_KEY` in `.env`. |
| LINE login redirects to the wrong host | The LIFF **Endpoint URL** in the console must equal `https://YOUR_DOMAIN/liff/`. |
| "ระบบนี้ผูกกับบัญชี LINE ผู้ดูแลบัญชีอื่นแล้ว" (bound to another administrator) | Only one owner is allowed. Sign in with the first account, or set `LINE_ADMIN_USER_IDS`. |
| Add bot fails with an authentication error | The *Channel access token* was pasted into the wrong field, or it belongs to another channel. The error shows safe diagnostics. |
| Webhook test fails | `PUBLIC_BASE_URL` must be reachable from the internet over HTTPS, and your proxy must pass the raw body. |
| Bot cannot join a group | Enable **Allow bot to join group chats**. A group can contain one Official Account only. |

More detail on routes, behaviour and CI/CD lives in the [Thai reference](reference.th.md)
and [CLAUDE.md](../CLAUDE.md).
