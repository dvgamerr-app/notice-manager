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
  excludeProcessing = false,
}) => {
  let deleted = 0
  while (true) {
    let selection = executor
      .selectFrom(table)
      .select('id')
      .where(timestampColumn, '<', cutoff)
      .orderBy(timestampColumn, 'asc')
      .limit(batchSize)
    if (excludeProcessing) {
      selection = selection.where('processing_status', '!=', 'processing')
    }
    const rows = await selection.execute()
    if (!rows.length) return deleted

    let deletion = executor
      .deleteFrom(table)
      .where('id', 'in', rows.map((row) => row.id))
    if (excludeProcessing) {
      deletion = deletion.where('processing_status', '!=', 'processing')
    }
    const result = await deletion.executeTakeFirst()
    deleted += Number(result.numDeletedRows || 0)
  }
}

export const runRetention = async ({
  executor = db,
  now = new Date(),
  policy = resolveRetentionPolicy(),
} = {}) => {
  const referenceTime = now instanceof Date ? now : new Date(now)
  if (!Number.isFinite(referenceTime.getTime())) throw new TypeError('now must be a valid date')

  const deleted = {
    webhookEvents: 0,
    deliveries: 0,
    auditLogs: 0,
    expiredSessions: 0,
    rateLimitBuckets: 0,
  }
  const jobs = [
    {
      resultKey: 'webhookEvents',
      days: policy.webhookEventsDays,
      table: 'managed_webhook_event',
      timestampColumn: 'received_at',
      excludeProcessing: true,
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
      excludeProcessing: job.excludeProcessing,
    })
  }
  return deleted
}
