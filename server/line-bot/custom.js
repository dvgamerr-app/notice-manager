const cron = require('node-cron')
const { notice } = require('@touno-io/db/schema')

const getID = (e) => {
  if (!e || !e.source) { throw new Error('getID() :: Event is unknow source.') }
  return e.source[`${e.source.type}Id`]
}

const setVariable = async (e, name, value, clear) => {
  if (!name) return

  const LineBotRoom = notice.get('LineBotRoom')
  const data = await LineBotRoom.findOne({ id: getID(e) })
  if (!data.variable) return

  if (typeof name === 'object') {
    if (name.member && name.member.length) name.member = Array.from(new Set(data.variable.member.concat(name.member)))
    await LineBotRoom.updateOne({ id: getID(e) }, { $set: { variable: clear ? name : Object.assign(data.variable, name) } })
  } else {
    const variable = {}
    variable[name] = value
    await LineBotRoom.updateOne({ id: getID(e) }, { $set: { variable: clear ? name : Object.assign(data.variable, variable) } })
  }
}

const getVariable = async (e, name) => {
  const data = ((await notice.get('LineBotRoom').findOne({ id: getID(e) })) || {})
  return data.variable && data.variable[name] 
}

const task = {}
const msg = [
  'ยังขาดอีก :n คนนะ 😄',
  'เร็วๆ สิ 🤗ยังไม่ตอบ :n คน',
  'เฮ้ยยย 😦 อีก :n คนนะ ยังไม่ตอบ',
  'ไปไหนกันวะ อีก :n คนอะ?? 🙄',
  'นี่ก็ไม่รู้ว่าใครนะ :n คนอะ 😓 ตอบเค้าหน่อยสิ',
  'นี้!! 😭 จะไม่ตอบเค้าจิงๆ เหรอ :n คนนั้นอะ',
  'ทำไม 🤬 ไม่ตอบวะ :n คนอะ',
  ':n คนนั้น 😡 ถ้าไม่ตอบจะไปจริงๆ ละนะ'
]
const minutePeriod = 30
module.exports = {
  'ris-robo': [
    {
      cmd: [ 'เช็คชื่อ', 'เช๊คชื่อ', 'เชคชื่อ', 'เชคชือ', 'checkname' ],
      job: async (e, lineMessage, line) => {
        if (e.source.type !== 'room' && e.source.type !== 'group') return
        const unqiueID = getID(e)

        console.log(e.source.type, ':', unqiueID)
        task[unqiueID] = { count: 0, cron: null }
        if (e.source.type == 'group') {
          await setVariable(e, { bypass: true, index: 0, userId: e.source.userId, member: [] }, true)

          const member = await line.getGroupMembersCount(unqiueID)
          await setVariable(e, { memberTotal: member.count - 1 })
  
          await line.pushMessage(unqiueID, { type: 'text', text: `💬 ไหนมีใครมาบ้าง *เช็คชื่อสิ* !!` })
          task[unqiueID].cron = cron.schedule('* * * * *', async () => {
            const memberTotal = await getVariable(e, 'memberTotal')
            const member = await getVariable(e, 'member')
            
            task[unqiueID].count++
            let text = msg[Math.ceil(task[unqiueID].count / (minutePeriod / msg.length)) - 1]
            const total = memberTotal - member.length
            if (memberTotal <= member.length) {
              task[unqiueID].cron.stop()
            }

            if (task[unqiueID].count >= minutePeriod) {
              task[unqiueID].cron.stop()
              text = 'บอทเสียใจ 😭 ม..ไม่มีใครคุยด้วยเลย😢 ป...ไปก็ได้😢'
            }
            
            await line.pushMessage(unqiueID, { type: 'text', text: text ? text.replace(/:n/, `*${total}*`) : `เร็วๆ ยังขาดอีก *${total}* คนนะ` })
          })
        }

      },
      bypass: async (e, lineMessage, line, forceStop) => {
        if (e.source.type !== 'room' && e.source.type !== 'group') return
        const unqiueID = getID(e)
        
        const memberTotal = await getVariable(e, 'memberTotal')
        if (forceStop) {
          if (task[unqiueID].cron) task[unqiueID].cron.stop()

          const member = await getVariable(e, 'member')
          await setVariable(e, { bypass: false })
          await line.pushMessage(unqiueID, { type: 'text', text: member.length ? `จบงานนับได้ \`${member.length}\` คน\n- ${member.join('\n- ')}`: 'อ้าว ไม่มีคนเลย' })
        } else {
          const userId = await getVariable(e, 'userId')
          if (userId === e.source.userId) return

          await setVariable(e, { member: [ e.source.userId ] })
  
          const member = await getVariable(e, 'member')
          if (memberTotal <= member.length) {
            if (task[unqiueID].cron) task[unqiueID].cron.stop()

            await setVariable(e, { bypass: false })
            await line.pushMessage(unqiueID, { type: 'text', text: `ครบแล้วสินะ!! 💯 \`แยกย้าย\`` })
          }
        }
      }
    }
  ]
}