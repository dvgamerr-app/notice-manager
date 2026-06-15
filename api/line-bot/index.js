import { db } from '../../lib/db.js'
import { verifySignature, lineClient, makePush } from '../../lib/sdk-line.js'
import { onEvents, onCommands } from './cmd.js'
import userCustom from './custom.js'

const VERIFY_TOKEN = '00000000000000000000000000000000'
const getSourceId = (e) => e.source[`${e.source.type}Id`]

export default async ({ params, body, headers, set }) => {
  const { bot } = params
  const startTime = Date.now()

  // body is raw string from scoped onParse in webhookRaw plugin
  const rawBody = typeof body === 'string' ? body : JSON.stringify(body || {})
  const { events = [] } = JSON.parse(rawBody)

  const botData = await db.selectFrom('line_bot').select(['access_token', 'secret'])
    .where('service', '=', bot).where('active', '=', true).executeTakeFirst()
  if (!botData) { set.status = 404; return { error: 'Bot not found' } }

  const sig = headers['x-line-signature']
  if (sig && rawBody) {
    if (!verifySignature(botData.secret, rawBody, sig)) {
      set.status = 401; return { error: 'Invalid signature' }
    }
  }

  const client = lineClient(botData.access_token)
  const push = makePush(client)

  for (const event of events) {
    if (event.replyToken === VERIFY_TOKEN) continue

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
  console.log(`webhook ${bot}: ${events.length} events in ${used}ms`)
  return { ok: true, used }
}
