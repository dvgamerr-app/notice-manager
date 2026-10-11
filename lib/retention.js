import { db } from './db.js'

const DAY_MS = 86_400_000

const retentionDays = (environment, name, fallback) => {
  const raw = environment[name]
  if (raw == null || String(raw).trim() === '') return fallback
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0 || value > 3_650) {
    throw new TypeError(`${name} must be an integer between 0 and 3650`)
  }
  return value
}

const retentionBatchSize = (environment) => {
  const raw = environment.RETENTION_BATCH_SIZE
  if (raw == null || String(raw).trim() === '') return 1_000
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1 || value > 10_000) {
    throw new TypeError('RETENTION_BATCH_SIZE must be an integer between 1 and 10000')
  }
  return value
}

export const resolveRetentionPolicy = (environment = process.env) => ({
  webhookEventsDays: retentionDays(environment, 'RETENTION_WEBHOOK_EVENTS_DAYS', 30),
  forwardsDays: retentionDays(environment, 'RETENTION_FORWARDS_DAYS', 30),
  deliveriesDays: retentionDays(environment, 'RETENTION_DELIVERIES_DAYS', 90),
  auditLogsDays: retentionDays(environment, 'RETENTION_AUDIT_LOGS_DAYS', 365),
  expiredSessionsDays: retentionDays(environment, 'RETENTION_EXPIRED_SESSIONS_DAYS', 7),
  rateLimitBucketsDays: retentionDays(environment, 'RETENTION_RATE_LIMIT_BUCKETS_DAYS', 2),
  batchSize: retentionBatchSize(environment),
})

const cutoffIso = (now, days) => new Date(now.getTime() - days * DAY_MS).toISOString()

const pruneById = async ({
  executor,
  table,
  timestampColumn,
  cutoff,
  batchSize,
  guard = (query) => query,
  beforeDelete = null,
}) => {
  let deleted = 0
  while (true) {
    const rows = await guard(
      executor
        .selectFrom(table)
        .select('id')
        .where(timestampColumn, '<', cutoff)
        .orderBy(timestampColumn, 'asc')
        .limit(batchSize),
    ).execute()
    if (!rows.length) return deleted

    const ids = rows.map((row) => row.id)
    if (beforeDelete) await beforeDelete(executor, ids)
    const result = await guard(
      executor.deleteFrom(table).where('id', 'in', ids),
    ).executeTakeFirst()
    deleted += Number(result.numDeletedRows || 0)
  }
}

// Never delete a webhook event another instance is processing or one that still
// has a forward waiting to be delivered: the forward reads its payload.
const webhookEventGuard = (query) => query
  .where('processing_status', '!=', 'processing')
  .where((eb) => eb.not(eb.exists(
    eb.selectFrom('managed_webhook_forward')
      .select('managed_webhook_forward.id')
      .whereRef('managed_webhook_forward.event_id', '=', 'managed_webhook_event.id')
      .where('managed_webhook_forward.status', 'in', ['pending', 'sending']),
  )))

// Finished forwards are removed explicitly so the reported counts stay exact
// (a database cascade is not always included in the affected-row count).
const deleteFinishedForwards = (executor, eventIds) => executor
  .deleteFrom('managed_webhook_forward')
  .where('event_id', 'in', eventIds)
  .where('status', 'not in', ['pending', 'sending'])
  .execute()

// A forward that is mid-send keeps its row; one stuck pending past the cutoff
// (for example a long-disabled target) is abandoned and removed.
const forwardGuard = (query) => query.where('status', '!=', 'sending')

export const runRetention = async ({
  executor = db,
  now = new Date(),
  policy = resolveRetentionPolicy(),
} = {}) => {
  const referenceTime = now instanceof Date ? now : new Date(now)
  if (!Number.isFinite(referenceTime.getTime())) throw new TypeError('now must be a valid date')

  const deleted = {
    forwards: 0,
    webhookEvents: 0,
    deliveries: 0,
    auditLogs: 0,
    expiredSessions: 0,
    rateLimitBuckets: 0,
  }
  // Forwards go first so their events become eligible in the same run.
  const jobs = [
    {
      resultKey: 'forwards',
      days: policy.forwardsDays,
      table: 'managed_webhook_forward',
      timestampColumn: 'created_at',
      guard: forwardGuard,
    },
    {
      resultKey: 'webhookEvents',
      days: policy.webhookEventsDays,
      table: 'managed_webhook_event',
      timestampColumn: 'received_at',
      guard: webhookEventGuard,
      beforeDelete: deleteFinishedForwards,
    },
    {
      resultKey: 'deliveries',
      days: policy.deliveriesDays,
      table: 'managed_delivery',
      timestampColumn: 'created_at',
    },
    {
      resultKey: 'auditLogs',
      days: policy.auditLogsDays,
      table: 'managed_audit_log',
      timestampColumn: 'created_at',
    },
    {
      resultKey: 'expiredSessions',
      days: policy.expiredSessionsDays,
      table: 'app_session',
      timestampColumn: 'expires_at',
    },
    {
      resultKey: 'rateLimitBuckets',
      days: policy.rateLimitBucketsDays,
      table: 'managed_rate_limit_bucket',
      timestampColumn: 'window_started_at',
    },
  ]

  for (const job of jobs) {
    if (job.days === 0) continue
    deleted[job.resultKey] = await pruneById({
      executor,
      table: job.table,
      timestampColumn: job.timestampColumn,
      cutoff: cutoffIso(referenceTime, job.days),
      batchSize: policy.batchSize,
      guard: job.guard,
      beforeDelete: job.beforeDelete,
    })
  }
  return deleted
}
