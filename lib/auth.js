import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { db } from './db.js'

const expectedChannelId =
  process.env.LINE_LOGIN_CHANNEL_ID || process.env.LINE_CLIENT_ID || ''
const configuredAdminIds = new Set(
  (process.env.LINE_ADMIN_USER_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
)

export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

const tokenHash = (token) => createHash('sha256').update(token).digest('hex')
const nowIso = () => new Date().toISOString()

const assertOwner = async (trx, lineUserId) => {
  if (configuredAdminIds.size) {
    if (!configuredAdminIds.has(lineUserId)) {
      throw new AuthError('บัญชี LINE นี้ไม่มีสิทธิ์จัดการระบบ', 403)
    }
  }

  const now = nowIso()
  await trx
    .insertInto('app_setting')
    .values({ key: 'owner_line_user_id', value: lineUserId, updated_at: now })
    .onConflict((conflict) => conflict.column('key').doNothing())
    .execute()

  const owner = await trx
    .selectFrom('app_setting')
    .select('value')
    .where('key', '=', 'owner_line_user_id')
    .executeTakeFirstOrThrow()

  if (owner.value !== lineUserId) {
    throw new AuthError('ระบบนี้ผูกกับบัญชี LINE ผู้ดูแลบัญชีอื่นแล้ว', 403)
  }
}

export const exchangeLiffAccessToken = async (accessToken) => {
  if (!accessToken) throw new AuthError('access_token is required', 400)
  if (!expectedChannelId) {
    throw new AuthError('LINE_LOGIN_CHANNEL_ID is not configured', 503)
  }

  const verifyResponse = await fetch(
    `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(accessToken)}`,
  )
  if (!verifyResponse.ok) throw new AuthError('LIFF access token is invalid or expired')

  const verified = await verifyResponse.json()
  if (String(verified.client_id) !== String(expectedChannelId) || verified.expires_in <= 0) {
    throw new AuthError('LIFF access token was issued for a different LINE Login channel')
  }

  const profileResponse = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!profileResponse.ok) throw new AuthError('Unable to read the LINE profile')
  const profile = await profileResponse.json()

  const now = nowIso()
  const configuredSessionDays = Number(process.env.SESSION_DAYS || 30)
  const sessionDays = Number.isFinite(configuredSessionDays)
    ? Math.min(365, Math.max(1, Math.trunc(configuredSessionDays)))
    : 30
  const expiresAt = new Date(Date.now() + sessionDays * 86_400_000).toISOString()
  const token = randomBytes(32).toString('base64url')

  await db.transaction().execute(async (trx) => {
    await assertOwner(trx, profile.userId)
    await trx
      .insertInto('app_user')
      .values({
        id: profile.userId,
        display_name: profile.displayName,
        picture_url: profile.pictureUrl || null,
        role: 'admin',
        created_at: now,
        updated_at: now,
      })
      .onConflict((conflict) =>
        conflict.column('id').doUpdateSet({
          display_name: profile.displayName,
          picture_url: profile.pictureUrl || null,
          updated_at: now,
        }))
      .execute()

    await trx
      .insertInto('app_session')
      .values({
        id: randomUUID(),
        token_hash: tokenHash(token),
        user_id: profile.userId,
        expires_at: expiresAt,
        created_at: now,
        last_seen_at: now,
      })
      .execute()
  })

  return {
    token,
    expiresAt,
    user: {
      id: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || null,
    },
  }
}

export const getSessionUser = async (headers = {}) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.DEV_AUTH_BYPASS === 'true' &&
    headers['x-dev-user']
  ) {
    const id = String(headers['x-dev-user'])
    const now = nowIso()
    await db.insertInto('app_user').values({
      id,
      display_name: 'Local developer',
      picture_url: null,
      role: 'admin',
      created_at: now,
      updated_at: now,
    }).onConflict((conflict) => conflict.column('id').doNothing()).execute()
    return {
      id,
      displayName: 'Local developer',
      pictureUrl: null,
      role: 'admin',
    }
  }

  const authorization = headers.authorization || headers.Authorization || ''
  const token = authorization.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null

  const now = nowIso()
  const session = await db
    .selectFrom('app_session as session')
    .innerJoin('app_user as user', 'user.id', 'session.user_id')
    .select([
      'session.id as session_id',
      'user.id',
      'user.display_name',
      'user.picture_url',
      'user.role',
    ])
    .where('session.token_hash', '=', tokenHash(token))
    .where('session.expires_at', '>', now)
    .executeTakeFirst()

  if (!session) return null
  await db
    .updateTable('app_session')
    .set({ last_seen_at: now })
    .where('id', '=', session.session_id)
    .execute()

  return {
    id: session.id,
    displayName: session.display_name,
    pictureUrl: session.picture_url,
    role: session.role,
  }
}

export const deleteSession = async (headers = {}) => {
  const authorization = headers.authorization || headers.Authorization || ''
  const token = authorization.replace(/^Bearer\s+/i, '').trim()
  if (!token) return
  await db.deleteFrom('app_session').where('token_hash', '=', tokenHash(token)).execute()
}
