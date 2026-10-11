import { randomUUID } from 'node:crypto'
import { audit } from '../../lib/audit.js'
import { db } from '../../lib/db.js'
import {
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_TIMEOUT_MS,
  FAILING_THRESHOLD,
  generateTargetSecret,
  kickForwardWorker,
  sendToTarget,
  storeTargetSecret,
  validateTargetUrl,
} from '../../lib/webhook-forward.js'
import {
  findBot,
  nowIso,
  pageLimit,
  pageOffset,
  unauthorized,
} from './shared.js'

const health = (row) => {
  if (!row.enabled) return 'disabled'
  if (
    (row.paused_until && row.paused_until > nowIso())
    || row.consecutive_failures >= FAILING_THRESHOLD
  ) return 'failing'
  if (row.consecutive_failures > 0) return 'degraded'
  return row.last_success_at ? 'healthy' : 'unknown'
}

const targetView = (row, counts = {}) => ({
  id: row.id,
  name: row.name,
  url: row.url,
  chatId: row.chat_id,
  enabled: Boolean(row.enabled),
  timeoutMs: row.timeout_ms,
  maxAttempts: row.max_attempts,
  health: health(row),
  consecutiveFailures: row.consecutive_failures,
  pausedUntil: row.paused_until,
  lastSuccessAt: row.last_success_at,
  lastFailureAt: row.last_failure_at,
  lastHttpStatus: row.last_http_status,
  lastError: row.last_error,
  counts: {
    pending: counts.pending || 0,
    succeeded: counts.succeeded || 0,
    dead: counts.dead || 0,
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const loadCounts = async (targetIds) => {
  const byTarget = new Map()
  if (!targetIds.length) return byTarget
  const rows = await db
    .selectFrom('managed_webhook_forward')
    .select(['target_id', 'status', (eb) => eb.fn.countAll().as('total')])
    .where('target_id', 'in', targetIds)
    .groupBy(['target_id', 'status'])
    .execute()
  for (const row of rows) {
    const counts = byTarget.get(row.target_id) || {}
    // `sending` is an in-flight attempt, shown together with waiting work.
    const key = row.status === 'sending' ? 'pending' : row.status
    counts[key] = (counts[key] || 0) + Number(row.total)
    byTarget.set(row.target_id, counts)
  }
  return byTarget
}

const withBot = async ({ params, user, set }) => {
  if (!user) return { failure: unauthorized(set) }
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { failure: { error: 'Bot not found' } }
  }
  return { bot }
}

const findTarget = (bot, id) =>
  db
    .selectFrom('managed_webhook_target')
    .selectAll()
    .where('id', '=', id)
    .where('bot_id', '=', bot.id)
    .executeTakeFirst()

const boundedInteger = (value, minimum, maximum, label) => {
  const number = Number(value)
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new TypeError(`${label} must be an integer between ${minimum} and ${maximum}`)
  }
  return number
}

// Returns the validated column changes for the fields present in `body`.
const parseTargetFields = async (bot, body) => {
  const fields = {}
  if ('name' in body) {
    const name = String(body.name || '').trim()
    if (!name || name.length > 100) {
      throw new TypeError('Name is required and must be 100 characters or less')
    }
    fields.name = name
  }
  if ('url' in body) fields.url = validateTargetUrl(body.url)
  if ('chatId' in body) {
    if (body.chatId) {
      const chat = await db
        .selectFrom('managed_chat')
        .select('id')
        .where('id', '=', String(body.chatId))
        .where('bot_id', '=', bot.id)
        .executeTakeFirst()
      if (!chat) throw new TypeError('Chat not found for this bot')
      fields.chat_id = chat.id
    } else {
      fields.chat_id = null
    }
  }
  if ('enabled' in body) fields.enabled = body.enabled ? 1 : 0
  if ('timeoutMs' in body) {
    fields.timeout_ms = boundedInteger(body.timeoutMs, 1_000, 15_000, 'timeoutMs')
  }
  if ('maxAttempts' in body) {
    fields.max_attempts = boundedInteger(body.maxAttempts, 1, 10, 'maxAttempts')
  }
  return fields
}

export const listForwards = async (context) => {
  const { bot, failure } = await withBot(context)
  if (!bot) return failure
  const rows = await db
    .selectFrom('managed_webhook_target')
    .selectAll()
    .where('bot_id', '=', bot.id)
    .orderBy('created_at', 'asc')
    .execute()
  const counts = await loadCounts(rows.map((row) => row.id))
  return rows.map((row) => targetView(row, counts.get(row.id)))
}

export const createForward = async (context) => {
  const { body, set, user } = context
  const { bot, failure } = await withBot(context)
  if (!bot) return failure
  let fields
  try {
    if (!body?.name || !body?.url) throw new TypeError('Name and endpoint URL are required')
    fields = await parseTargetFields(bot, body)
  } catch (error) {
    set.status = 400
    return { error: error.message }
  }

  const secret = generateTargetSecret()
  const now = nowIso()
  const row = {
    id: randomUUID(),
    bot_id: bot.id,
    chat_id: null,
    enabled: 1,
    timeout_ms: DEFAULT_TIMEOUT_MS,
    max_attempts: DEFAULT_MAX_ATTEMPTS,
    consecutive_failures: 0,
    paused_until: null,
    last_success_at: null,
    last_failure_at: null,
    last_http_status: null,
    last_error: null,
    ...fields,
    secret: storeTargetSecret(secret),
    created_at: now,
    updated_at: now,
  }
  await db.insertInto('managed_webhook_target').values(row).execute()
  await audit({
    actorType: 'user',
    actorId: user.id,
    botId: bot.id,
    action: 'webhook-target.create',
    entityType: 'webhook-target',
    entityId: row.id,
    metadata: { name: row.name, chatId: row.chat_id },
  })
  set.status = 201
  return {
    ...targetView(row),
    secret,
    warning: 'Copy this signing secret now. It will not be shown again.',
  }
}

export const updateForward = async (context) => {
  const { params, body, set, user } = context
  const { bot, failure } = await withBot(context)
  if (!bot) return failure
  const target = await findTarget(bot, params.forward)
  if (!target) {
    set.status = 404
    return { error: 'Webhook target not found' }
  }
  let fields
  try {
    fields = await parseTargetFields(bot, body || {})
  } catch (error) {
    set.status = 400
    return { error: error.message }
  }

  const updates = { ...fields, updated_at: nowIso() }
  // Turning a target back on or pointing it somewhere new starts it with a
  // clean health record.
  if (fields.enabled === 1 || (fields.url && fields.url !== target.url)) {
    Object.assign(updates, {
      consecutive_failures: 0,
      paused_until: null,
      last_error: null,
    })
  }
  await db
    .updateTable('managed_webhook_target')
    .set(updates)
    .where('id', '=', target.id)
    .execute()
  await audit({
    actorType: 'user',
    actorId: user.id,
    botId: bot.id,
    action: 'webhook-target.update',
    entityType: 'webhook-target',
    entityId: target.id,
    metadata: {
      fields: Object.keys(fields),
      enabled: fields.enabled,
    },
  })
  if (fields.enabled === 1) kickForwardWorker()
  const updated = await findTarget(bot, target.id)
  const counts = await loadCounts([target.id])
  return targetView(updated, counts.get(target.id))
}

export const deleteForward = async (context) => {
  const { params, set, user } = context
  const { bot, failure } = await withBot(context)
  if (!bot) return failure
  const target = await findTarget(bot, params.forward)
  if (!target) {
    set.status = 404
    return { error: 'Webhook target not found' }
  }
  await db.deleteFrom('managed_webhook_target').where('id', '=', target.id).execute()
  await audit({
    actorType: 'user',
    actorId: user.id,
    botId: bot.id,
    action: 'webhook-target.delete',
    entityType: 'webhook-target',
    entityId: target.id,
    metadata: { name: target.name },
  })
  return { ok: true }
}

// Sends one synthetic event so the owner can check the endpoint and its
// signature handling. It does not enter the queue or change target health.
export const testForward = async (context) => {
  const { params, set, user } = context
  const { bot, failure } = await withBot(context)
  if (!bot) return failure
  const target = await findTarget(bot, params.forward)
  if (!target) {
    set.status = 404
    return { error: 'Webhook target not found' }
  }
  const eventId = randomUUID()
  const body = JSON.stringify({
    destination: bot.bot_user_id,
    events: [{
      type: 'notice-manager.test',
      mode: 'active',
      timestamp: Date.now(),
      webhookEventId: eventId,
      source: { type: 'user', userId: 'notice-manager-test' },
    }],
  })
  const result = await sendToTarget({
    target,
    service: bot.service,
    body,
    eventId,
  })
  await audit({
    actorType: 'user',
    actorId: user.id,
    botId: bot.id,
    action: 'webhook-target.test',
    entityType: 'webhook-target',
    entityId: target.id,
    metadata: { ok: result.ok, status: result.status, error: result.error },
  })
  return {
    ok: result.ok,
    status: result.status,
    durationMs: result.durationMs,
    error: result.error,
  }
}

export const listForwardDeliveries = async (context) => {
  const { params, query } = context
  const { bot, failure } = await withBot(context)
  if (!bot) return failure
  const target = await findTarget(bot, params.forward)
  if (!target) {
    context.set.status = 404
    return { error: 'Webhook target not found' }
  }
  let request = db
    .selectFrom('managed_webhook_forward as forward')
    .innerJoin('managed_webhook_event as event', 'event.id', 'forward.event_id')
    .select([
      'forward.id as id',
      'forward.event_id as event_id',
      'forward.status as status',
      'forward.attempt_count as attempt_count',
      'forward.next_attempt_at as next_attempt_at',
      'forward.last_attempt_at as last_attempt_at',
      'forward.last_http_status as last_http_status',
      'forward.last_error as last_error',
      'forward.duration_ms as duration_ms',
      'forward.created_at as created_at',
      'forward.delivered_at as delivered_at',
      'event.event_type as event_type',
      'event.source_id as source_id',
    ])
    .where('forward.target_id', '=', target.id)
  if (['pending', 'sending', 'succeeded', 'dead'].includes(query?.status)) {
    request = request.where('forward.status', '=', query.status)
  }
  const rows = await request
    .orderBy('forward.created_at', 'desc')
    .limit(pageLimit(query))
    .offset(pageOffset(query))
    .execute()
  return rows.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    eventType: row.event_type,
    sourceId: row.source_id,
    status: row.status,
    attemptCount: row.attempt_count,
    nextAttemptAt: row.next_attempt_at,
    lastAttemptAt: row.last_attempt_at,
    lastHttpStatus: row.last_http_status,
    lastError: row.last_error,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at,
  }))
}

