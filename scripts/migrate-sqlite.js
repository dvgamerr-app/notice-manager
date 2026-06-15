/**
 * One-time migration: SQLite (LINE Notify legacy) → PostgreSQL
 * Tables in SQLite are all LINE Notify (deprecated service).
 * We export history_notify → line_outbound as type='notify-legacy'.
 */
import { Database } from 'bun:sqlite'
import { db } from '../lib/db.js'
import pino from 'pino'

const logger = pino()

const run = async () => {
  const sqlite = new Database('./db-notice.sqlite')
  const history = sqlite.query('SELECT * FROM history_notify ORDER BY created ASC').all()
  logger.info(`Found ${history.length} legacy LINE Notify records`)

  let migrated = 0
  for (const row of history) {
    try {
      await db.insertInto('line_outbound').values({
        bot_name: row.service,
        user_to: row.room,
        sender: row.sender || JSON.stringify({ message: '', category: row.category }),
        type: 'notify-legacy',
        sended: row.error == null,
        error: row.error || null,
      }).onConflict(oc => oc.doNothing()).execute()
      migrated++
    } catch (e) {
      logger.warn(`Skip row ${row.uuid}: ${e.message}`)
    }
  }

  logger.info(`Migrated ${migrated}/${history.length} history records → line_outbound`)
  logger.info('SQLite migration complete. notify_service and notify_auth intentionally skipped (LINE Notify is shut down).')
  sqlite.close()
  await db.destroy()
}

run().catch(e => { console.error(e); process.exit(1) })
