import lineBotWebhook from './line-bot/index.js'
import flexPush from './webhook/index.js'

import lineDb from './route-db/line-bot.js'
import historyDb from './route-db/history.js'
import newBot from './route-db/bot/new.js'

import sso from './auth/sso.js'
import login from './auth/login.js'
import user from './auth/user.js'

export default [
  { path: '/health', method: 'GET', logLevel: 'error', handler: (_, reply) => reply.send({ ok: '☕' }) },

  // LINE Bot webhook (from LINE servers)
  { path: '/line/:bot', method: 'POST', handler: lineBotWebhook },

  // Push flex message to bot room (for external systems)
  { path: '/flex/:bot/:to', method: 'PUT', handler: flexPush },

  // LIFF API — bot management
  { path: '/api/line', method: 'GET', handler: lineDb },
  { path: '/api/line/:bot/room', method: 'GET', handler: lineDb },
  { path: '/api/line/:bot/history', method: 'GET', handler: historyDb },
  { path: '/api/line/:bot/history/:id', method: 'GET', handler: historyDb },
  { path: '/api/bot', method: 'POST', handler: newBot },

  // Auth (Synology SSO)
  { path: '/auth/sso', method: 'GET', handler: sso },
  { path: '/auth/login', method: 'POST', handler: login },
  { path: '/auth/user', method: 'POST', handler: user },
]
