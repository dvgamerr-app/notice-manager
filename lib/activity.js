import { db } from './db.js'

// Unified activity feed. Each kind lives in its own table, so every kind is
// queried separately (limit + 1, same cursor) and merged in JS. This stays
// portable across PostgreSQL and SQLite without a cross-table UNION.

export const ACTIVITY_KINDS = ['inbound', 'outbound', 'forward', 'system']

const RANGES = {
  '1h': 3_600_000,
  '24h': 86_400_000,
  '7d': 604_800_000,
  '30d': 2_592_000_000,
}
export const DEFAULT_RANGE = '7d'
const STUCK_MS = 120_000
const OWN_COMMAND = /^\/(?:hi|id)$/i

// Audit rows that duplicate a delivery or forward row are not shown.
const DUPLICATED_AUDIT_ACTIONS = ['message.send', 'message.fail', 'webhook-forward.dead']
const FAILING_ACTION = 'webhook-target.failing'

const AUDIT_TITLES = {
  'api-key.create': 'สร้าง API key',
  'api-key.revoke': 'ยกเลิก API key',
  'bot.create': 'เพิ่มบอต',
  'bot.update': 'แก้ไขบอต',
  'bot.credentials.rotate': 'เปลี่ยน credential ของบอต',
  'bot.webhook.sync': 'ซิงก์ webhook กับ LINE',
  'chat.bulk-register': 'ลงทะเบียนแชตหลายรายการ',
  'chat.leave': 'ออกจากแชต',
  'chat.metadata.refresh': 'รีเฟรชข้อมูลแชตจาก LINE',
  'chat.update': 'แก้ไขแชต',
  'webhook-target.create': 'เพิ่มปลายทางส่งต่อ',
  'webhook-target.update': 'แก้ไขปลายทางส่งต่อ',
  'webhook-target.delete': 'ลบปลายทางส่งต่อ',
  'webhook-target.test': 'ทดสอบปลายทางส่งต่อ',
  'webhook-target.failing': 'ปลายทางส่งต่อล้มเหลวติดกัน',
  'webhook-target.recovered': 'ปลายทางส่งต่อกลับมาปกติ',
  'webhook-forward.retry': 'ส่งต่อซ้ำด้วยตนเอง',
}

const parseJson = (value, fallback) => {
  if (value == null || typeof value !== 'string') return value ?? fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const likePattern = (value) =>
  `%${String(value).replace(/[\\%_]/g, (character) => `\\${character}`)}%`

const clip = (value, length = 80) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  return text.length > length ? `${text.slice(0, length - 1)}…` : text
}

const inboundTitle = (event) => {
  const message = event?.message
  if (event?.type === 'message' && message) {
    if (message.type === 'text') return `“${clip(message.text)}”`
    return `ข้อความ (${message.type})`
  }
  if (event?.type === 'postback') return 'postback'
  return event?.type || 'event'
}

const outboundTitle = (messages) => {
  const first = Array.isArray(messages) ? messages[0] : null
  if (!first) return 'ข้อความ'
  if (first.type === 'text') return `Text: ${clip(first.text)}`
  if (first.type === 'flex') return `Flex: ${clip(first.altText)}`
  return first.type
}

const forwardView = (status, attempts) => {
  if (status === 'succeeded') return { status: 'ok', problem: false }
  if (status === 'dead') return { status: 'fail', problem: true }
  return { status: 'pending', problem: attempts > 0 }
}

export const parseFilters = (query = {}) => {
  const kinds = String(query.kinds || '')
    .split(',')
    .filter((kind) => ACTIVITY_KINDS.includes(kind))
  const range = RANGES[query.since] ? query.since : DEFAULT_RANGE
  return {
    kinds: kinds.length ? kinds : [...ACTIVITY_KINDS],
    problem: query.problem === '1' || query.problem === 'true',
    hideOkForwards: query.hideOkForwards === '1',
    since: new Date(Date.now() - RANGES[range]).toISOString(),
    eventType: query.eventType ? String(query.eventType).slice(0, 40) : null,
    source: query.source ? String(query.source).slice(0, 80) : null,
    target: query.target ? String(query.target).slice(0, 80) : null,
    q: query.q ? String(query.q).trim().slice(0, 100) : '',
  }
}

