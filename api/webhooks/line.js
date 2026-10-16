import { randomUUID } from 'node:crypto'
import { db } from '../../lib/db.js'
import { lineClient, verifySignature } from '../../lib/sdk-line.js'
import { decryptSecret } from '../../lib/secrets.js'
import { logger } from '../../lib/logger.js'
import { enqueueForwards } from '../../lib/webhook-forward.js'

// Commands answered by this application. They are consumed here and are not
// forwarded to external webhook targets.
const OWN_COMMAND = /^\/(?:hi|id)$/i

const nowIso = () => new Date().toISOString()
const safeJson = (value) => {
  try {
    return value ? JSON.parse(value) : {}
  } catch {
    return {}
  }
}

// The recipient is chosen strictly from source.type; never fall back to another ID,
// because group/room events also carry the sender's userId.
const SOURCE_ID_FIELD = { user: 'userId', group: 'groupId', room: 'roomId' }
const sourceId = (source) => {
  const type = source?.type
  if (!Object.hasOwn(SOURCE_ID_FIELD, type)) return null
  return source[SOURCE_ID_FIELD[type]] || null
}

const metadataResolvers = {
  user: async (client, source) => {
    const { data } = await client.getProfile(source.userId)
    return {
      displayName: data.displayName || '',
      pictureUrl: data.pictureUrl || null,
      metadata: data,
    }
  },
  group: async (client, source) => {
    const { data } = await client.getGroupSummary(source.groupId)
    return {
      displayName: data.groupName || '',
      pictureUrl: data.pictureUrl || null,
      metadata: data,
    }
  },
  room: async () => ({
    displayName: 'Multi-person chat',
    pictureUrl: null,
    metadata: { note: 'LINE does not provide a room summary endpoint' },
  }),
}

const resolveMetadata = async (client, source) => {
  try {
    if (Object.hasOwn(metadataResolvers, source.type)) {
      return await metadataResolvers[source.type](client, source)
    }
  } catch {
    // A chat can still be registered even when profile/summary permission fails.
  }
  return { displayName: '', pictureUrl: null, metadata: {} }
}

// Re-claims a redelivered event that previously failed or whose processing went stale.
const reclaimEvent = async (bot, event, attemptAt) => {
  const retry = async (status, staleBefore = null) => {
    let claim = db
      .updateTable('managed_webhook_event')
      .set((expression) => ({
        processing_status: 'processing',
        attempt_count: expression('attempt_count', '+', 1),
        last_attempt_at: attemptAt,
        processing_error: null,
        is_redelivery: event.deliveryContext?.isRedelivery ? 1 : 0,
      }))
      .where('bot_id', '=', bot.id)
      .where('webhook_event_id', '=', event.webhookEventId)
      .where('processing_status', '=', status)
    if (staleBefore) claim = claim.where('last_attempt_at', '<', staleBefore)
    return claim.returning('id').executeTakeFirst()
  }

  const failed = await retry('failed')
  if (failed) return failed.id
  const staleBefore = new Date(Date.now() - 5 * 60_000).toISOString()
  return (await retry('processing', staleBefore))?.id || null
}

const claimEvent = async (bot, event, rawEvent) => {
  const id = sourceId(event.source)
  const attemptAt = nowIso()
  const inserted = await db
    .insertInto('managed_webhook_event')
    .values({
      id: randomUUID(),
      bot_id: bot.id,
      webhook_event_id: event.webhookEventId || null,
      event_type: event.type || 'unknown',
      source_id: id,
      payload: JSON.stringify(rawEvent),
      is_redelivery: event.deliveryContext?.isRedelivery ? 1 : 0,
      received_at: attemptAt,
      processing_status: 'processing',
      attempt_count: 1,
      last_attempt_at: attemptAt,
    })
    .onConflict((conflict) =>
      conflict.columns(['bot_id', 'webhook_event_id']).doNothing())
    .returning('id')
    .executeTakeFirst()
  if (inserted) return inserted.id
  if (!event.webhookEventId) return null
  return reclaimEvent(bot, event, attemptAt)
}

const finishEvent = (eventId) => db
  .updateTable('managed_webhook_event')
  .set({
    processing_status: 'processed',
    processed_at: nowIso(),
    processing_error: null,
  })
  .where('id', '=', eventId)
  .execute()

const failEvent = async (eventId, error) => {
  try {
    await db
      .updateTable('managed_webhook_event')
      .set({
        processing_status: 'failed',
        processing_error: String(error?.message || error).slice(0, 2_000),
      })
      .where('id', '=', eventId)
      .execute()
  } catch (recordError) {
    logger.error(
      { err: recordError, webhookEventRecordId: eventId },
      'Unable to persist webhook processing failure',
    )
  }
}

