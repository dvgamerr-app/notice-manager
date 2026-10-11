import { createApp } from './app.js'
import { databaseType, migrateToLatest } from './lib/db.js'
import { logger } from './lib/logger.js'
import { startForwardWorker } from './lib/webhook-forward.js'

try {
  await migrateToLatest()
  const port = Number(process.env.PORT || 3000)
  const app = createApp()
  app.listen(port)
  startForwardWorker()
  logger.info({ port, databaseType }, 'LINE Manager listening')
} catch (error) {
  logger.fatal({ err: error }, 'Unable to start LINE Manager')
  process.exit(1)
}
