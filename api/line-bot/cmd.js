import { db } from '../../lib/db.js'
import helpFlex from './flex-help.js'

const api = process.env.BASE_URL || 'http://localhost:3000'
const getSourceId = (e) => e.source[`${e.source.type}Id`]

const getRoom = (botName, roomId) =>
  db.selectFrom('line_bot_room').selectAll()
    .where('bot_name', '=', botName)
    .where('room_id', '=', roomId)
    .executeTakeFirst()

const joinBotRoom = (botName, roomId, type) =>
  db.insertInto('line_bot_room')
    .values({ bot_name: botName, room_id: roomId, type, name: '', active: true, variable: JSON.stringify([]) })
    .onConflict(oc => oc.columns(['bot_name', 'room_id']).doUpdateSet({ active: true }))
    .execute()

const leaveBotRoom = (botName, roomId) =>
  db.updateTable('line_bot_room').set({ active: false })
    .where('bot_name', '=', botName).where('room_id', '=', roomId).execute()

export const onEvents = {
  join: async (botName, event) => {
    await joinBotRoom(botName, getSourceId(event), event.source.type)
    return 'มาแล้วๆ'
  },
  leave: async (botName, event) => {
    await leaveBotRoom(botName, getSourceId(event))
  }
}

export const onCommands = {
  id: async (botName, args, event) => {
    const room = await getRoom(botName, getSourceId(event))
    if (!room) return
    const active = room.active ? 'ON' : '`OFF`'
    const apiLink = room.name && room.active ? `\n*API:* ${api}/line/${botName}/${room.name}` : ''
    return `*ID:* \`${getSourceId(event)}\`\n*Name:* ${room.name || '`None`'}\n*Active:* ${active}${apiLink}`
  },
  join: async (botName, args, event) => {
    await joinBotRoom(botName, getSourceId(event), event.source.type)
    return 'มาแล้วๆ'
  },
  room: async (botName, args, event) => {
    if (!args?.[0]) return
    const existing = await db.selectFrom('line_bot_room').select('id')
      .where('bot_name', '=', botName).where('name', '=', args[0]).executeTakeFirst()
    if (existing) return `\`${args[0]}\` ใช้แล้ว`
    await db.updateTable('line_bot_room').set({ name: args[0] })
      .where('bot_name', '=', botName).where('room_id', '=', getSourceId(event)).execute()
    return `เย้! \`${args[0]}\``
  },
  name: async (botName, args, event) => {
    const room = await getRoom(botName, getSourceId(event))
    if (!room) return
    const name = args.join(' ')
    await db.deleteFrom('line_bot_user')
      .where('bot_name', '=', botName).where('room_name', '=', room.name).where('user_id', '=', event.source.userId).execute()
    await db.insertInto('line_bot_user')
      .values({ bot_name: botName, room_name: room.name, user_id: event.source.userId, name }).execute()
    return `สวัสดี! \`${name}\``
  },
  leave: async (botName, args, event, client) => {
    await leaveBotRoom(botName, getSourceId(event))
    if (event.source.type === 'user') return 'ไม่! จะอยู่'
    await client.reply(event.replyToken, { type: 'text', text: 'ไปก็ได้' })
    if (event.source.type === 'group') await client.leaveGroup(getSourceId(event))
    else if (event.source.type === 'room') await client.leaveRoom(getSourceId(event))
  },
  help: () => helpFlex,
  api: async (botName, args, event) => {
    const room = await getRoom(botName, getSourceId(event))
    const roomName = room?.name && room?.active ? room.name : getSourceId(event)
    const url = `${api}/line/${botName}/${roomName}`
    return '```\n' + `curl -X PUT ${url} -H "Content-Type: application/json" -d '{"type":"text","text":"Testing"}'` + '\n```'
  }
}
