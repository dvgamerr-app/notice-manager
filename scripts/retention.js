import { db, migrateToLatest } from '../lib/db.js'
import { logger } from '../lib/logger.js'
import { resolveRetentionPolicy, runRetention } from '../lib/retention.js'
import { runTask, shutdownTelemetry } from '../lib/telemetry.js'

try {
  await migrateToLatest()
  const policy = resolveRetentionPolicy()
  const deleted = await runTask('retention', () => runRetention({ policy }))
  logger.info({ deleted, policy }, 'Data retention completed')
} catch (error) {
  logger.fatal({ err: error }, 'Data retention failed')
  process.exitCode = 1
} finally {
  await db.destroy()
  await shutdownTelemetry()
}
