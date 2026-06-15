import { db } from '../../../lib/db.js'

export default async ({ body, set, userId }) => {
  const { service, name, access_token, secret } = body || {}
  if (!service || !access_token || !secret) {
    set.status = 400; return { error: 'service, access_token, secret required' }
  }

  const existing = await db.selectFrom('line_bot').select('id')
    .where('service', '=', service).executeTakeFirst()
  if (existing) { set.status = 409; return { error: `${service} already exists` } }

  const [row] = await db.insertInto('line_bot')
    .values({ service, name: name || service, access_token, secret, user_id: userId || 'system' })
    .returning(['id', 'service', 'created'])
    .execute()
  return row
}
