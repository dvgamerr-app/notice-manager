import { Elysia } from 'elysia'
import { authenticateApiKey } from '../lib/api-keys.js'
import { db } from '../lib/db.js'
import { deliverToChat } from '../lib/delivery.js'
import { LineApiError, normalizeMessages } from '../lib/sdk-line.js'

const buckets = new Map()
const configuredRateLimit = Number(process.env.EXTERNAL_API_RATE_LIMIT || 60)
const rateLimit = Number.isFinite(configuredRateLimit)
  ? Math.max(1, Math.trunc(configuredRateLimit))
  : 60

const consumeRateLimit = (keyId) => {
  const minute = Math.floor(Date.now() / 60_000)
  const current = buckets.get(keyId)
  if (!current || current.minute !== minute) {
    buckets.set(keyId, { minute, count: 1 })
    return true
  }
  current.count += 1
  return current.count <= rateLimit
}

const requireApiKey = async ({ headers, set }) => {
  const apiKey = await authenticateApiKey(headers)
  if (!apiKey) {
    set.status = 401
    return { apiKey: null, authError: { error: 'Valid API key required' } }
  }
  if (!consumeRateLimit(apiKey.id)) {
    set.status = 429
    return { apiKey: null, authError: { error: 'API rate limit exceeded' } }
  }
  return { apiKey, authError: null }
}

const listExternalChats = async ({ params, apiKey, authError, set }) => {
  if (authError) return authError
  if (params.bot !== apiKey.service) {
    set.status = 403
    return { error: 'This API key does not grant access to the requested bot' }
  }
  const rows = await db
    .selectFrom('managed_chat')
    .select(['id', 'source_id', 'source_type', 'display_name', 'active'])
    .where('bot_id', '=', apiKey.bot_id)
    .where('registered', '=', 1)
    .orderBy('display_name', 'asc')
    .execute()
  return rows.map((row) => ({
    id: row.id,
    sourceId: row.source_id,
    type: row.source_type,
    name: row.display_name,
    active: Boolean(row.active),
  }))
}

const sendExternalMessage = async ({ params, body, apiKey, authError, set }) => {
  if (authError) return authError
  if (params.bot !== apiKey.service) {
    set.status = 403
    return { error: 'This API key does not grant access to the requested bot' }
  }
  const chat = await db
    .selectFrom('managed_chat')
    .selectAll()
    .where('bot_id', '=', apiKey.bot_id)
    .where('registered', '=', 1)
    .where((expression) =>
      expression.or([
        expression('id', '=', params.chat),
        expression('source_id', '=', params.chat),
      ]))
    .executeTakeFirst()
  if (!chat) {
    set.status = 404
    return { error: 'Registered chat not found' }
  }
  if (!chat.active) {
    set.status = 409
    return { error: 'Chat is inactive' }
  }
  const bot = await db
    .selectFrom('managed_bot')
    .selectAll()
    .where('id', '=', apiKey.bot_id)
    .executeTakeFirstOrThrow()

  let messages
  try {
    messages = normalizeMessages(
      body?.messages || { type: 'text', text: String(body?.message || '') },
    )
    if (messages[0]?.type === 'text' && !messages[0].text) {
      throw new TypeError('message or messages is required')
    }
  } catch (error) {
    set.status = 400
    return { error: error.message }
  }

  try {
    const result = await deliverToChat({
      bot,
      chat,
      messages,
      actorType: 'api-key',
      actorId: apiKey.id,
      notificationDisabled: body?.notificationDisabled,
    })
    return { ok: true, ...result }
  } catch (error) {
    set.status = error instanceof LineApiError || error instanceof TypeError ? 400 : 500
    return {
      error: error.message || 'Unable to send LINE message',
      deliveryId: error.deliveryId || null,
      requestId: error.requestId || null,
      details: error.details || null,
    }
  }
}

export default new Elysia({ name: 'external-api' })
  .derive(requireApiKey)
  .get('/v1/bots/:bot/chats', listExternalChats)
  .post('/v1/bots/:bot/chats/:chat/messages', sendExternalMessage)
