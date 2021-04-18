const { notice } = require('@touno-io/db/schema')
const { loggingLINE } = require('../logging')
const helpFlex = require('./flex-help')

const api = process.env.PROXY_API || 'http://localhost:4000'

const getID = (e) => {
  if (!e || !e.source) { throw new Error('getID() :: Event is unknow source.') }
  return e.source[`${e.source.type}Id`]
}
const getRoom = async (botname, id, type) => {
  await notice.open()
  const LineBotRoom = notice.get('LineBotRoom')
  return (await LineBotRoom.findOne({ botname, id, type })) || {}
}
const verifyRoom = async (botname, name) => {
  await notice.open()
  const LineBotRoom = notice.get('LineBotRoom')
  return LineBotRoom.findOne({ botname, name })
}

const joinBotRoom = async (botname, id, type) => {
  const room = await getRoom(botname, id, type)
  const LineBotRoom = notice.get('LineBotRoom')
  if (room._id) {
    await LineBotRoom.updateOne({ _id: room._id }, { $set: { active: true } })
  } else {
    await new LineBotRoom({ botname, id, type, name: '', variable: [] }).save()
  }
  return room
}

const leaveBotRoom = async (botname, id, type) => {
  await notice.open()
  return notice.get('LineBotRoom').updateOne({ botname, id, type }, { $set: { active: false } })
}
const renameBotRoom = async (botname, id, type, name) => {
  await joinBotRoom(botname, id, type)
  await notice.open()
  return notice.get('LineBotRoom').updateOne({ botname, id, type }, { $set: { name } })
}
const renameUserInRoom = async (botname, roomname, name, userId) => {
  await notice.open()
  const LineBotUser = notice.get('LineBotUser')
  await LineBotUser.deleteMany({ botname, roomname, userId })
  return new LineBotUser({ botname, roomname, userId, name }).save()
}

module.exports = {
  onEvents: {
    join: async (botname, event) => {
      await joinBotRoom(botname, getID(event), event.source.type)
      await loggingLINE(`Bot your join in ${event.source.type} (${getID(event)}).`)
      return 'มาแล้วๆ'
    },
    leave: async (botname, event) => {
      await leaveBotRoom(botname, getID(event), event.source.type)
      await loggingLINE(`Bot your leave from ${event.source.type} (${getID(event)}).`)
    }
  },
  onCommands: {
    id: async (botname, args, event) => {
      const room = await getRoom(botname, getID(event), event.source.type)
      if (!room) { return }

      const _active = (room.active) ? 'ON' : '`OFF`'
      const _api = (room.name && room.active) ? `\n*API:* ${api}/${botname}/${room.name}` : ''
      return `*ID:* \`${getID(event)}\`\n*Name:* ${room.name ? room.name : '`None`'}\n*Active:* ${_active}${_api}`
    },
    join: async (botname, args, event) => {
      await joinBotRoom(botname, getID(event), event.source.type)
      return 'มาแล้วๆ'
    },
    room: async (botname, args, event) => {
      const room = await getRoom(botname, getID(event), event.source.type)
      if (!room || !args || !args[0]) { return }

      if (await verifyRoom(botname, args[0])) { return `\`${args[0]}\` ใช้แล้ว` }
      await renameBotRoom(botname, getID(event), event.source.type, args[0])
      return `เย้! \`${args[0]}\``
    },
    name: async (botname, args, event) => {
      const room = await getRoom(botname, getID(event), event.source.type)
      if (!room) { return }

      await renameUserInRoom(botname, room.name, args.join(' '), event.source.userId)
      return `สวัสดี! \`${args.join(' ')}\``
    },
    leave: async (botname, args, event, line) => {
      await leaveBotRoom(botname, getID(event), event.source.type)
      if (event.source.type === 'user') { return 'ไม่! จะอยู่' }

      await line.replyMessage(event.replyToken, { type: 'text', text: 'ไปก็ได้' })
      if (event.source.type === 'group') {
        await line.leaveGroup(getID(event))
      } else if (event.source.type === 'room') {
        await line.leaveRoom(getID(event))
      }
    },
    help: () => {
      return helpFlex
    },
    api: async (botname, args, event) => {
      const room = await getRoom(botname, getID(event), event.source.type)
      const url = `${api}/${botname}/${room.name && room.active ? room.name : getID(event)}`
      const curl = '```\n' + `curl -X PUT ${url} -H "Content-Type: application/json" -d "{"type":"text","text":"*BOT* Testing Message"}"` + '\n```'
      return curl
    }
  }
}
