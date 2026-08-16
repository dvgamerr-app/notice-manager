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
  const accessToken = normalizeChannelAccessToken(
    body?.channelAccessToken || body?.access_token,
  )
  const channelSecret = String(body?.channelSecret || body?.secret || '').trim()
  const endpoint = webhookUrl(service)

  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(service)) {
    set.status = 400
    return { error: 'Service ID must be 2-64 lowercase letters, numbers, - or _' }
  }
  if (!accessToken || !channelSecret) {
    set.status = 400
    return { error: 'Channel access token and channel secret are required' }
  }
  if (!endpoint.startsWith('https://')) {
    set.status = 400
    return {
      error: 'PUBLIC_BASE_URL must be a public HTTPS URL before adding a LINE bot',
      endpoint,
    }
  }

  try {
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
    if (duplicate) {
      set.status = 409
      return { error: `Bot is already registered as ${duplicate.service}` }
    }

    await client.setWebhookEndpoint(endpoint)
    const { data: webhook } = await client.getWebhookEndpoint()
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
    set.status = 201
    return { ...botView(bot), webhookActive: Boolean(webhook.active) }
  } catch (error) {
    if (error instanceof LineApiError) set.status = 400
    else set.status = 500
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
  const accessToken = normalizeChannelAccessToken(body?.channelAccessToken)
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
