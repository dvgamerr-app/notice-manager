import { databaseType, db, migrateToLatest } from '../lib/db.js'
import { logger } from '../lib/logger.js'

try {
  logger.info({ databaseType }, 'Starting database migrations')
  await migrateToLatest()
  logger.info({ databaseType }, 'Database migrations are up to date')
} catch (error) {
  logger.fatal({ err: error, databaseType }, 'Database migration failed')
  process.exitCode = 1
} finally {
  await db.destroy()
}
