import { db } from '../../lib/db.js'

export default async (req, reply) => {
  const userId = req.headers['x-user-liff']
  if (!userId) return reply.status(401).send({})

  const { bot } = req.params

  if (bot) {
    return db.selectFrom('line_bot_room').selectAll()
      .where('bot_name', '=', bot)
      .orderBy('created', 'asc')
      .execute()
  }

  return db.selectFrom('line_bot')
    .select(['id', 'service', 'name', 'user_id', 'active', 'created'])
    .orderBy('service', 'asc')
    .execute()
}
