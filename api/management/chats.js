import { audit } from '../../lib/audit.js'
import { db } from '../../lib/db.js'
import { deliverToChat } from '../../lib/delivery.js'
import { LineApiError, lineClient, normalizeMessages } from '../../lib/sdk-line.js'
import { decryptSecret } from '../../lib/secrets.js'
import {
  findBot,
  lineError,
  nowIso,
  safeJson,
  unauthorized,
} from './shared.js'

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

// Resolves the authenticated owner's bot. `error` is the ready-to-return response body.
const loadBot = async ({ params, user, set }) => {
  if (!user) return { error: unauthorized(set) }
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: { error: 'Bot not found' } }
  }
  return { bot }
}

// Resolves a chat under the selected bot; options tighten the lookup for sends.
const loadChat = async (
  context,
  { registeredOnly = false, requireActive = false, missing = 'Chat not found' } = {},
) => {
  const scope = await loadBot(context)
  if (scope.error) return scope
  const { params, set } = context
  let query = db
    .selectFrom('managed_chat')
    .selectAll()
    .where('id', '=', params.chat)
    .where('bot_id', '=', scope.bot.id)
  if (registeredOnly) query = query.where('registered', '=', 1)
  const chat = await query.executeTakeFirst()
  if (!chat) {
    set.status = 404
    return { error: { error: missing } }
  }
  if (requireActive && !chat.active) {
    set.status = 409
    return { error: { error: 'Chat is inactive. The bot may have left or been blocked.' } }
  }
  return { ...scope, chat }
}

export const updateChat = async (context) => {
  const { body, user } = context
  const scope = await loadChat(context)
  if (scope.error) return scope.error
  const { bot, chat } = scope

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

// Reads LINE's profile/summary for a chat by its source type.
const fetchChatMetadata = async (client, chat) => {
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
  return { metadata, displayName, pictureUrl }
}

export const refreshChat = async (context) => {
  const { user, set } = context
  const scope = await loadChat(context)
  if (scope.error) return scope.error
  const { bot, chat } = scope

  try {
    const client = lineClient(decryptSecret(bot.channel_access_token))
    const { metadata, displayName, pictureUrl } = await fetchChatMetadata(client, chat)
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

export const leaveChat = async (context) => {
  const { user, set } = context
  const scope = await loadChat(context)
  if (scope.error) return scope.error
  const { bot, chat } = scope
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

export const bulkUpdateChats = async (context) => {
  const { body, user, set } = context
  const scope = await loadBot(context)
  if (scope.error) return scope.error
  const { bot } = scope
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

// Validates the message payload with the SDK; `error` is a ready-to-return 400 body.
const parseTestMessages = (body) => {
  try {
    return {
      messages: normalizeMessages(
        body?.messages || { type: 'text', text: String(body?.message || 'ทดสอบจาก LINE Manager') },
      ),
    }
  } catch (error) {
    return { error: { error: error.message } }
  }
}

export const testChat = async (context) => {
  const { body, user, set } = context
  const scope = await loadChat(context, {
    registeredOnly: true,
    requireActive: true,
    missing: 'Registered chat not found',
  })
  if (scope.error) return scope.error
  const { bot, chat } = scope

  const parsed = parseTestMessages(body)
  if (parsed.error) {
    set.status = 400
    return parsed.error
  }

  try {
    const result = await deliverToChat({
      bot,
      chat,
      messages: parsed.messages,
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

export const bulkTestChats = async (context) => {
  const { body, user, set } = context
  const scope = await loadBot(context)
  if (scope.error) return scope.error
  const { bot } = scope
  const chatIds = [...new Set(body?.chatIds || [])].slice(0, 20)
  if (!chatIds.length) {
    set.status = 400
    return { error: 'Select between 1 and 20 chats' }
  }
  const parsed = parseTestMessages(body)
  if (parsed.error) {
    set.status = 400
    return parsed.error
  }
  const { messages } = parsed
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
