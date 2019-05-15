const express = require('express')
const bodyParser = require('body-parser')

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


app.get('/db/inbound', async (req, res) => {
  // let { p } = req.params
  res.json((await mongo.get('LineInbound').find({}, null, { sort: { created: -1 }, skip: 0, limit: 1000 })) || [])
  res.end()
})

app.get('/db/outbound', async (req, res) => {
  // let { p } = req.params
  res.json((await mongo.get('LineOutbound').find({}, null, { sort: { created: -1 }, skip: 0, limit: 1000 })) || [])
  res.end()
})

app.get('/db/cmd/:bot', async (req, res) => {
  let { bot } = req.params
  let opts = { limit: 100 }
  let filter = { executed: false, botname: bot }

  res.json((await mongo.get('LineCMD').find(filter, null, opts)) || [])
  res.end()
})

app.get('/', (req, res) => res.end('LINE Messenger Bot Endpoint.'))

if (!process.env.MONGODB_URI) throw new Error('Mongo connection uri is undefined.')

const mongo = require('./mongodb')
mongo.open().then(async () => {
  console.log(`LINE-BOT MongoDB Connected.`)

  await app.listen(port)
  console.log(`LINE Messenger Bot Endpoint listening on port ${port}!`)
})