// Filters that only make sense for some kinds narrow the kinds queried.
const applicableKinds = (filters) =>
  filters.kinds.filter((kind) => {
    if (filters.source && kind !== 'outbound') return false
    if (filters.target && kind !== 'forward') return false
    if (filters.eventType && kind !== 'inbound' && kind !== 'forward') return false
    return true
  })

const parseCursor = (value) => {
  const [at, id] = String(value || '').split('~')
  return at && id && !Number.isNaN(Date.parse(at)) ? { at, id } : null
}
const makeCursor = (item) => `${item.at}~${item.id}`

const beforeCursor = (request, column, idColumn, cursor) =>
  cursor
    ? request.where((expression) =>
      expression.or([
        expression(column, '<', cursor.at),
        expression.and([
          expression(column, '=', cursor.at),
          expression(idColumn, '<', cursor.id),
        ]),
      ]))
    : request

// ---- per-kind query builders (filters only, no select list) ----

const inboundBase = ({ bot, chat, filters }) => {
  let request = db
    .selectFrom('managed_webhook_event as event')
    .where('event.bot_id', '=', bot.id)
    .where('event.received_at', '>=', filters.since)
  if (chat) request = request.where('event.source_id', '=', chat.source_id)
  if (filters.eventType) request = request.where('event.event_type', '=', filters.eventType)
  if (filters.problem) {
    const stuckBefore = new Date(Date.now() - STUCK_MS).toISOString()
    request = request.where((expression) =>
      expression.or([
        expression('event.processing_status', '=', 'failed'),
        expression.and([
          expression('event.processing_status', '=', 'processing'),
          expression('event.last_attempt_at', '<', stuckBefore),
        ]),
      ]))
  }
  if (filters.q) {
    const pattern = likePattern(filters.q)
    request = request.where((expression) =>
      expression.or([
        expression('event.webhook_event_id', 'like', pattern),
        expression('event.payload', 'like', pattern),
        expression('event.processing_error', 'like', pattern),
      ]))
  }
  return request
}

const outboundBase = ({ bot, chat, filters }) => {
  let request = db
    .selectFrom('managed_delivery as delivery')
    .where('delivery.bot_id', '=', bot.id)
    .where('delivery.created_at', '>=', filters.since)
  if (chat) request = request.where('delivery.chat_id', '=', chat.id)
  if (filters.problem) request = request.where('delivery.status', '=', 'failed')
  if (filters.source === 'liff') request = request.where('delivery.source', '=', 'liff')
  else if (filters.source) request = request.where('delivery.api_key_id', '=', filters.source)
  if (filters.q) {
    const pattern = likePattern(filters.q)
    request = request.where((expression) =>
      expression.or([
        expression('delivery.line_request_id', 'like', pattern),
        expression('delivery.message_payload', 'like', pattern),
        expression('delivery.error', 'like', pattern),
      ]))
  }
  return request
}

const forwardBase = ({ bot, chat, filters }) => {
  let request = db
    .selectFrom('managed_webhook_forward as forward')
    .innerJoin('managed_webhook_target as target', 'target.id', 'forward.target_id')
    .innerJoin('managed_webhook_event as event', 'event.id', 'forward.event_id')
    .where('target.bot_id', '=', bot.id)
    .where('forward.created_at', '>=', filters.since)
  if (chat) request = request.where('event.source_id', '=', chat.source_id)
  if (filters.target) request = request.where('forward.target_id', '=', filters.target)
  if (filters.eventType) request = request.where('event.event_type', '=', filters.eventType)
  if (filters.hideOkForwards) request = request.where('forward.status', '!=', 'succeeded')
  if (filters.problem) {
    request = request.where((expression) =>
      expression.or([
        expression('forward.status', '=', 'dead'),
        expression.and([
          expression('forward.status', '=', 'pending'),
          expression('forward.attempt_count', '>', 0),
        ]),
      ]))
  }
  if (filters.q) {
    const pattern = likePattern(filters.q)
    request = request.where((expression) =>
      expression.or([
        expression('event.webhook_event_id', 'like', pattern),
        expression('forward.last_error', 'like', pattern),
        expression('target.name', 'like', pattern),
      ]))
  }
  return request
}

