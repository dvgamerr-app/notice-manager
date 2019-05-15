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
app.get('/db/:bot/inbound', () => {})
app.get('/db/:bot/outbound', () => {})

app.get('/stats', async (req, res) => {
  const { LineBot } = mongo.get()
  try {
      
    let data = await LineBot.find({ type: 'line' })
    for (const line of data) {
      let { stats } = line.options
      res.write(`
        <div>
          <b>${line.name}</b> (${line.botname})
          <span>Monthly Usage: ${stats.usage}</span>
          <span>Limited: ${!stats.limited ? 'none' : stats.limited}</span>
        </div>
      `)
    }
  } catch (ex) {
    console.log(ex)
  }
  res.end()
})

app.get('/', (req, res) => res.end('LINE Messenger Bot Endpoint.'))
// app.get('/db/inbound', async (req, res) => {
//   // let { p } = req.params
//   res.json((await mongo.get('LineInbound').find({}, null, { sort: { created: -1 }, skip: 0, limit: 1000 })) || [])
//   res.end()
// })

// app.get('/db/outbound', async (req, res) => {
//   // let { p } = req.params
//   res.json((await mongo.get('LineOutbound').find({}, null, { sort: { created: -1 }, skip: 0, limit: 1000 })) || [])
//   res.end()
// })

// app.get('/db/cmd/:bot', async (req, res) => {
//   let { bot } = req.params
//   let opts = { limit: 100 }
//   let filter = { executed: false, botname: bot }

//   res.json((await mongo.get('LineCMD').find(filter, null, opts)) || [])
//   res.end()
// })
const lineInitilize = async () => {
  const { LineBot } = mongo.get()
      
  let data = await LineBot.find({ type: 'line' })
  for (const line of data) {
    let quota = await request('https://api.line.me/v2/bot/message/quota', {
      headers: { 'Authorization': `Bearer ${line.accesstoken}` },
      json: true
    })
    let consumption = await request('https://api.line.me/v2/bot/message/quota/consumption', {
      headers: { 'Authorization': `Bearer ${line.accesstoken}` },
      json: true
    })
    let reply = await request('https://api.line.me/v2/bot/message/delivery/reply?date=20190514', {
      headers: { 'Authorization': `Bearer ${line.accesstoken}` },
      json: true
    })
    let push = await request('https://api.line.me/v2/bot/message/delivery/push?date=20190514', {
      headers: { 'Authorization': `Bearer ${line.accesstoken}` },
      json: true
    })
    console.log(line.botname, quota, consumption, reply, push)
  }
}


if (!process.env.MONGODB_URI) throw new Error('Mongo connection uri is undefined.')

lineInitilize().then(async () => {
  await mongo.open()
  console.log(`LINE-BOT MongoDB Connected.`)

  await app.listen(port)
  console.log(`LINE Messenger Bot Endpoint listening on port ${port}!`)
})
