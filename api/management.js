import { randomUUID } from 'node:crypto'
import { createApiKey } from '../lib/api-keys.js'
import { audit } from '../lib/audit.js'
import { db } from '../lib/db.js'
import { deliverToChat } from '../lib/delivery.js'
import { LineApiError, lineClient, normalizeMessages } from '../lib/sdk-line.js'
import { decryptSecret, encryptSecret } from '../lib/secrets.js'

const nowIso = () => new Date().toISOString()
const publicBaseUrl = () =>
  (process.env.PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
const webhookUrl = (service) =>
  `${publicBaseUrl()}/webhooks/line/${encodeURIComponent(service)}`

const unauthorized = (set) => {
  set.status = 401
  return { error: 'Authentication required' }
}

const findBot = (service, userId) =>
  db
    .selectFrom('managed_bot')
    .selectAll()
    .where('service', '=', service)
    .where('owner_user_id', '=', userId)
    .executeTakeFirst()

const botView = (bot) => ({
  id: bot.id,
  service: bot.service,
  name: bot.name,
  botUserId: bot.bot_user_id,
  basicId: bot.basic_id,
  pictureUrl: bot.picture_url,
  active: Boolean(bot.active),
  webhookEndpoint: bot.webhook_endpoint,
  expectedWebhookEndpoint: webhookUrl(bot.service),
  verifiedAt: bot.verified_at,
  createdAt: bot.created_at,
  updatedAt: bot.updated_at,
})

const lineError = (error) => ({
  error: error.message || 'LINE API request failed',
  requestId: error.requestId || null,
  details: error.details || null,
})

const safeJson = (value, fallback = null) => {
  if (value == null || typeof value !== 'string') return value ?? fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const boundedInteger = (value, fallback, minimum, maximum) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(maximum, Math.max(minimum, Math.trunc(number)))
}

const pageLimit = (query, maximum = 100) =>
  boundedInteger(query?.limit, 50, 1, maximum)
const pageOffset = (query) => boundedInteger(query?.offset, 0, 0, 100_000)

export const getSession = async ({ user, set }) => {
  if (!user) return unauthorized(set)
  return { user }
}

export const listBots = async ({ user, set }) => {
  if (!user) return unauthorized(set)
  const bots = await db
    .selectFrom('managed_bot')
    .selectAll()
    .where('owner_user_id', '=', user.id)
    .orderBy('created_at', 'asc')
    .execute()

  const counts = await db
    .selectFrom('managed_chat')
    .select(['bot_id'])
    .select((expression) => expression.fn.countAll().as('chat_count'))
    .where('registered', '=', 1)
    .groupBy('bot_id')
    .execute()
  const countByBot = new Map(counts.map((row) => [row.bot_id, Number(row.chat_count)]))

  return bots.map((bot) => ({
    ...botView(bot),
    chatCount: countByBot.get(bot.id) || 0,
  }))
}

export const importLegacyBots = async ({ user, set }) => {
  if (!user) return unauthorized(set)
  const tables = await db.introspection.getTables()
  if (!tables.some((table) => table.name === 'line_bot')) {
    return { imported: 0, skipped: 0, errors: [], legacyTableFound: false }
  }

  const legacyBots = await db
    .selectFrom('line_bot')
    .select(['service', 'name', 'access_token', 'secret', 'active'])
    .execute()
  let imported = 0
  let skipped = 0
  const errors = []

  for (const legacy of legacyBots) {
    const service = String(legacy.service || '').trim().toLowerCase()
    if (
      !legacy.access_token ||
      !legacy.secret ||
      !/^[a-z0-9][a-z0-9_-]{1,63}$/.test(service)
    ) {
      skipped += 1
      errors.push({
        service: service || '(unknown)',
        error: 'Missing or invalid legacy credential',
      })
      continue
    }

    const existing = await db
      .selectFrom('managed_bot')
      .select('id')
      .where('service', '=', service)
      .executeTakeFirst()
    if (existing) {
      skipped += 1
      continue
    }

    try {
      const accessToken = decryptSecret(legacy.access_token)
      const channelSecret = decryptSecret(legacy.secret)
      const { data: info } = await lineClient(accessToken).getBotInfo()
      const now = nowIso()
      const importedBotId = randomUUID()
      await db
        .insertInto('managed_bot')
        .values({
          id: importedBotId,
          owner_user_id: user.id,
          service,
          name: legacy.name || info.displayName || service,
          channel_access_token: encryptSecret(accessToken),
          channel_secret: encryptSecret(channelSecret),
          bot_user_id: info.userId,
          basic_id: info.basicId || null,
          picture_url: info.pictureUrl || null,
          active: legacy.active === false || legacy.active === 0 ? 0 : 1,
          webhook_endpoint: null,
          verified_at: now,
          created_at: now,
          updated_at: now,
        })
        .execute()
      await audit({
        actorType: 'user',
        actorId: user.id,
        botId: importedBotId,
        action: 'bot.import',
        entityType: 'bot',
        entityId: importedBotId,
      })
      imported += 1
    } catch (error) {
      skipped += 1
      errors.push({ service, error: error.message || 'Unable to verify legacy bot' })
    }
  }

  return { imported, skipped, errors, legacyTableFound: true }
}

export const getBot = async ({ params, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  return botView(bot)
}

export const createBot = async ({ body, user, set }) => {
  if (!user) return unauthorized(set)
  const service = String(body?.service || '').trim().toLowerCase()
  const name = String(body?.name || service).trim()
  const accessToken = String(body?.channelAccessToken || body?.access_token || '').trim()
  const channelSecret = String(body?.channelSecret || body?.secret || '').trim()

  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(service)) {
    set.status = 400
    return { error: 'Service ID must be 2-64 lowercase letters, numbers, - or _' }
  }
  if (!accessToken || !channelSecret) {
    set.status = 400
    return { error: 'Channel access token and channel secret are required' }
  }

  try {
    const { data: info } = await lineClient(accessToken).getBotInfo()
    const duplicate = await db
      .selectFrom('managed_bot')
      .select(['id', 'service'])
      .where((expression) =>
        expression.or([
          expression('service', '=', service),
          expression('bot_user_id', '=', info.userId),
        ]))
      .executeTakeFirst()
    if (duplicate) {
      set.status = 409
      return { error: `Bot is already registered as ${duplicate.service}` }
    }

    const now = nowIso()
    const bot = {
      id: randomUUID(),
      owner_user_id: user.id,
      service,
      name: name || info.displayName || service,
      channel_access_token: encryptSecret(accessToken),
      channel_secret: encryptSecret(channelSecret),
      bot_user_id: info.userId,
      basic_id: info.basicId || null,
      picture_url: info.pictureUrl || null,
      active: 1,
      webhook_endpoint: null,
      verified_at: now,
      created_at: now,
      updated_at: now,
    }
    await db.insertInto('managed_bot').values(bot).execute()
    await audit({
      actorType: 'user',
      actorId: user.id,
      botId: bot.id,
      action: 'bot.create',
      entityType: 'bot',
      entityId: bot.id,
      metadata: { service: bot.service },
    })
    set.status = 201
    return botView(bot)
  } catch (error) {
    if (error instanceof LineApiError) set.status = 400
    else set.status = 500
    return lineError(error)
  }
}

export const updateBot = async ({ params, body, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }

  const updates = { updated_at: nowIso() }
  if (typeof body?.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (typeof body?.active === 'boolean') updates.active = body.active ? 1 : 0
  const accessToken = String(body?.channelAccessToken || '').trim()
  const channelSecret = String(body?.channelSecret || '').trim()
  if (accessToken || channelSecret) {
    if (!accessToken || !channelSecret) {
      set.status = 400
      return { error: 'Both channelAccessToken and channelSecret are required for rotation' }
    }
    try {
      const { data: info } = await lineClient(accessToken).getBotInfo()
      if (info.userId !== bot.bot_user_id) {
        set.status = 409
        return { error: 'The new token belongs to a different LINE Official Account' }
      }
      updates.channel_access_token = encryptSecret(accessToken)
      updates.channel_secret = encryptSecret(channelSecret)
      updates.basic_id = info.basicId || bot.basic_id
      updates.picture_url = info.pictureUrl || bot.picture_url
      updates.verified_at = nowIso()
    } catch (error) {
      set.status = error instanceof LineApiError ? 400 : 500
      return lineError(error)
    }
  }
  await db.updateTable('managed_bot').set(updates).where('id', '=', bot.id).execute()
  await audit({
    actorType: 'user',
    actorId: user.id,
    botId: bot.id,
    action: accessToken ? 'bot.credentials.rotate' : 'bot.update',
    entityType: 'bot',
    entityId: bot.id,
    metadata: {
      nameChanged: Boolean(updates.name),
      activeChanged: updates.active !== undefined,
    },
  })
  return getBot({ params, user, set })
}

export const getBotQuota = async ({ params, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  try {
    const client = lineClient(decryptSecret(bot.channel_access_token))
    const [{ data: quota }, { data: consumption }] = await Promise.all([
      client.getMessageQuota(),
      client.getMessageConsumption(),
    ])
    return { quota, consumption }
  } catch (error) {
    set.status = error instanceof LineApiError ? 400 : 500
    return lineError(error)
  }
}

export const syncBotWebhook = async ({ params, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }

  const endpoint = webhookUrl(bot.service)
  if (!endpoint.startsWith('https://')) {
    set.status = 400
    return {
      error: 'PUBLIC_BASE_URL must be a public HTTPS URL before syncing a LINE webhook',
      endpoint,
    }
  }

  try {
    const client = lineClient(decryptSecret(bot.channel_access_token))
    await client.setWebhookEndpoint(endpoint)
    const { data: current, requestId } = await client.getWebhookEndpoint()
    await db
      .updateTable('managed_bot')
      .set({
        webhook_endpoint: current.endpoint || endpoint,
        verified_at: nowIso(),
        updated_at: nowIso(),
      })
      .where('id', '=', bot.id)
      .execute()
    await audit({
      actorType: 'user',
      actorId: user.id,
      botId: bot.id,
      action: 'bot.webhook.sync',
      entityType: 'bot',
      entityId: bot.id,
      metadata: { endpoint: current.endpoint || endpoint },
    })
    return { ok: true, endpoint: current.endpoint || endpoint, active: current.active, requestId }
  } catch (error) {
    set.status = error instanceof LineApiError ? 400 : 500
    return lineError(error)
  }
}

export const testBotWebhook = async ({ params, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }

  try {
    const client = lineClient(decryptSecret(bot.channel_access_token))
    const { data: current } = await client.getWebhookEndpoint()
    const { data, requestId } = await client.testWebhookEndpoint()
    return {
      ok: data.success === true,
      endpoint: current.endpoint,
      active: current.active,
      reason: data.reason || null,
      detail: data.detail || null,
      requestId,
    }
  } catch (error) {
    set.status = error instanceof LineApiError ? 400 : 500
    return lineError(error)
  }
}

export const listChats = async ({ params, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const rows = await db
    .selectFrom('managed_chat')
    .selectAll()
    .where('bot_id', '=', bot.id)
    .orderBy('last_seen_at', 'desc')
    .execute()
  return rows.map((row) => ({
    id: row.id,
    sourceId: row.source_id,
    type: row.source_type,
    name: row.display_name,
    lineName: row.line_display_name || row.display_name,
    pictureUrl: row.picture_url || null,
    metadata: safeJson(row.metadata_payload, {}),
    active: Boolean(row.active),
    registered: Boolean(row.registered),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    updatedAt: row.updated_at || row.last_seen_at,
  }))
}

export const updateChat = async ({ params, body, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const chat = await db
    .selectFrom('managed_chat')
    .selectAll()
    .where('id', '=', params.chat)
    .where('bot_id', '=', bot.id)
    .executeTakeFirst()
  if (!chat) {
    set.status = 404
    return { error: 'Chat not found' }
  }

  const updates = { updated_at: nowIso() }
  if (typeof body?.name === 'string') updates.display_name = body.name.trim()
  if (typeof body?.registered === 'boolean') updates.registered = body.registered ? 1 : 0
  if (typeof body?.active === 'boolean') updates.active = body.active ? 1 : 0
  if (Object.keys(updates).length) {
    await db.updateTable('managed_chat').set(updates).where('id', '=', chat.id).execute()
  }
  await audit({
    actorType: 'user',
    actorId: user.id,
    botId: bot.id,
    action: 'chat.update',
    entityType: 'chat',
    entityId: chat.id,
    metadata: {
      nameChanged: typeof body?.name === 'string',
      registered: body?.registered,
      active: body?.active,
    },
  })
  return { ok: true }
}

export const refreshChat = async ({ params, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const chat = await db
    .selectFrom('managed_chat')
    .selectAll()
    .where('id', '=', params.chat)
    .where('bot_id', '=', bot.id)
    .executeTakeFirst()
  if (!chat) {
    set.status = 404
    return { error: 'Chat not found' }
  }

  try {
    const client = lineClient(decryptSecret(bot.channel_access_token))
    let metadata = {}
    let displayName = chat.display_name
    let pictureUrl = chat.picture_url
    if (chat.source_type === 'user') {
      const { data } = await client.getProfile(chat.source_id)
      metadata = data
      displayName = data.displayName || displayName
      pictureUrl = data.pictureUrl || pictureUrl
    } else if (chat.source_type === 'group') {
      const { data } = await client.getGroupSummary(chat.source_id)
      metadata = data
      displayName = data.groupName || displayName
      pictureUrl = data.pictureUrl || pictureUrl
    } else {
      metadata = { note: 'LINE does not provide a room summary endpoint' }
    }
    await db
      .updateTable('managed_chat')
      .set({
        display_name: chat.display_name || displayName,
        line_display_name: displayName,
        picture_url: pictureUrl,
        metadata_payload: JSON.stringify(metadata),
        updated_at: nowIso(),
      })
      .where('id', '=', chat.id)
      .execute()
    await audit({
      actorType: 'user',
      actorId: user.id,
      botId: bot.id,
      action: 'chat.metadata.refresh',
      entityType: 'chat',
      entityId: chat.id,
    })
    return {
      ok: true,
      name: chat.display_name || displayName,
      lineName: displayName,
      pictureUrl,
      metadata,
    }
  } catch (error) {
    set.status = error instanceof LineApiError ? 400 : 500
    return lineError(error)
  }
}

export const leaveChat = async ({ params, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const chat = await db
    .selectFrom('managed_chat')
    .selectAll()
    .where('id', '=', params.chat)
    .where('bot_id', '=', bot.id)
    .executeTakeFirst()
  if (!chat) {
    set.status = 404
    return { error: 'Chat not found' }
  }
  if (chat.source_type === 'user') {
    set.status = 400
    return { error: 'A bot cannot leave a one-on-one chat. Unregister it instead.' }
  }

  try {
    const client = lineClient(decryptSecret(bot.channel_access_token))
    if (chat.source_type === 'group') await client.leaveGroup(chat.source_id)
    else await client.leaveRoom(chat.source_id)
    await db
      .updateTable('managed_chat')
      .set({ active: 0, registered: 0, updated_at: nowIso() })
      .where('id', '=', chat.id)
      .execute()
    await audit({
      actorType: 'user',
      actorId: user.id,
      botId: bot.id,
      action: 'chat.leave',
      entityType: 'chat',
      entityId: chat.id,
    })
    return { ok: true }
  } catch (error) {
    set.status = error instanceof LineApiError ? 400 : 500
    return lineError(error)
  }
}

export const bulkUpdateChats = async ({ params, body, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const chatIds = [...new Set(body?.chatIds || [])].slice(0, 100)
  if (!chatIds.length || typeof body?.registered !== 'boolean') {
    set.status = 400
    return { error: 'chatIds and registered are required' }
  }
  const result = await db
    .updateTable('managed_chat')
    .set({ registered: body.registered ? 1 : 0, updated_at: nowIso() })
    .where('bot_id', '=', bot.id)
    .where('id', 'in', chatIds)
    .executeTakeFirst()
  await audit({
    actorType: 'user',
    actorId: user.id,
    botId: bot.id,
    action: 'chat.bulk-register',
    entityType: 'bot',
    entityId: bot.id,
    metadata: { registered: body.registered, requested: chatIds.length },
  })
  return { ok: true, updated: Number(result.numUpdatedRows || 0) }
}

export const testChat = async ({ params, body, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const chat = await db
    .selectFrom('managed_chat')
    .selectAll()
    .where('id', '=', params.chat)
    .where('bot_id', '=', bot.id)
    .where('registered', '=', 1)
    .executeTakeFirst()
  if (!chat) {
    set.status = 404
    return { error: 'Registered chat not found' }
  }
  if (!chat.active) {
    set.status = 409
    return { error: 'Chat is inactive. The bot may have left or been blocked.' }
  }

  let messages
  try {
    messages = normalizeMessages(
      body?.messages || { type: 'text', text: String(body?.message || 'ทดสอบจาก LINE Manager') },
    )
  } catch (error) {
    set.status = 400
    return { error: error.message }
  }

  try {
    const result = await deliverToChat({
      bot,
      chat,
      messages,
      actorType: 'user',
      actorId: user.id,
      notificationDisabled: body?.notificationDisabled,
    })
    return { ok: true, ...result }
  } catch (error) {
    set.status = error instanceof LineApiError || error instanceof TypeError ? 400 : 500
    return { ...lineError(error), deliveryId: error.deliveryId || null }
  }
}

export const bulkTestChats = async ({ params, body, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const chatIds = [...new Set(body?.chatIds || [])].slice(0, 20)
  if (!chatIds.length) {
    set.status = 400
    return { error: 'Select between 1 and 20 chats' }
  }
  let messages
  try {
    messages = normalizeMessages(
      body?.messages || { type: 'text', text: String(body?.message || 'ทดสอบจาก LINE Manager') },
    )
  } catch (error) {
    set.status = 400
    return { error: error.message }
  }
  const chats = await db
    .selectFrom('managed_chat')
    .selectAll()
    .where('bot_id', '=', bot.id)
    .where('id', 'in', chatIds)
    .where('registered', '=', 1)
    .where('active', '=', 1)
    .execute()
  const results = []
  for (const chat of chats) {
    try {
      const result = await deliverToChat({
        bot,
        chat,
        messages,
        actorType: 'user',
        actorId: user.id,
        notificationDisabled: body?.notificationDisabled,
      })
      results.push({ chatId: chat.id, ok: true, ...result })
    } catch (error) {
      results.push({
        chatId: chat.id,
        ok: false,
        deliveryId: error.deliveryId || null,
        error: error.message,
      })
    }
  }
  return {
    ok: results.every((result) => result.ok),
    requested: chatIds.length,
    attempted: chats.length,
    sent: results.filter((result) => result.ok).length,
    results,
  }
}

export const listDeliveries = async ({ params, query, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  let request = db
    .selectFrom('managed_delivery')
    .select([
      'id',
      'chat_id',
      'recipient_id',
      'message_payload',
      'status',
      'line_request_id',
      'error',
      'created_at',
      'sent_at',
    ])
    .where('bot_id', '=', bot.id)
  if (query?.status && ['pending', 'sent', 'failed'].includes(query.status)) {
    request = request.where('status', '=', query.status)
  }
  const rows = await request
    .orderBy('created_at', 'desc')
    .limit(pageLimit(query))
    .offset(pageOffset(query))
    .execute()
  return rows.map((row) => ({
    id: row.id,
    chatId: row.chat_id,
    recipientId: row.recipient_id,
    messages: safeJson(row.message_payload, []),
    status: row.status,
    requestId: row.line_request_id,
    error: row.error,
    createdAt: row.created_at,
    sentAt: row.sent_at,
  }))
}

export const listWebhookEvents = async ({ params, query, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  let request = db
    .selectFrom('managed_webhook_event')
    .selectAll()
    .where('bot_id', '=', bot.id)
  if (query?.type) request = request.where('event_type', '=', query.type)
  const rows = await request
    .orderBy('received_at', 'desc')
    .limit(pageLimit(query))
    .offset(pageOffset(query))
    .execute()
  return rows.map((row) => ({
    id: row.id,
    webhookEventId: row.webhook_event_id,
    type: row.event_type,
    sourceId: row.source_id,
    payload: safeJson(row.payload, {}),
    redelivery: Boolean(row.is_redelivery),
    receivedAt: row.received_at,
  }))
}

export const listApiKeys = async ({ params, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const rows = await db
    .selectFrom('managed_api_key')
    .select([
      'id',
      'name',
      'key_prefix',
      'active',
      'last_used_at',
      'created_at',
      'revoked_at',
    ])
    .where('bot_id', '=', bot.id)
    .orderBy('created_at', 'desc')
    .execute()
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    prefix: row.key_prefix,
    active: Boolean(row.active),
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  }))
}

export const addApiKey = async ({ params, body, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const name = String(body?.name || '').trim()
  if (!name || name.length > 100) {
    set.status = 400
    return { error: 'API key name is required and must be 100 characters or less' }
  }
  const { row, key } = await createApiKey({
    ownerUserId: user.id,
    botId: bot.id,
    name,
  })
  await audit({
    actorType: 'user',
    actorId: user.id,
    botId: bot.id,
    action: 'api-key.create',
    entityType: 'api-key',
    entityId: row.id,
    metadata: { botId: bot.id, prefix: row.key_prefix },
  })
  set.status = 201
  return {
    id: row.id,
    name: row.name,
    prefix: row.key_prefix,
    key,
    createdAt: row.created_at,
    warning: 'Copy this key now. It will not be shown again.',
  }
}

export const revokeApiKey = async ({ params, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const key = await db
    .selectFrom('managed_api_key')
    .select('id')
    .where('id', '=', params.key)
    .where('bot_id', '=', bot.id)
    .executeTakeFirst()
  if (!key) {
    set.status = 404
    return { error: 'API key not found' }
  }
  const now = nowIso()
  await db
    .updateTable('managed_api_key')
    .set({ active: 0, revoked_at: now })
    .where('id', '=', key.id)
    .execute()
  await audit({
    actorType: 'user',
    actorId: user.id,
    botId: bot.id,
    action: 'api-key.revoke',
    entityType: 'api-key',
    entityId: key.id,
    metadata: { botId: bot.id },
  })
  return { ok: true, revokedAt: now }
}

export const listAuditLogs = async ({ params, query, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const rows = await db
    .selectFrom('managed_audit_log')
    .selectAll()
    .where('bot_id', '=', bot.id)
    .orderBy('created_at', 'desc')
    .limit(pageLimit(query))
    .offset(pageOffset(query))
    .execute()
  return rows.map((row) => ({
    id: row.id,
    actorType: row.actor_type,
    actorId: row.actor_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: safeJson(row.metadata_payload, {}),
    createdAt: row.created_at,
  }))
}