const systemBase = ({ bot, chat, filters }) => {
  let request = db
    .selectFrom('managed_audit_log as audit')
    .where('audit.bot_id', '=', bot.id)
    .where('audit.created_at', '>=', filters.since)
    .where('audit.action', 'not in', DUPLICATED_AUDIT_ACTIONS)
  if (chat) {
    request = request
      .where('audit.entity_type', '=', 'chat')
      .where('audit.entity_id', '=', chat.id)
  }
  if (filters.problem) request = request.where('audit.action', '=', FAILING_ACTION)
  if (filters.q) request = request.where('audit.action', 'like', likePattern(filters.q))
  return request
}

const bases = {
  inbound: inboundBase,
  outbound: outboundBase,
  forward: forwardBase,
  system: systemBase,
}

// ---- row loaders ----

const loadInbound = async (context, cursor, limit) => {
  const rows = await beforeCursor(
    inboundBase(context),
    'event.received_at',
    'event.id',
    cursor,
  )
    .select([
      'event.id as id',
      'event.webhook_event_id as webhook_event_id',
      'event.event_type as event_type',
      'event.source_id as source_id',
      'event.payload as payload',
      'event.processing_status as processing_status',
      'event.last_attempt_at as last_attempt_at',
      'event.processing_error as processing_error',
      'event.received_at as received_at',
    ])
    .orderBy('event.received_at', 'desc')
    .orderBy('event.id', 'desc')
    .limit(limit)
    .execute()
  if (!rows.length) return []

  const forwards = await db
    .selectFrom('managed_webhook_forward as forward')
    .innerJoin('managed_webhook_target as target', 'target.id', 'forward.target_id')
    .select(['forward.event_id as event_id', 'forward.status as status'])
    .where('target.bot_id', '=', context.bot.id)
    .where('forward.event_id', 'in', rows.map((row) => row.id))
    .execute()
  const summary = new Map()
  for (const forward of forwards) {
    const entry = summary.get(forward.event_id) || { ok: 0, total: 0 }
    entry.total += 1
    if (forward.status === 'succeeded') entry.ok += 1
    summary.set(forward.event_id, entry)
  }

  const stuckBefore = Date.now() - STUCK_MS
  return rows.map((row) => {
    const payload = parseJson(row.payload, {})
    const text = payload?.message?.type === 'text' ? String(payload.message.text || '').trim() : ''
    const stuck = row.processing_status === 'processing'
      && row.last_attempt_at
      && Date.parse(row.last_attempt_at) < stuckBefore
    const failed = row.processing_status === 'failed'
    return {
      id: row.id,
      kind: 'inbound',
      at: row.received_at,
      status: failed ? 'fail' : stuck ? 'warn' : row.processing_status === 'processing' ? 'pending' : 'ok',
      problem: failed || Boolean(stuck),
      title: OWN_COMMAND.test(text) ? `${text} (คำสั่งของแอป)` : inboundTitle(payload),
      chatSourceId: row.source_id,
      eventType: row.event_type,
      error: row.processing_error,
      forwards: summary.get(row.id) || null,
    }
  })
}

