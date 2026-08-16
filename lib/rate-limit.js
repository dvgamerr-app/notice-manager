import { randomUUID } from 'node:crypto'
import { db } from './db.js'

const configuredLimit = Number(process.env.EXTERNAL_API_RATE_LIMIT || 60)
export const externalApiRateLimit = Number.isFinite(configuredLimit)
  ? Math.max(1, Math.trunc(configuredLimit))
  : 60

const minuteWindow = (now) => {
  const timestamp = now instanceof Date ? now.getTime() : Number(now)
  const windowStartedAtMs = Math.floor(timestamp / 60_000) * 60_000
  return {
    windowStartedAt: new Date(windowStartedAtMs).toISOString(),
    resetAt: new Date(windowStartedAtMs + 60_000).toISOString(),
  }
}

export const consumeApiRateLimit = async ({
  apiKeyId,
  limit = externalApiRateLimit,
  now = new Date(),
  executor = db,
}) => {
  const normalizedLimit = Math.max(1, Math.trunc(Number(limit) || externalApiRateLimit))
  const { windowStartedAt, resetAt } = minuteWindow(now)
  const updatedAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString()
  const bucket = await executor
    .insertInto('managed_rate_limit_bucket')
    .values({
      id: randomUUID(),
      api_key_id: apiKeyId,
      window_started_at: windowStartedAt,
      request_count: 1,
      updated_at: updatedAt,
    })
    .onConflict((conflict) =>
      conflict
        .columns(['api_key_id', 'window_started_at'])
        .doUpdateSet((expression) => ({
          request_count: expression('managed_rate_limit_bucket.request_count', '+', 1),
          updated_at: updatedAt,
        })))
    .returning('request_count')
    .executeTakeFirstOrThrow()

  const count = Number(bucket.request_count)
  return {
    allowed: count <= normalizedLimit,
    count,
    limit: normalizedLimit,
    remaining: Math.max(0, normalizedLimit - count),
    resetAt,
  }
}
