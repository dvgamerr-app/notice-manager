const express = require('express')
const request = require('request-promise')
const bodyParser = require('body-parser')
const mongo = require('./mongodb')

const port = process.env.PORT || 4000
const app = express()
 
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

app.post('/:bot', require('./route-bot/webhook'))
app.put('/:bot/:to?', require('./route-bot/push-message'))

app.get('/db/:bot/cmd', require('./route-db/bot-cmd'))
app.post('/db/:bot/cmd/:id', require('./route-db/bot-cmd'))
app.get('/db/:bot/inbound', require('./route-db/inbound'))
app.get('/db/:bot/outbound', require('./route-db/outbound'))

app.get('/stats', async (req, res) => {
  const { LineBot } = mongo.get()
  try {
      
    let data = await LineBot.find({ type: 'line' })
    res.write(`<table><tr><td>Name</td><td>Monthly usage</td><td>Limited</td><td>Reply (lastday)</td><td>Push (lastday)</td></tr>`)
    for (const line of data) {
      let { stats } = line.options
      res.write(`
        <tr>
          <td><b>${line.name}</b> (${line.botname})</td>
          <td>${stats.usage}</td>
          <td>${stats.limited}</td>
          <td>${stats.reply}</td>
          <td>${stats.push}</td>
        </tr>
      `)
    }
    res.write(`</table>`)
  } catch (ex) {
    console.log(ex)
  }
  res.end()
})

app.get('/', (req, res) => res.end('LINE Messenger Bot Endpoint.'))

const lineInitilize = async () => {
  const { LineBot } = mongo.get()
  let date = new Date(new Date().setHours(-24)).toISOString().replace(/-/ig,'').substr(0, 8)
      
  let data = await LineBot.find({ type: 'line' })
  for (const line of data) {
    const opts = { headers: { 'Authorization': `Bearer ${line.accesstoken}` }, json: true }

    let quota = await request('https://api.line.me/v2/bot/message/quota', opts)
    let consumption = await request('https://api.line.me/v2/bot/message/quota/consumption', opts)
    let reply = await request(`https://api.line.me/v2/bot/message/delivery/reply?date=${date}`, opts)
    let push = await request(`https://api.line.me/v2/bot/message/delivery/push?date=${date}`, opts)

    let stats = {
      usage : consumption.totalUsage,
      limited : quota.type === 'limited' ? quota.value : 0,
      reply: reply.status === 'ready' ? reply.success : reply.status,
      push: push.status === 'ready' ? push.success : push.status
    }
    await LineBot.updateOne({ _id: line._id }, { $set: { options: { stats } } })
  }
}


if (!process.env.MONGODB_URI) throw new Error('Mongo connection uri is undefined.')

mongo.open().then(async () => {
  console.log(`LINE-BOT MongoDB Connected.`)
  await app.listen(port)
  console.log(`LINE-BOT Messenger Endpoint listening on port ${port}!`)

  lineInitilize().then(() => {
    console.log(`LINE-BOT Initilized.`)
  })
})
