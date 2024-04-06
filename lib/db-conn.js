import { uuidv7 } from 'uuidv7'
import pino from 'pino'

const logger = pino()
import { Database } from "bun:sqlite"

export const db = new Database(process.env.SQLITE_PATH || './db-notice.sqlite')
export const uuid = uuidv7
export const initDbSchema = async () => {
  logger.info(`init database...`)
  db.query(`
  CREATE TABLE IF NOT EXISTS notify_auth (
    user_id VARCHAR NOT NULL,
    service VARCHAR NOT NULL,
    room VARCHAR NULL,
    state VARCHAR NULL,
    code VARCHAR NULL,
    redirect_uri VARCHAR NULL,
    access_token TEXT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`).run()

  db.query(`
  CREATE TABLE IF NOT EXISTS notify_service (
    user_id VARCHAR NOT NULL,
    service VARCHAR NOT NULL,
    client_id VARCHAR NOT NULL,
    client_secret VARCHAR NOT NULL,
    active BOOLEAN DEFAULT true,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`).run()

  db.query(`
  CREATE TABLE IF NOT EXISTS history_notify (
    uuid VARCHAR(32) NOT NULL,
    category VARCHAR NOT NULL,
    service VARCHAR NOT NULL,
    room VARCHAR NOT NULL,
    sender TEXT NULL,
    error TEXT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`).run()

  db.query(`CREATE INDEX IF NOT EXISTS notify_auth_idx ON notify_auth(service, room)`).run()
  db.query(`CREATE INDEX IF NOT EXISTS notify_service_idx ON notify_service(service, active)`).run()
  db.query(`CREATE INDEX IF NOT EXISTS notify_auth_state_idx ON notify_auth(state)`).run()
  db.query(`CREATE UNIQUE INDEX IF NOT EXISTS notify_service_unq ON notify_service (service)`).run()
  db.query(`CREATE UNIQUE INDEX IF NOT EXISTS notify_auth_unq ON notify_auth (service, room)`).run()

  // await dbRun(`INSERT INTO notify_auth (user_id, service, room, state, response_type, redirect_uri)
  // VALUES('U9e0a870c01ca97da20a4ec462bf72991', 'notify', 'kem', 'state', 'response_type', 'http://localhost:3000/')`)
  // await dbRun(`INSERT INTO notify_service (user_id, service, client_id, client_secret)
  // VALUES('U9e0a870c01ca97da20a4ec462bf72991', 'notify', 'gsEMv73f9egXaQlo7duPB2','y4tRybEVAmUnjArpW412cMRvqmLWXjrGYgyb490q3C3')`)

}
