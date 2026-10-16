import { randomUUID } from 'node:crypto'
import { audit } from '../../lib/audit.js'
import { db } from '../../lib/db.js'
import {
  LineApiError,
  lineClient,
  verifyChannelAccessToken,
} from '../../lib/sdk-line.js'
import { decryptSecret, encryptSecret } from '../../lib/secrets.js'
import {
  authenticationFailed,
  botView,
  findBot,
  lineError,
  normalizeChannelAccessToken,
  nowIso,
  unauthorized,
  webhookUrl,
} from './shared.js'

const SERVICE_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/

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

// Sets the HTTP status for a failed LINE call and returns the error body.
const respondLineError = (set, error) => {
  set.status = error instanceof LineApiError ? 400 : 500
  return lineError(error)
}

// Runs a LINE call and turns a thrown error into the standard error response.
const withLineErrors = async (set, run) => {
  try {
    return await run()
  } catch (error) {
    return respondLineError(set, error)
  }
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

// Re-reads the bot's LINE profile so a stale or expired picture URL is replaced.
// Best-effort: on failure the stored values are kept.
const refreshBotProfile = async (bot) => {
  try {
    const { data: info } = await lineClient(decryptSecret(bot.channel_access_token)).getBotInfo()
    const updates = {
      picture_url: info.pictureUrl || null,
      basic_id: info.basicId || bot.basic_id,
      updated_at: nowIso(),
    }
    await db.updateTable('managed_bot').set(updates).where('id', '=', bot.id).execute()
    return { ...bot, ...updates }
  } catch {
    return bot
  }
}

export const getBot = async ({ params, query, user, set }) => {
  const scope = await loadBot({ params, user, set })
  if (scope.error) return scope.error
  const { bot } = scope
  const refresh = query?.refresh === '1' || !bot.picture_url
  return botView(refresh ? await refreshBotProfile(bot) : bot)
}

const failure = (status, body) => ({ failure: { status, body } })

const parseCreateInput = (body) => {
  const service = String(body?.service || '').trim().toLowerCase()
  return {
    service,
    name: String(body?.name || service).trim(),
    accessToken: normalizeChannelAccessToken(body?.channelAccessToken || body?.access_token),
    channelSecret: String(body?.channelSecret || body?.secret || '').trim(),
    endpoint: webhookUrl(service),
  }
}

const validateCreateInput = ({ service, accessToken, channelSecret, endpoint }) => {
  if (!SERVICE_PATTERN.test(service)) {
    return failure(400, { error: 'Service ID must be 2-64 lowercase letters, numbers, - or _' })
  }
  if (!accessToken || !channelSecret) {
    return failure(400, { error: 'Channel access token and channel secret are required' })
  }
  if (!endpoint.startsWith('https://')) {
    return failure(400, {
      error: 'PUBLIC_BASE_URL must be a public HTTPS URL before adding a LINE bot',
      endpoint,
    })
  }
  return null
}

const insertBot = async (user, input, info, webhook) => {
  const { service, name, accessToken, channelSecret, endpoint } = input
  const configuredEndpoint = webhook.endpoint || endpoint
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
    webhook_endpoint: configuredEndpoint,
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
    metadata: { service: bot.service, webhookEndpoint: configuredEndpoint },
  })
  return bot
}

// Verifies the token with LINE, points the webhook at this app, then persists the bot.
const registerBot = async (user, input) => {
  const { service, accessToken, endpoint } = input
  const client = lineClient(accessToken)
  const { data: info } = await client.getBotInfo()
  const duplicate = await db
    .selectFrom('managed_bot')
    .select(['id', 'service'])
    .where((expression) =>
      expression.or([
        expression('service', '=', service),
        expression('bot_user_id', '=', info.userId),
      ]))
    .executeTakeFirst()
  if (duplicate) return failure(409, { error: `Bot is already registered as ${duplicate.service}` })

  await client.setWebhookEndpoint(endpoint)
  const { data: webhook } = await client.getWebhookEndpoint()
  const bot = await insertBot(user, input, info, webhook)
  return { status: 201, body: { ...botView(bot), webhookActive: Boolean(webhook.active) } }
}

const createBotFailure = async (error, accessToken, set) => {
  set.status = error instanceof LineApiError ? 400 : 500
  let verification = null
  if (authenticationFailed(error)) {
    try {
      verification = await verifyChannelAccessToken(accessToken)
    } catch {
      // Keep the original LINE error when the diagnostic endpoint is unavailable.
    }
  }
  return lineError(error, { tokenVerification: verification })
}

export const createBot = async ({ body, user, set }) => {
  if (!user) return unauthorized(set)
  const input = parseCreateInput(body)
  const invalid = validateCreateInput(input)
  if (invalid) {
    set.status = invalid.failure.status
    return invalid.failure.body
  }

  try {
    const result = await registerBot(user, input)
    const outcome = result.failure || result
    set.status = outcome.status
    return outcome.body
  } catch (error) {
    return createBotFailure(error, input.accessToken, set)
  }
}

