import { join } from 'node:path'
import { createServer } from 'vite'
import { logger } from '../lib/logger.js'

const backendUrl = 'http://127.0.0.1:3000'
const projectRoot = join(import.meta.dirname, '..')

process.env.DATABASE_URL = ':memory:'
process.env.NODE_ENV = 'development'
process.env.DEV_AUTH_BYPASS = 'true'

const { db, migrateToLatest } = await import('../lib/db.js')
const { createApp } = await import('../app.js')
const vite = await createServer({
  configFile: join(projectRoot, 'vite.config.js'),
})

let app
try {
  await migrateToLatest()
  await vite.listen()
  app = createApp()
  app.listen({ hostname: '127.0.0.1', port: 3000 })

  const htmlResponse = await fetch(`${backendUrl}/`)
  const html = htmlResponse.ok ? await htmlResponse.text() : ''
  if (!html.includes('/liff/@vite/client')) {
    throw new Error('Vite HMR client is missing from the proxied development HTML')
  }

  const [config, session] = await Promise.all([
    fetch(`${backendUrl}/app/config`),
    fetch(`${backendUrl}/api/session?smoke=1`),
  ])
  if (config.status !== 200 || session.status !== 401) {
    throw new Error(`Elysia route check failed (${config.status}, ${session.status})`)
  }

  logger.info(
    { vitePort: 5173, backendPort: 3000 },
    'Development smoke passed with separate Vite and backend servers',
  )
} finally {
  if (app) await app.stop()
  await vite.close()
  await db.destroy()
}
