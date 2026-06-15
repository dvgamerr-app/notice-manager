import { db } from '../../lib/db.js'

export default async (req, reply) => {
  const { bot, id } = req.params

  if (id) {
    const row = await db.selectFrom('line_outbound').select('sender')
      .where('id', '=', parseInt(id)).executeTakeFirst()
    if (!row) return reply.status(400).send({ error: 'Not found' })
    return typeof row.sender === 'string' ? JSON.parse(row.sender) : row.sender
  }

  return db.selectFrom('line_outbound')
    .select(['id', 'user_to', 'sender', 'sended', 'created'])
    .where('bot_name', '=', bot)
    .orderBy('created', 'desc')
    .limit(100)
    .execute()
}
