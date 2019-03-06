var express = require('express')
var bodyParser = require('body-parser')
var port = process.env.PORT || 3000
var app = express()
 
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.end('LINE Messenger Bot Endpoint.')
})
app.get('/msg/:text', (req, res) => {
  console.log(req.params)
  res.end()
})
app.post('/', (req, res) => {
  let { events } = req.body
  if (!events || events.length !== 1) return res.end()
  // { events:
  // [ { type: 'message',
  // replyToken: '1556e236aae74f049ccdd7acbf9e7e36',
  // source: [Object],
  // timestamp: 1551861466203,
  // message: [Object] } ],
  // destination: 'Uedd5b2eca50d2222cdff229b626ae3cb' }
  const cmds = [ 'id', 'profile' ]
  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      let { text } = event.message
      let cmdFound = false
      for (const cmd of cmds) {
        let command = new RegExp(`^/${cmd}(?<arg>\\W.*|)`, 'ig')
        let exec = command.exec(text)
        if (!exec) continue

        cmdFound = true
        // handlerCommand(cmd, exec.groups.arg.trim(), event).then(() => {
        console.log(`${event.source.userId}::${cmd}`)
        // }).catch(ex => {
        //   console.error(ex)
        // })
        break
      }
      if (!cmdFound) {
        console.log(event.destination, event.source, event.message)
      }
    }
  }
  res.end()
})
app.listen(port, () => {
  console.log(`Example app listening on port !`)
})
