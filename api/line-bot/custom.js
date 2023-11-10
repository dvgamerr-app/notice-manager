// const cron = require('node-cron')
// const { notice } = require('@touno-io/db/schema')
const notice = {}
const axios = require('axios')

const wakaRank = require('../flex/waka-rank')
const wakaUser = require('../flex/waka-user')

const getID = (e) => {
  if (!e || !e.source) {
    throw new Error('getID() :: Event is unknow source.')
  }
  return e.source[`${e.source.type}Id`]
}

const setState = async (e, name, value) => {
  if (!name) {
    return
  }

  const { userId } = e.source
  const LineBotRoom = notice.get('LineBotRoom')
  const room = await LineBotRoom.findOne({ id: getID(e) })
  if (!room.variable) {
    room.variable = []
  }
  if (!room.variable.find(e => e.userId === userId)) {
    room.variable.push({ userId })
  }

  for (let i = 0; i < room.variable.length; i++) {
    if (room.variable[i].userId && room.variable[i].userId === userId) {
      if (typeof name === 'object') {
        room.variable[i].data = Object.assign(room.variable[i].data || {}, name)
      } else {
        const data = {}
        data[name] = value
        room.variable[i].data = Object.assign(room.variable[i].data || {}, data)
      }
      break
    }
  }

  await LineBotRoom.updateOne(
    { id: getID(e) },
    { $set: { variable: room.variable } }
  )
}
const getRoomData = async (e) => {
  const room = await notice.get('LineBotRoom').findOne({ id: getID(e) })
  return room && room.variable
}
// const setRoomData = async (e, variable) => {
//   await notice.get('LineBotRoom').updateOne({ id: getID(e) }, { $set: { variable } })
// }

const getState = async (e, name) => {
  const { userId } = e.source
  const room = await notice.get('LineBotRoom').findOne({ id: getID(e) })
  if (!room || !room.variable) {
    return null
  }

  for (let i = 0; i < room.variable.length; i++) {
    if (room.variable[i].userId && room.variable[i].userId === userId) {
      return room.variable[i].data[name]
    }
  }
}

const getNickname = async (e, botname, userId) => {
  if (!botname) {
    botname = e.botname
  }
  if (!userId) {
    userId = e.source.userId
  }
  const { LineBotUser, LineBotRoom } = notice.get()
  const { name: roomname } = await LineBotRoom.findOne({
    botname,
    id: getID(e),
    type: e.source.type
  })
  const user = await LineBotUser.findOne({ botname, roomname, userId })
  return user && user.name
}

const renameUserInRoom = async (e, botname, name) => {
  await notice.open()
  const { LineBotUser, LineBotRoom } = notice.get()
  const { name: roomname } = await LineBotRoom.findOne({
    botname,
    id: getID(e),
    type: e.source.type
  })
  await LineBotUser.deleteMany({ botname, roomname, userId: e.source.userId })
  return new LineBotUser({
    botname,
    roomname,
    userId: e.source.userId,
    name
  }).save()
}

const wakaRanking = async (e) => {
  let data = await getRoomData(e)
  data = data.sort((a, b) =>
    a.data.wakaStats.total_seconds <= b.data.wakaStats.total_seconds ? 1 : -1
  )
  for (let i = 0; i < data.length; i++) {
    if (data[i].userId === e.source.userId) {
      return i + 1
    }
  }
}

const wakaApi = 'https://wakatime.com/api/v1'
const wakaUserProfile = async (e, wakaKey) => {
  try {
    const { LineBotRoom } = notice.get()
    const { variable } = await LineBotRoom.findOne({
      botname: e.botname,
      id: getID(e),
      type: e.source.type
    })
    for (const row of variable) {
      if (row.userId !== e.source.userId && row.data.wakaKey === wakaKey) {
        return null
      }
    }

    const { data: user } = await axios(
      `${wakaApi}/users/current?api_key=${wakaKey.trim()}`
    )
    await renameUserInRoom(e, e.botname, user.data.display_name)
    await setState(e, { wakaKey, wakaUser: user.data })
    return user.data
  } catch (ex) {
    // eslint-disable-next-line no-console
    console.log(ex)
    return null
  }
}

const wakaUserStats = async (e, wakaKey) => {
  try {
    const { data: res } = await axios(
      `${wakaApi}/users/current/stats/last_7_days?api_key=${wakaKey.trim()}`
    )
    const languages = res.data.languages.map(l => l.name).join()
    await setState(e, { languages, wakaKey, wakaStats: res.data })
    return res.data
  } catch (ex) {
    // eslint-disable-next-line no-console
    console.log(ex)
    return null
  }
}

const wakaWelcomeUser = async (e, user, pushMessage) => {
  const wakaKey = await getState(e, 'wakaKey')
  const stats = await wakaUserStats(e, wakaKey)
  if (user.timeout !== 15) {
    return await pushMessage(
      e,
      'คุณผิดกติกา ไปตั้งค่าที่\nsettings > preferences > Timeout เป็น 15 นาทีด้วยครับ'
    )
  }
  const rank = await wakaRanking(e)
  await setState(e, { rank })
  const flex = wakaUser(user, stats, rank)
  await pushMessage(e, flex)

  if (!user || !stats || !wakaKey) {
    return await pushMessage(e, `เก็บข้อมูลไม่ได้จาก ${wakaKey} ไม่ได้`)
  }
}

