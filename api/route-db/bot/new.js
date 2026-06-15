import { db } from '../../../lib/db.js'

export default async (req, reply) => {
  const { service, name, access_token, secret } = req.body || {}
  const userId = req.headers['x-user-liff']
  if (!service || !access_token || !secret) {
    return reply.status(400).send({ error: 'service, access_token, secret required' })
  }
  const existing = await db.selectFrom('line_bot').select('id').where('service', '=', service).executeTakeFirst()
  if (existing) return reply.status(409).send({ error: `${service} already exists` })

  const [row] = await db.insertInto('line_bot')
    .values({ service, name: name || service, access_token, secret, user_id: userId || 'system' })
    .returning(['id', 'service', 'created'])
    .execute()
  return row
}
