import { db } from '../../lib/db.js'

export default async ({ params, set, userId }) => {
  if (!userId) { set.status = 401; return {} }
  const { bot } = params

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
