import { db } from '../../lib/db.js'
import wakaRank from '../flex/waka-rank.js'
import wakaUser from '../flex/waka-user.js'

const wakaApi = 'https://wakatime.com/api/v1'
const getSourceId = (e) => e.source[`${e.source.type}Id`]

const getRoom = (event, botName) =>
  db.selectFrom('line_bot_room').select(['name', 'variable'])
    .where('bot_name', '=', botName)
    .where('room_id', '=', getSourceId(event))
    .executeTakeFirst()

// Read/write per-user state stored in line_bot_room.variable JSONB
const getState = async (event, botName, key) => {
  const room = await db.selectFrom('line_bot_room').select('variable')
    .where('bot_name', '=', botName).where('room_id', '=', getSourceId(event)).executeTakeFirst()
  const variable = room?.variable || []
  const entry = variable.find(v => v.userId === event.source.userId)
  return key ? entry?.data?.[key] : entry?.data
}

const setState = async (event, botName, updates) => {
  const roomId = getSourceId(event)
  const room = await db.selectFrom('line_bot_room').select('variable')
    .where('bot_name', '=', botName).where('room_id', '=', roomId).executeTakeFirst()
  const variable = room?.variable || []
  const idx = variable.findIndex(v => v.userId === event.source.userId)
  if (idx === -1) {
    variable.push({ userId: event.source.userId, data: updates })
  } else {
    variable[idx].data = Object.assign(variable[idx].data || {}, updates)
  }
  await db.updateTable('line_bot_room').set({ variable: JSON.stringify(variable) })
    .where('bot_name', '=', botName).where('room_id', '=', roomId).execute()
}

const getRoomData = async (event, botName) => {
  const room = await db.selectFrom('line_bot_room').select('variable')
    .where('bot_name', '=', botName).where('room_id', '=', getSourceId(event)).executeTakeFirst()
  return room?.variable || []
}

const getNickname = async (event, botName, userId) => {
  const room = await getRoom(event, botName)
  if (!room?.name) return null
  const user = await db.selectFrom('line_bot_user').select('name')
    .where('bot_name', '=', botName).where('room_name', '=', room.name)
    .where('user_id', '=', userId || event.source.userId).executeTakeFirst()
  return user?.name
}

const renameUser = async (event, botName, name) => {
  const room = await getRoom(event, botName)
  if (!room?.name) return
  await db.deleteFrom('line_bot_user')
    .where('bot_name', '=', botName).where('room_name', '=', room.name).where('user_id', '=', event.source.userId).execute()
  await db.insertInto('line_bot_user')
    .values({ bot_name: botName, room_name: room.name, user_id: event.source.userId, name }).execute()
}

const wakaRanking = async (event, botName) => {
  const data = await getRoomData(event, botName)
  const sorted = [...data].sort((a, b) => (b.data?.wakaStats?.total_seconds || 0) - (a.data?.wakaStats?.total_seconds || 0))
  return sorted.findIndex(v => v.userId === event.source.userId) + 1
}

const regexWakaKey = (text) => {
  const [key] = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi.exec(text) || []
  return key
}

const wakaUserProfile = async (event, botName, wakaKey) => {
  try {
    const res = await fetch(`${wakaApi}/users/current?api_key=${wakaKey.trim()}`)
    if (!res.ok) return null
    const { data: user } = await res.json()
    await renameUser(event, botName, user.display_name)
    await setState(event, botName, { wakaKey, wakaUser: user })
    return user
  } catch { return null }
}

const wakaUserStats = async (event, botName, wakaKey) => {
  try {
    const res = await fetch(`${wakaApi}/users/current/stats/last_7_days?api_key=${wakaKey.trim()}`)
    if (!res.ok) return null
    const { data } = await res.json()
    await setState(event, botName, { languages: data.languages.map(l => l.name).join(), wakaStats: data })
    return data
  } catch { return null }
}

