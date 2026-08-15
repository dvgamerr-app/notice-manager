import { randomUUID } from 'node:crypto'
import { db } from '../../lib/db.js'
import { lineClient, verifySignature } from '../../lib/sdk-line.js'
import { decryptSecret } from '../../lib/secrets.js'

const nowIso = () => new Date().toISOString()
const safeJson = (value) => {
  try {
    return value ? JSON.parse(value) : {}
  } catch {
    return {}
  }
}
const sourceId = (source) =>
  source?.userId || source?.groupId || source?.roomId || null

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

const saveEvent = async (bot, event, rawEvent) => {
  const id = sourceId(event.source)
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
      received_at: nowIso(),
    })
    .onConflict((conflict) =>
      conflict.columns(['bot_id', 'webhook_event_id']).doNothing())
    .returning('id')
    .executeTakeFirst()
  return Boolean(inserted)
}

const upsertChat = async (bot, event, client) => {
  const id = sourceId(event.source)
  if (!id || !event.source?.type) return null

  const current = await db
    .selectFrom('managed_chat')
    .selectAll()
    .where('bot_id', '=', bot.id)
    .where('source_id', '=', id)
    .executeTakeFirst()
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
    if (!await saveEvent(bot, event, event)) {
      duplicates += 1
      continue
    }
    const chat = await upsertChat(bot, event, client)
    accepted += 1

    const text = event.type === 'message' && event.message?.type === 'text'
      ? event.message.text.trim()
      : ''
    if (chat && event.replyToken && /^\/(?:register|join)$/i.test(text)) {
      await db.updateTable('managed_chat').set({ registered: 1, active: 1 })
        .where('id', '=', chat.id).execute()
      await client.reply(event.replyToken, 'ลงทะเบียนห้องนี้ใน LINE Manager แล้ว')
    } else if (chat && event.replyToken && /^\/id$/i.test(text)) {
      await client.reply(
        event.replyToken,
        `Chat ID: ${chat.source_id}\nType: ${chat.source_type}`,
      )
    }
  }

  return { ok: true, accepted, duplicates }
}
