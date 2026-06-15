import { Elysia } from 'elysia'
import { db } from '../lib/db.js'

import lineBotWebhook from './line-bot/index.js'
import flexPush from './webhook/index.js'
import lineDb from './route-db/line-bot.js'
import historyDb from './route-db/history.js'
import newBot from './route-db/bot/new.js'
import liffAuth from './auth/liff.js'

// Scoped raw-body parser for LINE webhook (signature verification needs raw string)
const webhookRaw = new Elysia({ name: 'webhook-raw' })
  .onParse(async ({ request, contentType }) => {
    if (contentType === 'application/json') return await request.text()
  })
  .post('/line/:bot', lineBotWebhook)

// LIFF API routes — inject userId from session token or legacy x-user-liff header
const liffRoutes = new Elysia({ name: 'liff-routes' })
  .derive(async ({ headers }) => {
    const token = (headers['authorization'] || '').replace(/^Bearer\s+/, '')
    if (!token) return { userId: headers['x-user-liff'] || null }

    const row = await db.selectFrom('ba_session').select('user_id')
      .where('token', '=', token)
      .where('expires_at', '>', new Date())
      .executeTakeFirst()
    return { userId: row?.user_id || null }
  })
  .get('/api/line', lineDb)
  .get('/api/line/:bot/room', lineDb)
  .get('/api/line/:bot/history', historyDb)
  .get('/api/line/:bot/history/:id', historyDb)
  .post('/api/bot', newBot)

export default new Elysia({ name: 'routes' })
  .use(webhookRaw)
  .get('/health', () => ({ ok: '☕' }))
  .put('/flex/:bot/:to', flexPush)
  .post('/auth/liff', liffAuth)
  .use(liffRoutes)