// Finds the stored chat, repairing a legacy group/room row keyed by the sender's userId.
const findCurrentChat = async (bot, event, id) => {
  const current = await db
    .selectFrom('managed_chat')
    .selectAll()
    .where('bot_id', '=', bot.id)
    .where('source_id', '=', id)
    .executeTakeFirst()
  if (current || !['group', 'room'].includes(event.source.type) || !event.source.userId) {
    return current
  }
  return db
    .selectFrom('managed_chat')
    .selectAll()
    .where('bot_id', '=', bot.id)
    .where('source_id', '=', event.source.userId)
    .where('source_type', '=', event.source.type)
    .executeTakeFirst()
}

const updateExistingChat = async (current, event, resolved, active) => {
  const id = sourceId(event.source)
  const now = nowIso()
  await db
    .updateTable('managed_chat')
    .set({
      source_id: id,
      source_type: event.source.type,
      line_display_name: resolved.displayName,
      picture_url: resolved.pictureUrl,
      metadata_payload: JSON.stringify(resolved.metadata),
      active: active ? 1 : 0,
      last_seen_at: now,
      updated_at: now,
    })
    .where('id', '=', current.id)
    .execute()
  return {
    ...current,
    id: current.id,
    source_id: id,
    source_type: event.source.type,
    display_name: current.display_name,
    line_display_name: resolved.displayName,
    picture_url: resolved.pictureUrl,
    active: active ? 1 : 0,
  }
}

const upsertChat = async (bot, event, client) => {
  const id = sourceId(event.source)
  if (!id || !event.source?.type) return null

  const current = await findCurrentChat(bot, event, id)
  const resolved = current
    ? {
        displayName: current.line_display_name || current.display_name,
        pictureUrl: current.picture_url,
        metadata: safeJson(current.metadata_payload),
      }
    : await resolveMetadata(client, event.source)
  const active = !['leave', 'unfollow'].includes(event.type)

  if (current) return updateExistingChat(current, event, resolved, active)
  const now = nowIso()

  const chat = {
    id: randomUUID(),
    bot_id: bot.id,
    source_id: id,
    source_type: event.source.type,
    display_name: resolved.displayName,
    line_display_name: resolved.displayName,
    picture_url: resolved.pictureUrl,
    metadata_payload: JSON.stringify(resolved.metadata),
    active: active ? 1 : 0,
    registered: active ? 1 : 0,
    first_seen_at: now,
    last_seen_at: now,
    updated_at: now,
  }
  await db.insertInto('managed_chat').values(chat).execute()
  return chat
}

// Answers /hi and /id for a chat that can be replied to.
const answerOwnCommand = async (client, event, chat, text) => {
  if (!chat || !event.replyToken) return
  if (/^\/hi$/i.test(text)) {
    await db.updateTable('managed_chat').set({ registered: 1, active: 1 })
      .where('id', '=', chat.id).execute()
    await client.reply(event.replyToken, 'ลงทะเบียนห้องนี้ใน LINE Manager แล้ว')
  } else if (/^\/id$/i.test(text)) {
    await client.reply(
      event.replyToken,
      `Chat ID: ${chat.source_id}\nType: ${chat.source_type}`,
    )
  }
}

const processEvent = async (bot, client, event, eventId) => {
  const chat = await upsertChat(bot, event, client)

  const text = event.type === 'message' && event.message?.type === 'text'
    ? event.message.text.trim()
    : ''
  await answerOwnCommand(client, event, chat, text)
  if (!OWN_COMMAND.test(text)) {
    await enqueueForwards({ bot, eventRecordId: eventId, chatId: chat?.id || null })
  }
  await finishEvent(eventId)
}

const failure = (status, error) => ({ failure: { status, body: { error } } })

// Resolves the bot and checks the signature, JSON body and destination.
const verifyRequest = async ({ params, body, headers }) => {
  const bot = await db
    .selectFrom('managed_bot')
    .selectAll()
    .where('service', '=', params.bot)
    .where('active', '=', 1)
    .executeTakeFirst()
  if (!bot) return failure(404, 'Bot not found')

  const rawBody = typeof body === 'string' ? body : JSON.stringify(body || {})
  if (!verifySignature(
    decryptSecret(bot.channel_secret),
    rawBody,
    headers['x-line-signature'],
  )) {
    return failure(401, 'Invalid or missing LINE webhook signature')
  }

  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return failure(400, 'Invalid JSON body')
  }
  if (payload.destination && payload.destination !== bot.bot_user_id) {
    return failure(400, 'Webhook destination does not match this bot')
  }
  return { bot, payload }
}

export default async ({ params, body, headers, set }) => {
  const verified = await verifyRequest({ params, body, headers })
  if (verified.failure) {
    set.status = verified.failure.status
    return verified.failure.body
  }
  const { bot, payload } = verified

  const client = lineClient(decryptSecret(bot.channel_access_token))
  let accepted = 0
  let duplicates = 0
  for (const event of payload.events || []) {
    const eventId = await claimEvent(bot, event, event)
    if (!eventId) {
      duplicates += 1
      continue
    }
    try {
      await processEvent(bot, client, event, eventId)
      accepted += 1
    } catch (error) {
      await failEvent(eventId, error)
      throw error
    }
  }

  return { ok: true, accepted, duplicates }
}
