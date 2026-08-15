import { createApp } from './app.js'
import { databaseType, migrateToLatest } from './lib/db.js'

try {
  await migrateToLatest()
  const port = Number(process.env.PORT || 3000)
  const app = createApp()
  app.listen(port)
  console.log(`LINE Manager listening on :${port} (${databaseType})`)
} catch (error) {
  console.error('Unable to start LINE Manager', error)
  process.exit(1)
}
