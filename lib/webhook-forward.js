import { createHmac, randomBytes, randomUUID } from 'node:crypto'
import dns from 'node:dns/promises'
import net from 'node:net'
import { audit } from './audit.js'
import { db } from './db.js'
import { logger } from './logger.js'
import { decryptSecret, encryptSecret } from './secrets.js'
import { recordTaskIf } from './telemetry.js'

const nowIso = () => new Date().toISOString()

// A target is shown as failing after this many consecutive failed attempts and
// paused (circuit open) after the second threshold so a dead endpoint is not
// hammered while its queue waits.
export const FAILING_THRESHOLD = 3
export const CIRCUIT_THRESHOLD = 5
const CIRCUIT_PAUSE_MS = 5 * 60_000
const STALE_SENDING_MS = 2 * 60_000
const RETRY_DELAYS_MS = [10_000, 60_000, 300_000, 1_800_000, 7_200_000]
const BATCH_SIZE = 50
const CONCURRENCY = 5

export const DEFAULT_TIMEOUT_MS = 5_000
export const DEFAULT_MAX_ATTEMPTS = 6

class ForwardBlockedError extends Error {}

// Overridable so tests can resolve hostnames without real DNS.
export const forwardRuntime = {
  lookup: (host, options) => dns.lookup(host, options),
}

const stripBrackets = (host) => host.replace(/^\[|\]$/g, '')

const isPrivateIPv4 = (ip) => {
  const [a, b] = ip.split('.').map(Number)
  return a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 192 && b === 0)
    || (a === 198 && (b === 18 || b === 19))
    || a >= 224
}

const isPrivateIPv6 = (ip) => {
  const value = ip.toLowerCase()
  if (value === '::' || value === '::1') return true
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateIPv4(mapped[1])
  if (value.startsWith('::ffff:')) return true
  return /^f[cd]/.test(value) || /^fe[89ab]/.test(value)
}

export const isPrivateAddress = (address) => {
  const ip = stripBrackets(address)
  return net.isIPv4(ip) ? isPrivateIPv4(ip) : isPrivateIPv6(ip)
}

/**
 * Validates a forwarding endpoint without touching the network. Only public
 * HTTPS hosts are accepted so a target cannot be used to probe the internal
 * network. Resolved addresses are checked again at send time.
 */
export const validateTargetUrl = (value) => {
  const text = String(value || '').trim()
  if (!text || text.length > 2_048) throw new TypeError('Endpoint URL is required')
  let url
  try {
    url = new URL(text)
  } catch {
    throw new TypeError('Endpoint URL is not valid')
  }
  if (url.protocol !== 'https:') throw new TypeError('Endpoint URL must use HTTPS')
  if (url.username || url.password) {
    throw new TypeError('Endpoint URL must not contain credentials')
  }
  const host = stripBrackets(url.hostname).toLowerCase()
  if (
    host === 'localhost'
    || /\.(?:localhost|local|internal|localdomain)$/.test(host)
    || (net.isIP(host) && isPrivateAddress(host))
  ) {
    throw new TypeError('Endpoint URL must be a public host')
  }
  return url.toString()
}

const assertPublicHost = async (hostname, lookup) => {
  const host = stripBrackets(hostname)
  if (net.isIP(host)) return
  const addresses = await lookup(host, { all: true })
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new ForwardBlockedError('Endpoint resolves to a non-public address')
  }
}

export const generateTargetSecret = () => `whsec_${randomBytes(32).toString('base64url')}`
export const storeTargetSecret = (secret) => encryptSecret(secret)

export const signBody = (secret, body) =>
  createHmac('sha256', secret).update(body).digest('base64')

export const retryDelayMs = (attempt) =>
  RETRY_DELAYS_MS[Math.min(Math.max(attempt, 1), RETRY_DELAYS_MS.length) - 1]

