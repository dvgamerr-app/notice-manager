import { createApiKey } from '../../lib/api-keys.js'
import { audit } from '../../lib/audit.js'
import { db } from '../../lib/db.js'
import { findBot, nowIso, unauthorized } from './shared.js'

export const listApiKeys = async ({ params, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const rows = await db
    .selectFrom('managed_api_key')
    .select([
      'id',
      'name',
      'key_prefix',
      'active',
      'last_used_at',
      'created_at',
      'revoked_at',
    ])
    .where('bot_id', '=', bot.id)
    .orderBy('created_at', 'desc')
    .execute()
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    prefix: row.key_prefix,
    active: Boolean(row.active),
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  }))
}

export const addApiKey = async ({ params, body, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const name = String(body?.name || '').trim()
  if (!name || name.length > 100) {
    set.status = 400
    return { error: 'API key name is required and must be 100 characters or less' }
  }
  const { row, key } = await createApiKey({
    ownerUserId: user.id,
    botId: bot.id,
    name,
  })
  await audit({
    actorType: 'user',
    actorId: user.id,
    botId: bot.id,
    action: 'api-key.create',
    entityType: 'api-key',
    entityId: row.id,
    metadata: { botId: bot.id, prefix: row.key_prefix },
  })
  set.status = 201
  return {
    id: row.id,
    name: row.name,
    prefix: row.key_prefix,
    key,
    createdAt: row.created_at,
    warning: 'Copy this key now. It will not be shown again.',
  }
}

export const revokeApiKey = async ({ params, user, set }) => {
  if (!user) return unauthorized(set)
  const bot = await findBot(params.bot, user.id)
  if (!bot) {
    set.status = 404
    return { error: 'Bot not found' }
  }
  const key = await db
    .selectFrom('managed_api_key')
    .select('id')
    .where('id', '=', params.key)
    .where('bot_id', '=', bot.id)
    .executeTakeFirst()
  if (!key) {
    set.status = 404
    return { error: 'API key not found' }
  }
  const now = nowIso()
  await db
    .updateTable('managed_api_key')
    .set({ active: 0, revoked_at: now })
    .where('id', '=', key.id)
    .execute()
  await audit({
    actorType: 'user',
    actorId: user.id,
    botId: bot.id,
    action: 'api-key.revoke',
    entityType: 'api-key',
    entityId: key.id,
    metadata: { botId: bot.id },
  })
  return { ok: true, revokedAt: now }
}
