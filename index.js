const express = require('express')
const bodyParser = require('body-parser')
const line = require('@line/bot-sdk')
const port = process.env.PORT || 3000
const app = express()
 
const client = new line.Client({
  channelAccessToken: 'Mv6ULaO86WfeFE3KrueZmazOiwFFwYJiEUYn+RQt6oFc313g8KFSYrx+Z7+odTH3qqvCp5hjl75n9XYtmDg35A4BD/EQIMYoVhMvdtRy0aXUmQ62KMp6KEu8XbChgo9bQ/G4hsnsJCF+4OWH6K1EuwdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'c0e4547f7379cbb385259ac33d89911c'
})

const getId = event => {
  if (event.source.type === 'room') {
    return event.source.roomId
  } else if (event.source.type === 'group') {
    return event.source.groupId
  } else {
    return event.userId
  }
}
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.end('LINE Messenger Bot Endpoint.')
})
app.get('/hook/:id/:msg', (req, res) => {
  let { id, msg } = req.params
  console.log(id, msg)
  res.end()
})
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
          if (event.replyToken) client.replyMessage(event.replyToken, sender)
          // handlerCommand(cmd, exec.groups.arg.trim(), event).then(() => {
          console.log(`${getId(event)}::${cmd}`)
          // }).catch(ex => {
          //   console.error(ex)
          // })
          break
        }
        if (!cmdFound) {
          let sender = { type: 'text', text: event.message.text }
          client.pushMessage(getId(event), sender)
          console.log(`${getId(event)}::${vent.message.text}`)
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