export const retryForwardDelivery = async (context) => {
  const { params, set, user } = context
  const { bot, failure } = await withBot(context)
  if (!bot) return failure
  const target = await findTarget(bot, params.forward)
  const forward = target && await db
    .selectFrom('managed_webhook_forward')
    .select(['id', 'status'])
    .where('id', '=', params.delivery)
    .where('target_id', '=', target.id)
    .executeTakeFirst()
  if (!forward) {
    set.status = 404
    return { error: 'Forward delivery not found' }
  }
  if (forward.status !== 'dead') {
    set.status = 409
    return { error: 'Only a failed delivery can be retried' }
  }
  await db
    .updateTable('managed_webhook_forward')
    .set({ status: 'pending', attempt_count: 0, next_attempt_at: nowIso() })
    .where('id', '=', forward.id)
    .where('status', '=', 'dead')
    .execute()
  await db
    .updateTable('managed_webhook_target')
    .set({ paused_until: null })
    .where('id', '=', target.id)
    .execute()
  await audit({
    actorType: 'user',
    actorId: user.id,
    botId: bot.id,
    action: 'webhook-forward.retry',
    entityType: 'webhook-forward',
    entityId: forward.id,
    metadata: { targetId: target.id },
  })
  kickForwardWorker()
  return { ok: true }
}