const lineFailure = (error) =>
  failure(error instanceof LineApiError ? 400 : 500, lineError(error))

// Validates a service rename and moves the webhook to the new endpoint at LINE first.
const planServiceChange = async (bot, nextService) => {
  if (!SERVICE_PATTERN.test(nextService)) {
    return failure(400, { error: 'Service ID must be 2-64 characters of a-z, 0-9, "_" or "-"' })
  }
  const taken = await db
    .selectFrom('managed_bot')
    .select('id')
    .where('service', '=', nextService)
    .executeTakeFirst()
  if (taken) return failure(409, { error: `Service ID ${nextService} is already in use` })
  const endpoint = webhookUrl(nextService)
  if (!endpoint.startsWith('https://')) {
    return failure(400, {
      error: 'PUBLIC_BASE_URL must be a public HTTPS URL before changing the webhook',
      endpoint,
    })
  }
  try {
    const client = lineClient(decryptSecret(bot.channel_access_token))
    await client.setWebhookEndpoint(endpoint)
    const { data: current } = await client.getWebhookEndpoint()
    return {
      updates: {
        service: nextService,
        webhook_endpoint: current.endpoint || endpoint,
        verified_at: nowIso(),
      },
    }
  } catch (error) {
    return lineFailure(error)
  }
}

// Verifies replacement credentials belong to the same Official Account.
const planCredentialRotation = async (bot, accessToken, channelSecret) => {
  if (!accessToken || !channelSecret) {
    return failure(400, { error: 'Both channelAccessToken and channelSecret are required for rotation' })
  }
  try {
    const { data: info } = await lineClient(accessToken).getBotInfo()
    if (info.userId !== bot.bot_user_id) {
      return failure(409, { error: 'The new token belongs to a different LINE Official Account' })
    }
    return {
      updates: {
        channel_access_token: encryptSecret(accessToken),
        channel_secret: encryptSecret(channelSecret),
        basic_id: info.basicId || bot.basic_id,
        picture_url: info.pictureUrl || bot.picture_url,
        verified_at: nowIso(),
      },
    }
  } catch (error) {
    return lineFailure(error)
  }
}

const basicUpdates = (body) => {
  const updates = { updated_at: nowIso() }
  if (typeof body?.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (typeof body?.active === 'boolean') updates.active = body.active ? 1 : 0
  return updates
}

export const updateBot = async ({ params, body, user, set }) => {
  const scope = await loadBot({ params, user, set })
  if (scope.error) return scope.error
  const { bot } = scope

  const updates = basicUpdates(body)
  const accessToken = normalizeChannelAccessToken(body?.channelAccessToken)
  const channelSecret = String(body?.channelSecret || '').trim()
  const nextService = typeof body?.service === 'string' ? body.service.trim().toLowerCase() : ''
  const serviceChanged = Boolean(nextService) && nextService !== bot.service

  const plans = []
  if (serviceChanged) plans.push(() => planServiceChange(bot, nextService))
  if (accessToken || channelSecret) {
    plans.push(() => planCredentialRotation(bot, accessToken, channelSecret))
  }
  for (const plan of plans) {
    const result = await plan()
    if (result.failure) {
      set.status = result.failure.status
      return result.failure.body
    }
    Object.assign(updates, result.updates)
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
      serviceChanged,
      ...(serviceChanged ? { from: bot.service, to: nextService } : {}),
      activeChanged: updates.active !== undefined,
    },
  })
  return getBot({ params: { ...params, bot: updates.service || bot.service }, query: {}, user, set })
}

export const getBotQuota = async ({ params, user, set }) => {
  const scope = await loadBot({ params, user, set })
  if (scope.error) return scope.error
  return withLineErrors(set, async () => {
    const client = lineClient(decryptSecret(scope.bot.channel_access_token))
    const [{ data: quota }, { data: consumption }] = await Promise.all([
      client.getMessageQuota(),
      client.getMessageConsumption(),
    ])
    return { quota, consumption }
  })
}

export const syncBotWebhook = async ({ params, user, set }) => {
  const scope = await loadBot({ params, user, set })
  if (scope.error) return scope.error
  const { bot } = scope

  const endpoint = webhookUrl(bot.service)
  if (!endpoint.startsWith('https://')) {
    set.status = 400
    return {
      error: 'PUBLIC_BASE_URL must be a public HTTPS URL before syncing a LINE webhook',
      endpoint,
    }
  }

  return withLineErrors(set, async () => {
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
    await refreshBotProfile(bot)
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
  })
}

export const testBotWebhook = async ({ params, user, set }) => {
  const scope = await loadBot({ params, user, set })
  if (scope.error) return scope.error

  return withLineErrors(set, async () => {
    const client = lineClient(decryptSecret(scope.bot.channel_access_token))
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
  })
}