export const buildForwardBody = (destination, eventPayload) => {
  let event = {}
  try {
    event = JSON.parse(eventPayload)
  } catch {
    // The stored payload is always JSON written by the webhook handler.
  }
  return JSON.stringify({ destination, events: [event] })
}

/**
 * Sends one signed body to a target and classifies the outcome. Never throws.
 * `retryable` is false for responses where repeating the request cannot help.
 */
export const sendToTarget = async ({
  target,
  service,
  body,
  deliveryId = randomUUID(),
  eventId = '',
  attempt = 1,
  fetchImpl = fetch,
  lookup = forwardRuntime.lookup,
}) => {
  const started = Date.now()
  const elapsed = () => Date.now() - started
  try {
    const url = new URL(validateTargetUrl(target.url))
    await assertPublicHost(url.hostname, lookup)
    const response = await fetchImpl(url, {
      method: 'POST',
      redirect: 'manual',
      signal: AbortSignal.timeout(target.timeout_ms),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NoticeManager-Webhook/1',
        'x-line-signature': signBody(decryptSecret(target.secret), body),
        'x-notice-manager-bot': service,
        'x-notice-manager-delivery-id': deliveryId,
        'x-notice-manager-event-id': eventId,
        'x-notice-manager-attempt': String(attempt),
      },
      body,
    })
    let detail = ''
    try {
      detail = (await response.text()).replace(/\s+/g, ' ').trim().slice(0, 200)
    } catch {
      // The status is what matters; an unreadable body is not a failure.
    }
    const status = response.status
    if (status >= 200 && status < 300) {
      return { ok: true, status, durationMs: elapsed(), error: null, retryable: false }
    }
    return {
      ok: false,
      status,
      durationMs: elapsed(),
      error: `HTTP ${status}${detail ? `: ${detail}` : ''}`,
      retryable: status >= 500 || status === 408 || status === 429,
    }
  } catch (error) {
    const blocked = error instanceof ForwardBlockedError || error instanceof TypeError
      && /Endpoint URL/.test(error.message)
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError'
    return {
      ok: false,
      status: null,
      durationMs: elapsed(),
      error: blocked
        ? error.message
        : timedOut
          ? `Timed out after ${target.timeout_ms}ms`
          : `Network error: ${String(error?.message || error).slice(0, 200)}`,
      retryable: !blocked,
    }
  }
}

const safeAudit = async (entry) => {
  try {
    await audit({ actorType: 'system', ...entry })
  } catch (error) {
    logger.error({ err: error, action: entry.action }, 'Unable to write forwarding audit log')
  }
}

/**
 * Creates one pending forward per enabled target that applies to this event.
 * Idempotent: LINE redelivery of the same event never queues a second copy.
 */
export const enqueueForwards = async ({ bot, eventRecordId, chatId = null }) => {
  const targets = await db
    .selectFrom('managed_webhook_target')
    .select('id')
    .where('bot_id', '=', bot.id)
    .where('enabled', '=', 1)
    .where((eb) => chatId
      ? eb.or([eb('chat_id', 'is', null), eb('chat_id', '=', chatId)])
      : eb('chat_id', 'is', null))
    .execute()
  if (!targets.length) return 0

  const now = nowIso()
  await db
    .insertInto('managed_webhook_forward')
    .values(targets.map((target) => ({
      id: randomUUID(),
      target_id: target.id,
      event_id: eventRecordId,
      status: 'pending',
      attempt_count: 0,
      next_attempt_at: now,
      created_at: now,
    })))
    .onConflict((conflict) =>
      conflict.columns(['target_id', 'event_id']).doNothing())
    .execute()
  kickForwardWorker()
  return targets.length
}