const loadOutbound = async (context, cursor, limit) => {
  const rows = await beforeCursor(
    outboundBase(context),
    'delivery.created_at',
    'delivery.id',
    cursor,
  )
    .leftJoin('managed_api_key as key', 'key.id', 'delivery.api_key_id')
    .select([
      'delivery.id as id',
      'delivery.chat_id as chat_id',
      'delivery.recipient_id as recipient_id',
      'delivery.message_payload as message_payload',
      'delivery.status as status',
      'delivery.source as source',
      'delivery.error as error',
      'delivery.created_at as created_at',
      'key.name as key_name',
    ])
    .orderBy('delivery.created_at', 'desc')
    .orderBy('delivery.id', 'desc')
    .limit(limit)
    .execute()
  return rows.map((row) => ({
    id: row.id,
    kind: 'outbound',
    at: row.created_at,
    status: row.status === 'sent' ? 'ok' : row.status === 'failed' ? 'fail' : 'pending',
    problem: row.status === 'failed',
    title: outboundTitle(parseJson(row.message_payload, [])),
    chatId: row.chat_id,
    chatSourceId: row.recipient_id,
    sourceLabel: row.source === 'api'
      ? `API key · ${row.key_name || 'ที่ถูกลบแล้ว'}`
      : row.source === 'liff' ? 'ทดสอบจาก LIFF' : null,
    error: row.error,
  }))
}

const loadForward = async (context, cursor, limit) => {
  const rows = await beforeCursor(
    forwardBase(context),
    'forward.created_at',
    'forward.id',
    cursor,
  )
    .select([
      'forward.id as id',
      'forward.status as status',
      'forward.attempt_count as attempt_count',
      'forward.last_http_status as last_http_status',
      'forward.last_error as last_error',
      'forward.created_at as created_at',
      'target.id as target_id',
      'target.name as target_name',
      'event.event_type as event_type',
      'event.source_id as source_id',
    ])
    .orderBy('forward.created_at', 'desc')
    .orderBy('forward.id', 'desc')
    .limit(limit)
    .execute()
  return rows.map((row) => ({
    id: row.id,
    kind: 'forward',
    at: row.created_at,
    ...forwardView(row.status, row.attempt_count),
    title: `ส่งต่อ ${row.event_type} → ${row.target_name}`,
    chatSourceId: row.source_id,
    eventType: row.event_type,
    targetId: row.target_id,
    httpStatus: row.last_http_status,
    error: row.last_error,
  }))
}

const loadSystem = async (context, cursor, limit) => {
  const rows = await beforeCursor(
    systemBase(context),
    'audit.created_at',
    'audit.id',
    cursor,
  )
    .select([
      'audit.id as id',
      'audit.actor_type as actor_type',
      'audit.action as action',
      'audit.entity_type as entity_type',
      'audit.entity_id as entity_id',
      'audit.created_at as created_at',
    ])
    .orderBy('audit.created_at', 'desc')
    .orderBy('audit.id', 'desc')
    .limit(limit)
    .execute()
  return rows.map((row) => ({
    id: row.id,
    kind: 'system',
    at: row.created_at,
    status: row.action === FAILING_ACTION ? 'warn' : 'ok',
    problem: row.action === FAILING_ACTION,
    title: AUDIT_TITLES[row.action] || row.action,
    chatId: row.entity_type === 'chat' ? row.entity_id : null,
    action: row.action,
    actor: row.actor_type === 'user' ? 'ผู้ดูแล' : row.actor_type === 'api-key' ? 'API key' : 'ระบบ',
  }))
}

const loaders = {
  inbound: loadInbound,
  outbound: loadOutbound,
  forward: loadForward,
  system: loadSystem,
}

const compareDesc = (a, b) =>
  a.at < b.at ? 1 : a.at > b.at ? -1 : a.id < b.id ? 1 : a.id > b.id ? -1 : 0

export const listActivity = async ({ bot, chat, filters, before, limit }) => {
  const cursor = parseCursor(before)
  const context = { bot, chat, filters }
  const batches = await Promise.all(
    applicableKinds(filters).map((kind) => loaders[kind](context, cursor, limit + 1)),
  )
  const merged = batches.flat().sort(compareDesc)
  const items = merged.slice(0, limit)
  return {
    items,
    nextCursor: merged.length > limit ? makeCursor(items[items.length - 1]) : null,
  }
}

