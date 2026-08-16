import { randomUUID } from 'node:crypto'
import { db } from '../../lib/db.js'
import { lineClient, verifySignature } from '../../lib/sdk-line.js'
import { decryptSecret } from '../../lib/secrets.js'
import { logger } from '../../lib/logger.js'

const nowIso = () => new Date().toISOString()
const safeJson = (value) => {
  try {
    return value ? JSON.parse(value) : {}
  } catch {
    return {}
  }
}
const sourceId = (source) => {
  if (source?.type === 'user') return source.userId || null
  if (source?.type === 'group') return source.groupId || null
  if (source?.type === 'room') return source.roomId || null
  return null
}

const resolveMetadata = async (client, source) => {
  try {
    if (source.type === 'user') {
      const { data } = await client.getProfile(source.userId)
      return {
        displayName: data.displayName || '',
        pictureUrl: data.pictureUrl || null,
        metadata: data,
      }
    }
    if (source.type === 'group') {
      const { data } = await client.getGroupSummary(source.groupId)
      return {
        displayName: data.groupName || '',
        pictureUrl: data.pictureUrl || null,
        metadata: data,
      }
    }
    if (source.type === 'room') {
      return {
        displayName: 'Multi-person chat',
        pictureUrl: null,
        metadata: { note: 'LINE does not provide a room summary endpoint' },
      }
    }
  } catch {
    // A chat can still be registered even when profile/summary permission fails.
  }
  return { displayName: '', pictureUrl: null, metadata: {} }
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

const upsertChat = async (bot, event, client) => {
  const id = sourceId(event.source)
  if (!id || !event.source?.type) return null

  let current = await db
    .selectFrom('managed_chat')
    .selectAll()
    .where('bot_id', '=', bot.id)
    .where('source_id', '=', id)
    .executeTakeFirst()
  if (!current && ['group', 'room'].includes(event.source.type) && event.source.userId) {
    current = await db
      .selectFrom('managed_chat')
      .selectAll()
      .where('bot_id', '=', bot.id)
      .where('source_id', '=', event.source.userId)
      .where('source_type', '=', event.source.type)
      .executeTakeFirst()
  }
  const resolved = current
    ? {
        displayName: current.line_display_name || current.display_name,
        pictureUrl: current.picture_url,
        metadata: safeJson(current.metadata_payload),
      }
    : await resolveMetadata(client, event.source)
  const now = nowIso()
  const active = !['leave', 'unfollow'].includes(event.type)

  if (current) {
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

export default async ({ params, body, headers, set }) => {
  const bot = await db
    .selectFrom('managed_bot')
    .selectAll()
    .where('service', '=', params.bot)
    .where('active', '=', 1)
    .executeTakeFirst()
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }

  const rawBody = typeof body === 'string' ? body : JSON.stringify(body || {})
  if (!verifySignature(
    decryptSecret(bot.channel_secret),
    rawBody,
    headers['x-line-signature'],
  )) {
    set.status = 401
    return { error: 'Invalid or missing LINE webhook signature' }
  }

  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    set.status = 400
    return { error: 'Invalid JSON body' }
  }
  if (payload.destination && payload.destination !== bot.bot_user_id) {
    set.status = 400
    return { error: 'Webhook destination does not match this bot' }
  }

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
      const chat = await upsertChat(bot, event, client)

      const text = event.type === 'message' && event.message?.type === 'text'
        ? event.message.text.trim()
        : ''
      if (chat && event.replyToken && /^\/hi$/i.test(text)) {
        await db.updateTable('managed_chat').set({ registered: 1, active: 1 })
          .where('id', '=', chat.id).execute()
        await client.reply(event.replyToken, 'ลงทะเบียนห้องนี้ใน LINE Manager แล้ว')
      } else if (chat && event.replyToken && /^\/id$/i.test(text)) {
        await client.reply(
          event.replyToken,
          `Chat ID: ${chat.source_id}\nType: ${chat.source_type}`,
        )
      }
      await finishEvent(eventId)
      accepted += 1
    } catch (error) {
      await failEvent(eventId, error)
      throw error
    }
  }

  return { ok: true, accepted, duplicates }
}
