import { db } from '../../lib/db.js'
import { lineClient, makePush } from '../../lib/sdk-line.js'
import alertFlex from '../flex/alert.js'
import errorFlex from '../flex/error.js'

// PUT /flex/:bot/:to — push an alert or error flex message to a bot room
export default async (req, reply) => {
  const { bot, to } = req.params
  const { type = 'alert', title, message, detail } = req.body || {}

  const botData = await db.selectFrom('line_bot').select(['access_token'])
    .where('service', '=', bot).where('active', '=', true).executeTakeFirst()
  if (!botData) return reply.status(404).send({ error: 'Bot not found' })

  const room = await db.selectFrom('line_bot_room').select('room_id')
    .where('bot_name', '=', bot).where('name', '=', to)
    .where('active', '=', true).executeTakeFirst()
  if (!room) return reply.status(404).send({ error: `Room '${to}' not found` })

  const flex = type === 'error'
    ? errorFlex(title || 'Error', message, detail)
    : alertFlex(title || 'Notice', message || '', detail)

  const client = lineClient(botData.access_token)
  const push = makePush(client)

  // ponytail: fake event to push to room_id directly
  await push({ source: { type: 'group', groupId: room.room_id }, replyToken: null }, flex)

  await db.insertInto('line_outbound').values({
    bot_name: bot, user_to: to, sender: JSON.stringify(flex), type: 'flex'
  }).execute().catch(() => {})

  return { ok: true }
}