const countRows = async (request) => {
  const row = await request
    .select((expression) => expression.fn.countAll().as('total'))
    .executeTakeFirst()
  return Number(row?.total || 0)
}

// Counts per kind for the category chips, honouring every filter except the
// kind selection itself. `problems` counts the same set restricted to problems.
export const summarizeActivity = async ({ bot, chat, filters }) => {
  const kinds = applicableKinds({ ...filters, kinds: [...ACTIVITY_KINDS] })
  const counts = Object.fromEntries(ACTIVITY_KINDS.map((kind) => [kind, 0]))
  const problems = { ...counts }
  let okForwards = 0
  await Promise.all(kinds.map(async (kind) => {
    const plain = { bot, chat, filters: { ...filters, problem: false } }
    const failing = { bot, chat, filters: { ...filters, problem: true, hideOkForwards: false } }
    ;[counts[kind], problems[kind]] = await Promise.all([
      countRows(bases[kind](plain)),
      countRows(bases[kind](failing)),
    ])
    if (kind === 'forward') {
      okForwards = await countRows(
        forwardBase(plain).where('forward.status', '=', 'succeeded'),
      )
    }
  }))
  return { counts, problems, okForwards }
}

// ---- detail ----

const sourceChat = (bot, sourceId) =>
  sourceId
    ? db
      .selectFrom('managed_chat')
      .select(['id', 'source_type', 'display_name', 'line_display_name'])
      .where('bot_id', '=', bot.id)
      .where('source_id', '=', sourceId)
      .executeTakeFirst()
    : null

