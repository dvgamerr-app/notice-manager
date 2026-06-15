import { db } from '../../lib/db.js'
import { verifySignature, lineClient, makePush } from '../../lib/sdk-line.js'
import { onEvents, onCommands } from './cmd.js'
import userCustom from './custom.js'

const VERIFY_TOKEN = '00000000000000000000000000000000'
const getSourceId = (e) => e.source[`${e.source.type}Id`]

export default async (req, reply) => {
  const { bot } = req.params
  const startTime = Date.now()

  const botData = await db.selectFrom('line_bot').select(['access_token', 'secret'])
    .where('service', '=', bot).where('active', '=', true).executeTakeFirst()
  if (!botData) return reply.status(404).send({ error: 'Bot not found' })

  const sig = req.headers['x-line-signature']
  if (sig && req.rawBody) {
    if (!verifySignature(botData.secret, req.rawBody, sig)) {
      return reply.status(401).send({ error: 'Invalid signature' })
    }
  }

  const client = lineClient(botData.access_token)
  const push = makePush(client)
  const { events = [] } = req.body || {}

  for (const event of events) {
    if (event.replyToken === VERIFY_TOKEN) continue

    // save inbound
    await db.insertInto('line_inbound').values({
      bot_name: bot, type: event.type,
      source: JSON.stringify(event.source),
      message: JSON.stringify(event.message || {}),
      timestamp: event.timestamp
    }).execute().catch(() => {})

    const roomId = getSourceId(event)
    const room = await db.selectFrom('line_bot_room').select('variable')
      .where('bot_name', '=', bot).where('room_id', '=', roomId).executeTakeFirst()

    const variable = room?.variable || []
    const userState = variable.find(v => v.userId === event.source.userId)

    // bypass mode (multi-step flows like WakaTime setup)
    if (userState?.data?.bypass) {
      const isText = event.type === 'message' && event.message?.type === 'text'
      const forceStop = isText && /ยกเลิก|cancel|ปิด/i.test(event.message.text)
      const idx = userState.data.index
      if (userCustom[bot]?.[idx]?.bypass) {
        await userCustom[bot][idx].bypass(event, push, client, forceStop, bot)
        continue
      }
    }

    if (event.type === 'message' && event.message?.type === 'text') {
      const { text } = event.message
      const match = /^\/(?<name>[-_a-zA-Z]+)(?<arg>\W.*|)/gi.exec(text)

      if (match?.groups) {
        const { name, arg } = match.groups
        const args = arg.trim().split(' ').filter(Boolean)
        if (event.replyToken && onCommands[name]) {
          const result = await onCommands[name](bot, args, event, client)
          await push(event, result)
        }
      } else {
        const botMatch = /บอท|bot/i.exec(text)
        if (botMatch && userCustom[bot]) {
          for (const custom of userCustom[bot]) {
            if (custom.cmd.some(c => text.indexOf(c) > botMatch.index)) {
              await custom.job(event, push, client, bot)
              break
            }
          }
        }
      }
    } else if (onEvents[event.type]) {
      const result = await onEvents[event.type](bot, event, client)
      await push(event, result)
    }
  }

  const used = Date.now() - startTime
  req.log.info(`webhook used ${used}ms for ${events.length} events`)
  return { OK: true, used }
}