const loadForward = (id) => db
  .selectFrom('managed_webhook_forward as forward')
  .innerJoin('managed_webhook_target as target', 'target.id', 'forward.target_id')
  .innerJoin('managed_webhook_event as event', 'event.id', 'forward.event_id')
  .innerJoin('managed_bot as bot', 'bot.id', 'target.bot_id')
  .select([
    'forward.id as id',
    'forward.attempt_count as attempt_count',
    'forward.event_id as event_id',
    'target.id as target_id',
    'target.bot_id as bot_id',
    'target.name as target_name',
    'target.url as url',
    'target.secret as secret',
    'target.timeout_ms as timeout_ms',
    'target.max_attempts as max_attempts',
    'target.consecutive_failures as consecutive_failures',
    'event.payload as payload',
    'bot.bot_user_id as bot_user_id',
    'bot.service as service',
  ])
  .where('forward.id', '=', id)
  .executeTakeFirst()

const recordSuccess = async (row, result) => {
  const now = nowIso()
  await db
    .updateTable('managed_webhook_forward')
    .set({
      status: 'succeeded',
      delivered_at: now,
      last_http_status: result.status,
      last_error: null,
      duration_ms: result.durationMs,
    })
    .where('id', '=', row.id)
    .execute()
  await db
    .updateTable('managed_webhook_target')
    .set({
      consecutive_failures: 0,
      paused_until: null,
      last_success_at: now,
      last_http_status: result.status,
      last_error: null,
    })
    .where('id', '=', row.target_id)
    .execute()
  if (row.consecutive_failures >= FAILING_THRESHOLD) {
    logger.info(
      { targetId: row.target_id, botId: row.bot_id },
      'Webhook forwarding target recovered',
    )
    await safeAudit({
      botId: row.bot_id,
      action: 'webhook-target.recovered',
      entityType: 'webhook-target',
      entityId: row.target_id,
      metadata: { name: row.target_name },
    })
  }
  return 'succeeded'
}

const recordFailure = async (row, result) => {
  const now = nowIso()
  const terminal = !result.retryable || row.attempt_count >= row.max_attempts
  await db
    .updateTable('managed_webhook_forward')
    .set({
      status: terminal ? 'dead' : 'pending',
      next_attempt_at: terminal
        ? now
        : new Date(Date.now() + retryDelayMs(row.attempt_count)).toISOString(),
      last_http_status: result.status,
      last_error: result.error,
      duration_ms: result.durationMs,
    })
    .where('id', '=', row.id)
    .execute()

  const updated = await db
    .updateTable('managed_webhook_target')
    .set((expression) => ({
      consecutive_failures: expression('consecutive_failures', '+', 1),
      last_failure_at: now,
      last_http_status: result.status,
      last_error: result.error,
    }))
    .where('id', '=', row.target_id)
    .returning('consecutive_failures')
    .executeTakeFirst()
  const failures = Number(updated?.consecutive_failures || 0)
  if (failures >= CIRCUIT_THRESHOLD) {
    await db
      .updateTable('managed_webhook_target')
      .set({ paused_until: new Date(Date.now() + CIRCUIT_PAUSE_MS).toISOString() })
      .where('id', '=', row.target_id)
      .execute()
  }

  const context = {
    targetId: row.target_id,
    botId: row.bot_id,
    eventId: row.event_id,
    attempt: row.attempt_count,
    status: result.status,
    error: result.error,
  }
  if (terminal) {
    logger.error(context, 'Webhook forward gave up')
    await safeAudit({
      botId: row.bot_id,
      action: 'webhook-forward.dead',
      entityType: 'webhook-forward',
      entityId: row.id,
      metadata: {
        targetId: row.target_id,
        name: row.target_name,
        status: result.status,
        error: result.error,
      },
    })
  } else {
    logger.warn(context, 'Webhook forward failed; will retry')
  }
  if (failures === FAILING_THRESHOLD) {
    logger.error(
      { targetId: row.target_id, botId: row.bot_id, failures },
      'Webhook forwarding target is failing',
    )
    await safeAudit({
      botId: row.bot_id,
      action: 'webhook-target.failing',
      entityType: 'webhook-target',
      entityId: row.target_id,
      metadata: { name: row.target_name, failures, error: result.error },
    })
  }
  return terminal ? 'dead' : 'retry'
}