const wakaWelcomeUser = async (event, botName, user, push) => {
  const wakaKey = await getState(event, botName, 'wakaKey')
  const stats = await wakaUserStats(event, botName, wakaKey)
  if (user.timeout !== 15) {
    return push(event, 'คุณผิดกติกา ไปตั้งค่าที่\nsettings > preferences > Timeout เป็น 15 นาทีด้วยครับ')
  }
  const rank = await wakaRanking(event, botName)
  await setState(event, botName, { rank })
  await push(event, wakaUser(user, stats, rank))
}

// ponytail: export as map keyed by bot service name
export default {
  'ris-robo': [
    {
      cmd: ['จัดอันดับ'],
      job: async (event, push, _client, botName) => {
        const key = regexWakaKey(event.message.text)
        if (!key) {
          await setState(event, botName, { bypass: true, index: 0, event: 'secret-save' })
          return push(event, 'ใส่ secret key ที่ได้จาก wakatime ด้วยคับ')
        }
        const user = await wakaUserProfile(event, botName, key)
        if (!user) {
          await setState(event, botName, { bypass: true, index: 0, event: 'secret-save' })
          return push(event, 'ใส่ secret key ใหม่นะคับ')
        }
        await wakaWelcomeUser(event, botName, user, push)
      },
      bypass: async (event, push, _client, forceStop, botName) => {
        if (forceStop) { await setState(event, botName, { bypass: false }); return }
        const eventName = await getState(event, botName, 'event')
        if (eventName !== 'secret-save') return
        const key = regexWakaKey(event.message.text)
        const user = key && await wakaUserProfile(event, botName, key)
        if (!user) return push(event, 'ใส่ secret key อีกครั้งคับ')
        await wakaWelcomeUser(event, botName, user, push)
        await setState(event, botName, { bypass: false })
      }
    },
    {
      cmd: ['แสดงอันดับ'],
      job: async (event, push, _client, botName) => {
        const data = await getRoomData(event, botName)
        push(event, wakaRank(data.map(e => ({ user: e.data.wakaUser, stats: e.data.wakaStats }))))
      }
    },
    {
      cmd: ['เช็คชื่อ', 'เช๊คชื่อ', 'เชคชื่อ', 'เชคชือ', 'checkname'],
      job: async (event, push, client, botName) => {
        if (event.source.type !== 'room' && event.source.type !== 'group') return
        const roomId = getSourceId(event)
        await setState(event, botName, { bypass: true, index: 2, userId: event.source.userId, member: [] })
        const res = await client.getGroupMembersCount(roomId)
        await setState(event, botName, { memberTotal: (res.count || 0) - 1 })
        await client.push(roomId, { type: 'text', text: '💬 ไหนมีใครมาบ้าง *เช็คชื่อสิ* !!' })
      },
      bypass: async (event, push, client, forceStop, botName) => {
        if (event.source.type !== 'room' && event.source.type !== 'group') return
        const roomId = getSourceId(event)
        if (forceStop) {
          await setState(event, botName, { bypass: false })
          const member = await getState(event, botName, 'member') || []
          const nicknames = await Promise.all(member.map(uid => getNickname(event, botName, uid)))
          const names = nicknames.map((n, i) => n || member[i])
          await client.push(roomId, { type: 'text', text: names.length ? `จบงานแล้ว นับได้ \`${names.length}\` คน\n- ${names.join('\n- ')}` : 'อ้าว ไม่มีคนเลย' })
          return
        }
        const userId = await getState(event, botName, 'userId')
        if (userId === event.source.userId) return
        const member = await getState(event, botName, 'member') || []
        if (!member.includes(event.source.userId)) member.push(event.source.userId)
        await setState(event, botName, { member })
        const memberTotal = await getState(event, botName, 'memberTotal') || 0
        if (memberTotal <= member.length) {
          await setState(event, botName, { bypass: false })
          await client.push(roomId, { type: 'text', text: '🥰 ครบแล้วสินะ!! 💯 `แยกย้าย` 💥' })
        }
      }
    }
  ]
}