const task = {}
// const msg = [
//   'ยังขาดอีก :n คนนะ 😄',
//   'เร็วๆ สิ 🤗ยังไม่ตอบ :n คน',
//   'เฮ้ยยย 😦 อีก :n คนนะ ยังไม่ตอบ',
//   'ไปไหนกันวะ อีก :n คนอะ?? 🙄',
//   'นี่ก็ไม่รู้ว่าใครนะ :n คนอะ 😓 ตอบเค้าหน่อยสิ',
//   'นี้!! 😭 จะไม่ตอบเค้าจิงๆ เหรอ :n คนนั้นอะ',
//   'ทำไม 🤬 ไม่ตอบวะ :n คนอะ',
//   ':n คนนั้น 😡 ถ้าไม่ตอบจะไปจริงๆ ละนะ'
// ]
// const minutePeriod = 30

const regexWakaKey = (text) => {
  const [key] =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi.exec(
      text
    ) || []
  return key
}
module.exports = {
  'ris-robo': [
    {
      cmd: ['จัดอันดับ'],
      job: async (e, pushMessage) => {
        if (!regexWakaKey(e.message.text)) {
          await setState(e, { bypass: true, index: 0, event: 'secret-save' })
          return await pushMessage(
            e,
            'ใส่ secret key ที่ได้จาก wakatime ด้วยคับ'
          )
        }
        const user = await wakaUserProfile(e, regexWakaKey(e.message.text))
        if (!user) {
          await setState(e, { bypass: true, index: 0, event: 'secret-save' })
          return await pushMessage(e, 'ใส่ secret key ใหม่นะคับ')
        }
        await wakaWelcomeUser(e, user, pushMessage)
      },
      bypass: async (e, pushMessage) => {
        const eventName = await getState(e, 'event')
        if (eventName === 'secret-save') {
          const user = await wakaUserProfile(e, regexWakaKey(e.message.text))
          if (!user) {
            return await pushMessage(e, 'ใส่ secret key อีกครั้งคับ')
          }

          await wakaWelcomeUser(e, user, pushMessage)
          await setState(e, { bypass: false })
        }
      }
    },
    {
      cmd: ['แสดงอันดับ'],
      job: async (e, pushMessage) => {
        const room = await getRoomData(e)
        const flex = room.map(e => ({
          user: e.data.wakaUser,
          stats: e.data.wakaStats
        }))
        await pushMessage(e, wakaRank(e, flex))
      }
    },
    {
      cmd: ['เช็คชื่อ', 'เช๊คชื่อ', 'เชคชื่อ', 'เชคชือ', 'checkname'],
      job: async (e, pushMessage, line) => {
        if (e.source.type !== 'room' && e.source.type !== 'group') {
          return
        }
        const unqiueID = getID(e)

        task[unqiueID] = { count: 0, cron: null }
        if (e.source.type === 'group') {
          await setState(
            e,
            { bypass: true, index: 1, userId: e.source.userId, member: [] },
            true
          )

          const member = await line.getGroupMembersCount(unqiueID)
          await setState(e, { memberTotal: member.count - 1 })

          await line.pushMessage(unqiueID, {
            type: 'text',
            text: '💬 ไหนมีใครมาบ้าง *เช็คชื่อสิ* !!'
          })
          // task[unqiueID].cron = cron.schedule('* * * * *', async () => {
          //   const memberTotal = await getState(e, 'memberTotal')
          //   const member = await getState(e, 'member')

          //   task[unqiueID].count++
          //   // sequence Math.ceil(task[unqiueID].count / (minutePeriod / msg.length)) - 1
          //   let text = msg[Math.floor(Math.random() * msg.length)]
          //   const total = memberTotal - member.length
          //   if (memberTotal <= member.length) {
          //     task[unqiueID].cron.stop()
          //   }

          //   if (task[unqiueID].count >= minutePeriod) {
          //     task[unqiueID].cron.stop()
          //     await setState(e, { bypass: false })
          //     text = `บอทเสียใจ 😭 ม..ไม่มีใครคุยด้วยเลย😢 ป...ไปก็ได้😢 ยังขาดอีก *${total}* คนนะ`
          //   }

          //   await line.pushMessage(unqiueID, {
          //     type: 'text',
          //     text: text
          //       ? text.replace(/:n/, `*${total}*`)
          //       : `เร็วๆ ยังขาดอีก *${total}* คนนะ`
          //   })
          // })
        }
      },
      bypass: async (e, lineMessage, line, forceStop) => {
        if (e.source.type !== 'room' && e.source.type !== 'group') {
          return
        }
        const unqiueID = getID(e)

        const memberTotal = await getState(e, 'memberTotal')
        if (forceStop) {
          if (task[unqiueID].cron) {
            task[unqiueID].cron.stop()
          }
          await setState(e, { bypass: false })

          const member = await getState(e, 'member')
          const nickname = []
          for await (const userId of member) {
            const user = await getNickname(e, 'ris-robo', userId)
            nickname.push(user ? user.name : userId)
          }

          await line.pushMessage(unqiueID, {
            type: 'text',
            text: nickname.length
              ? `จบงานแล้ว นับได้ \`${nickname.length}\` คน\n- ${nickname.join(
                  '\n- '
                )}`
              : 'อ้าว ไม่มีคนเลย'
          })
        } else {
          const userId = await getState(e, 'userId')
          if (userId === e.source.userId) {
            return
          }

          await setState(e, { member: [e.source.userId] })

          const member = await getState(e, 'member')
          if (memberTotal <= member.length) {
            if (task[unqiueID].cron) {
              task[unqiueID].cron.stop()
            }

            await setState(e, { bypass: false })
            await line.pushMessage(unqiueID, {
              type: 'text',
              text: '🥰 ครบแล้วสินะ!! 💯 `แยกย้าย` 💥'
            })
          }
        }
      }
    }
  ]
}
