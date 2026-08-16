# Database schema notes

Read-only inspection of the configured PostgreSQL database found a legacy schema
created by the previous startup-time SQL initializer.

## Legacy tables

- `line_bot`: integer primary key; globally unique `service`; plaintext
  `access_token` and `secret`; nullable `user_id`; PostgreSQL `jsonb` options.
- `line_bot_room`: integer primary key; unique `(bot_name, room_id)`; room type,
  nickname, active flag, and PostgreSQL `jsonb` variable state.
- `line_bot_user`: legacy per-room user metadata.
- `line_inbound`: inbound event fragments in separate `source` and `message`
  `jsonb` columns. It has only its primary-key index.
- `line_outbound`: outbound payload/history with `jsonb` sender. It has only its
  primary-key index.
- `chat_webhook`: legacy generic webhook configuration.
- `ba_user`, `ba_session`, `ba_account`, `ba_verification`: obsolete
  better-auth tables.

The legacy tables have no declared foreign keys between bot, room, inbound, and
outbound records. Application code must not assume referential integrity.

## New LINE Manager tables

Kysely migration `001_line_management` deliberately uses `managed_bot`,
`managed_chat`, `managed_webhook_event`, and `managed_delivery`, plus
`app_setting`, `app_user`, and `app_session`. Migration
`002_management_operations` adds chat profile metadata, `managed_api_key`, and
`managed_audit_log`. Migration `003_webhook_processing` adds retryable webhook
processing state, attempt counts, timestamps, and the supporting status index.
Migration `004_distributed_rate_limit` adds `managed_rate_limit_bucket` and
`005_data_retention_indexes` adds global timestamp indexes used by batched
retention cleanup. The distinct `managed_` prefix avoids destructive changes to
legacy tables and works on both PostgreSQL and SQLite.

- `managed_chat.display_name` is the editable operator alias.
- `managed_chat.line_display_name`, `picture_url`, and `metadata_payload` cache
  the latest LINE profile/group summary without overwriting that alias.
- `managed_api_key` stores a SHA-256 key hash and display prefix, never the raw
  external API key.
- `managed_audit_log` records management and external-delivery actions.
- `managed_webhook_event.processing_status` and `attempt_count` distinguish a
  completed duplicate from a failed event that LINE may safely redeliver.
- `managed_rate_limit_bucket` has one unique row per API key/minute. Atomic
  upserts share quota across application instances; old windows are removed by
  the retention job.

## Data retention

`bun run retention` removes expired sessions and old webhook, delivery, audit,
and rate-limit records in bounded batches. Cutoffs are configured with the
`RETENTION_*` environment variables documented in `.env.example`. A value of
zero disables the corresponding policy. Webhook rows in `processing` state are
excluded to avoid deleting an active claim. Run the command from a daily
scheduler; concurrent executions remain idempotent.
