import { databaseType, db, migrateToLatest } from '../lib/db.js'

try {
  console.log(`database: ${databaseType}`)
  await migrateToLatest()
  console.log('database migrations are up to date')
} catch (error) {
  console.error('database migration failed', error)
  process.exitCode = 1
} finally {
  await db.destroy()
}
