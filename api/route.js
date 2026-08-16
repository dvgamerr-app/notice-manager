import { Elysia } from 'elysia'
import { deleteSession, getSessionUser } from '../lib/auth.js'
import liffAuth from './auth/liff.js'
import externalApi from './routes/external.js'
import { getAvatarOptions, getAvatarPng } from '../lib/avatars.js'
import lineBotWebhook from './webhooks/line.js'
import { privacyPolicy, termsOfUse } from './legal.js'
import {
  addApiKey,
  bulkTestChats,
  bulkUpdateChats,
  createBot,
  getBot,
  getBotQuota,
  getSession,
  leaveChat,
  listApiKeys,
  listAuditLogs,
  listBots,
  listChats,
  listDeliveries,
  listWebhookEvents,
  refreshChat,
  revokeApiKey,
  syncBotWebhook,
  testBotWebhook,
  testChat,
  updateBot,
  updateChat,
} from './management/index.js'

const webhookRoutes = new Elysia({ name: 'line-webhooks' })
  .onParse(async ({ request, contentType }) => {
    if (contentType === 'application/json') return request.text()
  })
  .post('/line/:bot', lineBotWebhook)
  // Compatibility alias for installations already using the longer route.
  .post('/webhooks/line/:bot', lineBotWebhook)

// Elysia cannot infer a required value returned by an async derive in JavaScript.
const managementRoutes = /** @type {any} */ (new Elysia({ name: 'management-routes' }))
  .derive(async ({ headers }) => ({ user: await getSessionUser(headers) }))
  .get('/api/session', getSession)
  .get('/api/bots', listBots)
  .post('/api/bots', createBot)
  .get('/api/bots/:bot', getBot)
  .patch('/api/bots/:bot', updateBot)
  .get('/api/bots/:bot/quota', getBotQuota)
  .post('/api/bots/:bot/webhook/sync', syncBotWebhook)
  .post('/api/bots/:bot/webhook/test', testBotWebhook)
  .get('/api/bots/:bot/chats', listChats)
  .patch('/api/bots/:bot/chats/:chat', updateChat)
  .post('/api/bots/:bot/chats/bulk', bulkUpdateChats)
  .post('/api/bots/:bot/chats/bulk-test', bulkTestChats)
  .post('/api/bots/:bot/chats/:chat/refresh', refreshChat)
  .post('/api/bots/:bot/chats/:chat/leave', leaveChat)
  .post('/api/bots/:bot/chats/:chat/test', testChat)
  .get('/api/bots/:bot/deliveries', listDeliveries)
  .get('/api/bots/:bot/webhook-events', listWebhookEvents)
  .get('/api/bots/:bot/api-keys', listApiKeys)
  .post('/api/bots/:bot/api-keys', addApiKey)
  .delete('/api/bots/:bot/api-keys/:key', revokeApiKey)
  .get('/api/bots/:bot/audit-logs', listAuditLogs)
  // Read-only compatibility aliases for the previous LIFF frontend.
  .get('/api/line', listBots)
  .get('/api/line/:bot/room', listChats)
  .get('/api/line/:bot/history', listDeliveries)

const getPublicBaseUrl = () => {
  try {
    const url = new URL(process.env.PUBLIC_BASE_URL || '')
    return url.protocol === 'https:' ? url.toString().replace(/\/+$/, '') : ''
  } catch {
    return ''
  }
}

const getAvatar = ({ params }) => {
  const avatarId = String(params.file || '').replace(/\.png$/i, '')
  const png = getAvatarPng(avatarId)
  if (!png) return new Response('Avatar not found', { status: 404 })
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}

export default new Elysia({ name: 'routes' })
  .use(webhookRoutes)
  .use(externalApi)
  .get('/health', () => ({ ok: true }))
  .get('/privacy-policy', privacyPolicy)
  .get('/terms-of-use', termsOfUse)
  .get('/app/config', () => {
    const publicBaseUrl = getPublicBaseUrl()
    return {
      publicBaseUrl,
      avatars: getAvatarOptions(publicBaseUrl),
    }
  })
  .get('/app/avatars/:file', /** @type {any} */ (getAvatar))
  .post('/auth/liff', /** @type {any} */ (liffAuth))
  .post('/auth/logout', async ({ headers }) => {
    await deleteSession(headers)
    return { ok: true }
  })
  .use(managementRoutes)
