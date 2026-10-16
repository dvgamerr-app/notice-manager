import { Elysia } from 'elysia'
import { authenticateApiKey } from '../../lib/api-keys.js'
import { db } from '../../lib/db.js'
import { deliverToChat } from '../../lib/delivery.js'
import { LineApiError, normalizeMessages } from '../../lib/sdk-line.js'
import { logger } from '../../lib/logger.js'
import { consumeApiRateLimit } from '../../lib/rate-limit.js'

const applyRateLimitHeaders = (set, rate) => {
  set.headers['RateLimit-Limit'] = String(rate.limit)
  set.headers['RateLimit-Remaining'] = String(rate.remaining)
  set.headers['RateLimit-Reset'] = String(
    Math.max(0, Math.ceil((new Date(rate.resetAt).getTime() - Date.now()) / 1_000)),
  )
}

const requireApiKey = async ({ headers, set }) => {
  const apiKey = await authenticateApiKey(headers)
  if (!apiKey) {
    set.status = 401
    return { apiKey: null, authError: { error: 'Valid API key required' } }
  }
  const rate = await consumeApiRateLimit({ apiKeyId: apiKey.id })
  applyRateLimitHeaders(set, rate)
  if (!rate.allowed) {
    set.status = 429
    set.headers['Retry-After'] = set.headers['RateLimit-Reset']
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

const failure = (status, body) => ({ failure: { status, body } })

// Resolves the registered, active target chat and its bot for an API key.
const resolveSendTarget = async ({ params, apiKey }) => {
  if (params.bot !== apiKey.service) {
    return failure(403, { error: 'This API key does not grant access to the requested bot' })
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
  if (!chat) return failure(404, { error: 'Registered chat not found' })
  if (!chat.active) return failure(409, { error: 'Chat is inactive' })
  const bot = await db
    .selectFrom('managed_bot')
    .selectAll()
    .where('id', '=', apiKey.bot_id)
    .executeTakeFirstOrThrow()
  return { bot, chat }
}

const parseExternalMessages = (body) => {
  try {
    const messages = normalizeMessages(
      body?.messages || { type: 'text', text: String(body?.message || '') },
    )
    if (messages[0]?.type === 'text' && !messages[0].text) {
      throw new TypeError('message or messages is required')
    }
    return { messages }
  } catch (error) {
    return failure(400, { error: error.message })
  }
}

const externalDeliveryFailure = (error) => {
  const expectedError = error instanceof LineApiError || error instanceof TypeError
  if (!expectedError) logger.error({ err: error }, 'Unexpected external delivery failure')
  return {
    status: expectedError ? 400 : 500,
    body: {
      error: expectedError ? error.message : 'Unable to send LINE message',
      deliveryId: error.deliveryId || null,
      requestId: error instanceof LineApiError ? error.requestId || null : null,
      details: error instanceof LineApiError ? error.details || null : null,
    },
  }
}

// Returns `{ status?, body }`; the status is applied only when present.
const deliverExternal = async ({ params, body, apiKey }) => {
  const target = await resolveSendTarget({ params, apiKey })
  if (target.failure) return target.failure
  const parsed = parseExternalMessages(body)
  if (parsed.failure) return parsed.failure

  try {
    const result = await deliverToChat({
      bot: target.bot,
      chat: target.chat,
      messages: parsed.messages,
      actorType: 'api-key',
      actorId: apiKey.id,
      notificationDisabled: body?.notificationDisabled,
    })
    return { body: { ok: true, ...result } }
  } catch (error) {
    return externalDeliveryFailure(error)
  }
}

const sendExternalMessage = async ({ params, body, apiKey, authError, set }) => {
  if (authError) return authError
  const outcome = await deliverExternal({ params, body, apiKey })
  if (outcome.status) set.status = outcome.status
  return outcome.body
}

// Elysia cannot infer the union returned by an async derive in JavaScript.
const externalApi = /** @type {any} */ (new Elysia({ name: 'external-api' }))
  .derive(requireApiKey)
  .get('/v1/bots/:bot/chats', listExternalChats)
  .post('/v1/bots/:bot/chats/:chat/messages', sendExternalMessage)

export default externalApi
