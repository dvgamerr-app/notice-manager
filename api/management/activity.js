import { db } from '../../lib/db.js'
import { getActivityDetail, listActivity, parseFilters, summarizeActivity } from '../../lib/activity.js'
import {
  findBot,
  pageLimit,
  pageOffset,
  safeJson,
  unauthorized,
} from './shared.js'

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
    processingStatus: row.processing_status,
    attemptCount: row.attempt_count,
    lastAttemptAt: row.last_attempt_at,
    processedAt: row.processed_at,
    processingError: row.processing_error,
    receivedAt: row.received_at,
  }))
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

const withFilters = async ({ params, query, user, set }) => {
  if (!user) return { failure: unauthorized(set) }
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { failure: { error: 'Bot not found' } }
  }
  const chat = query?.chat
    ? await db
      .selectFrom('managed_chat')
      .select(['id', 'source_id'])
      .where('id', '=', String(query.chat))
      .where('bot_id', '=', bot.id)
      .executeTakeFirst()
    : null
  return { bot, chat: chat || null, unknownChat: Boolean(query?.chat) && !chat, filters: parseFilters(query) }
}

export const listActivityFeed = async (context) => {
  const { failure, bot, chat, unknownChat, filters } = await withFilters(context)
  if (failure) return failure
  if (unknownChat) return { items: [], nextCursor: null }
  return listActivity({
    bot,
    chat,
    filters,
    before: context.query?.before,
    limit: pageLimit(context.query, 100),
  })
}

export const getActivitySummary = async (context) => {
  const { failure, bot, chat, unknownChat, filters } = await withFilters(context)
  if (failure) return failure
  if (unknownChat) {
    const empty = { inbound: 0, outbound: 0, forward: 0, system: 0 }
    return { counts: empty, problems: empty }
  }
  return summarizeActivity({ bot, chat, filters })
}

export const getActivityItem = async ({ params, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const detail = await getActivityDetail({ bot, kind: params.kind, id: params.id })
  if (!detail) {
    set.status = 404
    return { error: 'Activity not found' }
  }
  return detail
}
