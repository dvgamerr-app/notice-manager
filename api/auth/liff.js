import { db } from '../../lib/db.js'
import { randomUUID } from 'crypto'

// POST /auth/liff — exchange LIFF access token for a session token
export default async ({ body, set }) => {
  const { access_token } = body || {}
  if (!access_token) { set.status = 400; return { error: 'access_token required' } }

  const [verifyRes, profileRes] = await Promise.all([
    fetch(`https://api.line.me/oauth2/v2.1/verify?access_token=${access_token}`),
    fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${access_token}` }
    })
  ])

  if (!verifyRes.ok || !profileRes.ok) { set.status = 401; return { error: 'Invalid LINE token' } }

  const { userId: lineUserId, displayName, pictureUrl } = await profileRes.json()
  const now = new Date()

  const existing = await db.selectFrom('ba_user').select('id')
    .where('id', '=', lineUserId).executeTakeFirst()

  if (!existing) {
    await db.insertInto('ba_user').values({
      id: lineUserId, name: displayName,
      email: `${lineUserId}@line.local`,
      email_verified: true, image: pictureUrl || null,
      created_at: now, updated_at: now
    }).execute()

    await db.insertInto('ba_account').values({
      id: randomUUID(), account_id: lineUserId, provider_id: 'line',
      user_id: lineUserId, access_token,
      created_at: now, updated_at: now
    }).execute()
  } else {
    await db.updateTable('ba_user')
      .set({ name: displayName, image: pictureUrl || null, updated_at: now })
      .where('id', '=', lineUserId).execute()
  }

  const token = randomUUID()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  await db.insertInto('ba_session').values({
    id: randomUUID(), user_id: lineUserId, token,
    expires_at: expiresAt, created_at: now, updated_at: now
  }).execute()

  return { token, userId: lineUserId, name: displayName }
}
