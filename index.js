const express = require('express')
const bodyParser = require('body-parser')
const line = require('@line/bot-sdk')
const port = process.env.PORT || 3000
const app = express()
 
const client = new line.Client(require('./channel'))

const getId = event => {
  if (event.source.type === 'room') {
    return event.source.roomId
  } else if (event.source.type === 'group') {
    return event.source.groupId
  } else {
    return event.source.userId
  }
}
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.end('LINE Messenger Bot Endpoint.')
})
app.get('/test', (req, res) => {
  client.pushMessage('U9e0a870c01ca97da20a4ec462bf72991', {
    type: 'text',
    text: 'Hello Quick Reply!',
    quickReply: {
     items: [
      {
       type: 'action',
       action: {
        type: 'datetimepicker',
        label: 'Datetime Picker',
        data: 'storeId=12345',
        mode: 'datetime',
        initial: '2018-09-11T00:00',
        max: '2018-12-31T23:59',
        min: '2018-01-01T00:00'
       }
      }
     ]
    }
   })
  
  res.end('test cmd')
})
app.get('/hook/:id/:msg', (req, res) => {
  let { id, msg } = req.params
  client.pushMessage(id, { type: 'text', text: msg }).catch(ex => {
    console.log('webhook::', id, msg)
  })
  res.end()
})

const groupAlert = 'C31ca657c0955d89dcb049d63bfc32408'
app.post('/', (req, res) => {
  let { events } = req.body
  if (!events) return res.end()

  if (events.length > 0) {
    const cmds = [ 'profile', 'sick', 'leave', 'watch', 'help' ]
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        let { text } = event.message
        let cmdFound = false
        for (const cmd of cmds) {
          let command = new RegExp(`^/${cmd}(?<arg>\\W.*|)`, 'ig')
          let exec = command.exec(text)
          if (!exec) continue

          cmdFound = true
          let sender = { type: 'text', text: `*CMD* ${cmd} \`${exec.groups.arg.trim()}\`` }

          if (cmd === 'help') {
            sender.text = `*Command*
\`/help\` ดูคำสั่งที่มีทั้งหมด
\`/sick\` [date] แจ้งขอลาป่วย \`/sick today\`
\`/leave\` [date-range] ดูข้อมูลส่วนตัวของเมมเบอร์ \`/leave 2019-01-01|2019-12-31\`
\`/profile\` ดูข้อมูลของ chat`
            client.replyMessage(event.replyToken, sender)
          } else if (cmd === 'sick') {
            if (!exec.groups.arg.trim()) continue
            let { userId } = event.source
            
            client.getProfile(userId).then(p => {
              sender.text = `คุณ${p.displayName} แจ้งขอลาป่วย *${exec.groups.arg.trim()}*`
              return client.pushMessage(groupAlert, sender)
            })

          } else if (cmd === 'leave') {
            if (!exec.groups.arg.trim()) continue
            let { userId } = event.source

            client.getProfile(userId).then(p => {
              sender.text = `คุณ${p.displayName} แจ้งขอลาพักร้อน *${exec.groups.arg.trim()}*`
              return client.pushMessage(groupAlert, sender)
            })
          } else if (cmd === 'watch') {
          } else if (cmd === 'profile') {
            let { userId, type, groupId, roomId } = event.source
            if (type === 'room') {
              sender.text = `*RoomId:* \`${roomId}\``
              return client.replyMessage(event.replyToken, sender)
            } else if (type === 'group') {
              sender.text = `*GroupId:* \`${groupId}\``
              return client.replyMessage(event.replyToken, sender)
            } else {
              client.getProfile(userId).then(p => {
                sender.text = `*${p.displayName}* - ${p.statusMessage}\n\`${p.userId}\`\n\`${p.pictureUrl}\``
                return client.replyMessage(event.replyToken, sender)
              })
            }
          }
          console.log(`${getId(event)}::${cmd}`)
          break
        }
        if (!cmdFound) {
          let sender = { type: 'text', text: event.message.text }
          client.pushMessage(getId(event), sender)
          console.log(`${getId(event)}::${event.message.text}`)
        }
      }
    }
  } else if (events.type === 'join') {
    let { groupId } = events.source
    console.log(`${groupId}::joined`)
    
  } else if (events.type === 'leave') {
    let { groupId } = events.source
    console.log(`${groupId}::leaved`)

  } else {
    console.log(events)
  }
  res.end()
})
app.listen(port, () => {
  console.log(`Example app listening on port !`)
})