export const getActivityDetail = async ({ bot, kind, id }) => {
  if (kind === 'inbound') {
    const row = await db
      .selectFrom('managed_webhook_event')
      .selectAll()
      .where('id', '=', id)
      .where('bot_id', '=', bot.id)
      .executeTakeFirst()
    if (!row) return null
    const forwards = await db
      .selectFrom('managed_webhook_forward as forward')
      .innerJoin('managed_webhook_target as target', 'target.id', 'forward.target_id')
      .select([
        'forward.id as id',
        'forward.status as status',
        'forward.attempt_count as attempt_count',
        'forward.last_http_status as last_http_status',
        'target.id as target_id',
        'target.name as target_name',
      ])
      .where('forward.event_id', '=', row.id)
      .where('target.bot_id', '=', bot.id)
      .orderBy('forward.created_at', 'asc')
      .execute()
    const payload = parseJson(row.payload, {})
    return {
      kind,
      id: row.id,
      at: row.received_at,
      chatId: (await sourceChat(bot, row.source_id))?.id || null,
      fields: {
        eventType: row.event_type,
        webhookEventId: row.webhook_event_id,
        sourceId: row.source_id,
        processingStatus: row.processing_status,
        attemptCount: row.attempt_count,
        redelivery: Boolean(row.is_redelivery),
        processedAt: row.processed_at,
        forwarded: !OWN_COMMAND.test(String(payload?.message?.text || '').trim()),
      },
      error: row.processing_error,
      related: forwards.map((forward) => ({
        kind: 'forward',
        id: forward.id,
        label: forward.target_name,
        httpStatus: forward.last_http_status,
        ...forwardView(forward.status, forward.attempt_count),
      })),
      raw: payload,
    }
  }

  if (kind === 'outbound') {
    const row = await db
      .selectFrom('managed_delivery as delivery')
      .leftJoin('managed_api_key as key', 'key.id', 'delivery.api_key_id')
      .select([
        'delivery.id as id',
        'delivery.chat_id as chat_id',
        'delivery.recipient_id as recipient_id',
        'delivery.message_payload as message_payload',
        'delivery.status as status',
        'delivery.source as source',
        'delivery.line_request_id as line_request_id',
        'delivery.response_payload as response_payload',
        'delivery.error as error',
        'delivery.created_at as created_at',
        'delivery.sent_at as sent_at',
        'key.name as key_name',
      ])
      .where('delivery.id', '=', id)
      .where('delivery.bot_id', '=', bot.id)
      .executeTakeFirst()
    if (!row) return null
    return {
      kind,
      id: row.id,
      at: row.created_at,
      chatId: row.chat_id,
      fields: {
        status: row.status,
        recipientId: row.recipient_id,
        requestId: row.line_request_id,
        sentAt: row.sent_at,
        sourceLabel: row.source === 'api'
          ? `API key · ${row.key_name || 'ที่ถูกลบแล้ว'}`
          : row.source === 'liff' ? 'ทดสอบจาก LIFF' : null,
      },
      error: row.error,
      related: [],
      raw: {
        messages: parseJson(row.message_payload, []),
        response: parseJson(row.response_payload, null),
      },
    }
  }

  if (kind === 'forward') {
    const row = await db
      .selectFrom('managed_webhook_forward as forward')
      .innerJoin('managed_webhook_target as target', 'target.id', 'forward.target_id')
      .innerJoin('managed_webhook_event as event', 'event.id', 'forward.event_id')
      .select([
        'forward.id as id',
        'forward.status as status',
        'forward.attempt_count as attempt_count',
        'forward.next_attempt_at as next_attempt_at',
        'forward.last_attempt_at as last_attempt_at',
        'forward.last_http_status as last_http_status',
        'forward.last_error as last_error',
        'forward.duration_ms as duration_ms',
        'forward.created_at as created_at',
        'forward.delivered_at as delivered_at',
        'target.id as target_id',
        'target.name as target_name',
        'event.id as event_id',
        'event.event_type as event_type',
        'event.source_id as source_id',
        'event.webhook_event_id as webhook_event_id',
      ])
      .where('forward.id', '=', id)
      .where('target.bot_id', '=', bot.id)
      .executeTakeFirst()
    if (!row) return null
    const siblings = await db
      .selectFrom('managed_webhook_forward as forward')
      .innerJoin('managed_webhook_target as target', 'target.id', 'forward.target_id')
      .select([
        'forward.id as id',
        'forward.status as status',
        'forward.attempt_count as attempt_count',
        'forward.last_http_status as last_http_status',
        'target.name as target_name',
      ])
      .where('forward.event_id', '=', row.event_id)
      .where('target.bot_id', '=', bot.id)
      .orderBy('forward.created_at', 'asc')
      .execute()
    return {
      kind,
      id: row.id,
      at: row.created_at,
      chatId: (await sourceChat(bot, row.source_id))?.id || null,
      targetId: row.target_id,
      fields: {
        status: row.status,
        targetName: row.target_name,
        eventType: row.event_type,
        webhookEventId: row.webhook_event_id,
        attemptCount: row.attempt_count,
        httpStatus: row.last_http_status,
        durationMs: row.duration_ms,
        lastAttemptAt: row.last_attempt_at,
        nextAttemptAt: row.status === 'pending' ? row.next_attempt_at : null,
        deliveredAt: row.delivered_at,
      },
      error: row.last_error,
      retryable: row.status === 'dead',
      related: [
        { kind: 'inbound', id: row.event_id, label: row.event_type, status: 'ok', problem: false },
        ...siblings.map((sibling) => ({
          kind: 'forward',
          id: sibling.id,
          label: sibling.target_name,
          httpStatus: sibling.last_http_status,
          current: sibling.id === row.id,
          ...forwardView(sibling.status, sibling.attempt_count),
        })),
      ],
      raw: null,
    }
  }

  if (kind === 'system') {
    const row = await db
      .selectFrom('managed_audit_log')
      .selectAll()
      .where('id', '=', id)
      .where('bot_id', '=', bot.id)
      .executeTakeFirst()
    if (!row) return null
    return {
      kind,
      id: row.id,
      at: row.created_at,
      chatId: row.entity_type === 'chat' ? row.entity_id : null,
      fields: {
        action: row.action,
        actorType: row.actor_type,
        entityType: row.entity_type,
        entityId: row.entity_id,
      },
      error: null,
      related: [],
      raw: parseJson(row.metadata_payload, {}),
    }
  }

  return null
}
