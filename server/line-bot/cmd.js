import helpFlex from './flex-help'
import { notifyLogs } from '../helper'
import mongo from '../mongodb'
const api = process.env.PROXY_API || 'http://localhost:4000'

const getID = e => {
  if (!e || !e.source) throw new Error('getID() :: Event is unknow source.')
  return e.source[`${e.source.type}Id`]
}
const getRoom = async (botname, id, type) => {
  await mongo.open()
  let LineBotRoom = mongo.get('LineBotRoom')
  return (await LineBotRoom.findOne({ botname, id, type })) || {}
}
const verifyRoom = async (botname, name) => {
  await mongo.open()
  let LineBotRoom = mongo.get('LineBotRoom')
  return LineBotRoom.findOne({ botname, name })
}

const joinBotRoom = async (botname, id, type) => {
  let room = await getRoom(botname, id, type)
  let LineBotRoom = mongo.get('LineBotRoom')
  if (room._id) {
    await LineBotRoom.updateOne({ _id: room._id }, { $set: { active: true } })
  } else {
    await new LineBotRoom({ botname, id, type, name: '' }).save()
  }
  return room
}

const leaveBotRoom = async (botname, id, type) => {
  await mongo.open()
  return mongo.get('LineBotRoom').updateOne({ botname, id, type }, { $set: { active: false } })
}
const renameBotRoom = async (botname, id, type, name) => {
  await mongo.open()
  return mongo.get('LineBotRoom').updateOne({ botname, id, type }, { $set: { name } })
}

export const onEvents = {
  'join': async (botname, event) => {
    await joinBotRoom(botname, getID(event), event.source.type)
    await notifyLogs(`Bot your join in ${event.source.type} (${getID(event)}).`)
    return 'มาแล้วๆ'
  },
  'leave': async (botname, event) => {
    await leaveBotRoom(botname, getID(event), event.source.type)
    await notifyLogs(`Bot your leave from ${event.source.type} (${getID(event)}).`)
  }
}

export const onCommands = {
  'id': async (botname, args, event) => {
    const room = await getRoom(botname, getID(event), event.source.type)
    if (!room) return

    const _active = (room.active) ? 'ON' : '`OFF`'
    const _api = (room.name && room.active) ? `\n*API:* ${api}/${botname}/${room.name}` : ''
    return `*ID:* \`${getID(event)}\`\n*Name:* ${room.name ? room.name : '`None`'}\n*Active:* ${_active}${_api}`
  },
  'join': async (botname, args, event) => {
    await joinBotRoom(botname, getID(event), event.source.type)
    return 'มาแล้วๆ'
  },
  'room': async (botname, args, event) => {
    const room = await getRoom(botname, getID(event), event.source.type)
    if (!room || !args || !args[0]) return

    if (await verifyRoom(botname, args[0])) return `\`${args[0]}\` ใช้แล้ว`
    await renameBotRoom(botname, getID(event), event.source.type, args[0])
    return `เย้! \`${args[0]}\``
  },
  'leave': async (botname, args, event, line) => {
    await leaveBotRoom(botname, getID(event), event.source.type)
    if (event.source.type === 'user') return `ไม่! จะอยู่`

    await line.replyMessage(event.replyToken, { type: 'text', text: 'ไปก็ได้' })
    if (event.source.type === 'group') {
      await line.leaveGroup(getID(event))
    } else if (event.source.type === 'room') {
      await line.leaveRoom(getID(event))
    }
  },
  'help': async (botname, args, event) => {
    if (event.source.type === 'user') return helpFlex
  },
  'api': async (botname, args, event) => {
    const room = await getRoom(botname, getID(event), event.source.type)
    const url = `${api}/${botname}/${room.name && room.active ? room.name : getID(event)}`
    let curl = '```\n' + `curl -X PUT ${url} -H "Content-Type: application/json" -d "{"type":"text","text":"*BOT* Testing Message"}"` + '\n```'
    return curl
  }
}
