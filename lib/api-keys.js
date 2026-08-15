import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { db } from './db.js'

const hash = (value) => createHash('sha256').update(value).digest('hex')

export const createApiKey = async ({ ownerUserId, botId, name }) => {
  const key = `lm_live_${randomBytes(32).toString('base64url')}`
  const now = new Date().toISOString()
  const row = {
    id: randomUUID(),
    owner_user_id: ownerUserId,
    bot_id: botId,
    name,
    key_prefix: key.slice(0, 16),
    key_hash: hash(key),
    active: 1,
    last_used_at: null,
    created_at: now,
    revoked_at: null,
  }
  await db.insertInto('managed_api_key').values(row).execute()
  return { row, key }
}

export const authenticateApiKey = async (headers = {}) => {
  const authorization = headers.authorization || headers.Authorization || ''
  const bearer = authorization.replace(/^Bearer\s+/i, '').trim()
  const raw = String(headers['x-api-key'] || bearer || '').trim()
  if (!raw.startsWith('lm_live_')) return null

  const record = await db
    .selectFrom('managed_api_key as api_key')
    .innerJoin('managed_bot as bot', 'bot.id', 'api_key.bot_id')
    .select([
      'api_key.id',
      'api_key.name',
      'api_key.owner_user_id',
      'api_key.bot_id',
      'bot.service',
      'bot.active as bot_active',
    ])
    .where('api_key.key_hash', '=', hash(raw))
    .where('api_key.active', '=', 1)
    .executeTakeFirst()
  if (!record || !record.bot_active) return null

  await db
    .updateTable('managed_api_key')
    .set({ last_used_at: new Date().toISOString() })
    .where('id', '=', record.id)
    .execute()
  return record
}