const attemptForward = async (id, options) => {
  const row = await loadForward(id)
  if (!row) return 'missing'
  const result = await sendToTarget({
    target: row,
    service: row.service,
    body: buildForwardBody(row.bot_user_id, row.payload),
    deliveryId: row.id,
    eventId: row.event_id,
    attempt: row.attempt_count,
    ...options,
  })
  return result.ok ? recordSuccess(row, result) : recordFailure(row, result)
}

/**
 * Claims and delivers due forwards. Claims are atomic, so any number of
 * application instances may run this concurrently. Returns the claimed count.
 */
export const processDueForwards = async ({
  now = new Date(),
  batchSize = BATCH_SIZE,
  fetchImpl = fetch,
  lookup = forwardRuntime.lookup,
  outcomes = [],
} = {}) => {
  const current = now.toISOString()
  const staleBefore = new Date(now.getTime() - STALE_SENDING_MS).toISOString()
  const dueCondition = (eb, prefix = '') => eb.or([
    eb.and([
      eb(`${prefix}status`, '=', 'pending'),
      eb(`${prefix}next_attempt_at`, '<=', current),
    ]),
    eb.and([
      eb(`${prefix}status`, '=', 'sending'),
      eb(`${prefix}last_attempt_at`, '<', staleBefore),
    ]),
  ])

  const due = await db
    .selectFrom('managed_webhook_forward as forward')
    .innerJoin('managed_webhook_target as target', 'target.id', 'forward.target_id')
    .select('forward.id as id')
    .where('target.enabled', '=', 1)
    .where((eb) => eb.or([
      eb('target.paused_until', 'is', null),
      eb('target.paused_until', '<=', current),
    ]))
    .where((eb) => dueCondition(eb, 'forward.'))
    .orderBy('forward.next_attempt_at', 'asc')
    .limit(batchSize)
    .execute()

  const claimed = []
  for (const { id } of due) {
    const claim = await db
      .updateTable('managed_webhook_forward')
      .set((expression) => ({
        status: 'sending',
        attempt_count: expression('attempt_count', '+', 1),
        last_attempt_at: current,
      }))
      .where('id', '=', id)
      .where((eb) => dueCondition(eb))
      .returning('id')
      .executeTakeFirst()
    if (claim) claimed.push(claim.id)
  }

  for (let index = 0; index < claimed.length; index += CONCURRENCY) {
    const chunk = claimed.slice(index, index + CONCURRENCY)
    const results = await Promise.allSettled(
      chunk.map((id) => attemptForward(id, { fetchImpl, lookup })),
    )
    for (const [position, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        outcomes.push(result.value)
        continue
      }
      // An unexpected bookkeeping failure leaves the row in `sending`; the
      // stale-claim recovery picks it up again.
      logger.error(
        { err: result.reason, forwardId: chunk[position] },
        'Unable to record webhook forward result',
      )
    }
  }
  return claimed.length
}

let workerActive = false
let workerRunning = false
let workerRerun = false

const workerTick = async () => {
  if (workerRunning) {
    workerRerun = true
    return
  }
  workerRunning = true
  try {
    do {
      workerRerun = false
      const startedAt = new Date()
      let claimed
      let total = 0
      do {
        claimed = await processDueForwards()
        total += claimed
      } while (claimed >= BATCH_SIZE)
      if (total > 0) {
        recordTaskIf('webhook-forward-delivery', startedAt, { 'forward.count': total })
      }
    } while (workerRerun)
  } catch (error) {
    logger.error({ err: error }, 'Webhook forward worker failed')
  } finally {
    workerRunning = false
  }
}

export function kickForwardWorker() {
  if (workerActive) void workerTick()
}

export const startForwardWorker = (intervalMs = 5_000) => {
  workerActive = true
  const timer = setInterval(workerTick, intervalMs)
  timer.unref?.()
  void workerTick()
  return () => {
    workerActive = false
    clearInterval(timer)
  }
}
