const express = require('express')
const request = require('request-promise')
const bodyParser = require('body-parser')
const cron = require('node-cron')
const mongo = require('./mongodb')
const moment = require('moment')

const port = process.env.PORT || 4000
const app = express()
 
// process.env.MONGODB_URI = 'mongodb+srv://dbLINE:CZBwk6XtyIGHleJS@line-bot-obya7.gcp.mongodb.net/LINE-BOT'
if (!process.env.MONGODB_URI) throw new Error('Mongo connection uri is undefined.')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/jsons
app.use(bodyParser.json())

app.post('/:bot', require('./route-bot/webhook'))
app.put('/:bot/:to?', require('./route-bot/push-message'))

app.get('/db/:bot/cmd', require('./route-db/bot-cmd'))
app.post('/db/:bot/cmd/:id', require('./route-db/bot-cmd'))
app.get('/db/:bot/inbound', require('./route-db/inbound'))
app.get('/db/:bot/outbound', require('./route-db/outbound'))

app.get('/stats', require('./route-db/stats'))

app.use('/static', express.static('./static'))
app.get('/', (req, res) => res.end('LINE Messenger Bot Endpoint.'))

const lineAlert = require('./flex/alert')
const lineStats = require('./flex/stats')
const lineError = require('./flex/error')

const lineInitilize = async () => {
  const { LineBot } = mongo.get()
  let date = moment().add(7, 'hour').add(-1, 'day')
      
  let data = await LineBot.find({ type: 'line' })
  for (const line of data) {
    const opts = { headers: { 'Authorization': `Bearer ${line.accesstoken}` }, json: true }

    let quota = await request('https://api.line.me/v2/bot/message/quota', opts)
    let consumption = await request('https://api.line.me/v2/bot/message/quota/consumption', opts)
    let reply = await request(`https://api.line.me/v2/bot/message/delivery/reply?date=${date.format('YYYYMMDD')}`, opts)
    let push = await request(`https://api.line.me/v2/bot/message/delivery/push?date=${date.format('YYYYMMDD')}`, opts)

    let stats = {
      usage : consumption.totalUsage,
      limited : quota.type === 'limited' ? quota.value : 0,
      reply: reply.status === 'ready' ? reply.success : reply.status,
      push: push.status === 'ready' ? push.success : push.status,
      updated: date.toDate()
    }
    await LineBot.updateOne({ _id: line._id }, { $set: { options: { stats } } })
  }
}

const scheduleDenyCMD = async () => {
  const { LineCMD } = mongo.get()
  let updated = await LineCMD.updateMany({ created : { $lte: new Date(+new Date() - 300000) }, executing: false, executed: false }, {
    $set: { executed: true }
  })
  if (updated.n > 0) console.log(`LINE-BOT ${updated.n} commands is timeout.`)
}
const scheduleStats = async () => {
  let { LineBot } = mongo.get() // LineInbound, LineOutbound, LineCMD, 
  let data = await LineBot.find({ type: 'line' }, null, { sort: { botname: 1 } })
  data = data.map(e => {
    return { botname: e.botname, name: e.name, stats: e.options.stats }
  })
  await lineStats(data)
}

let logs = ''
const pkg = require('./package.json')
let title = `LINE-BOT v${pkg.version}`
mongo.open().then(async () => {
  await app.listen(port)
  logs += `[${moment().add(7, 'hour').format('HH:mm:ss')}] listening on port ${port}\n`
 
  // GMT Timezone +0
  lineInitilize().catch(ex => lineError(title, ex))
  cron.schedule('0 5,11,17,23 * * *', () => lineInitilize().catch(ex => lineError(title, ex)))
  cron.schedule('* * * * *', () => scheduleDenyCMD().catch(ex => lineError(title, ex)))
  cron.schedule('0 0 * * *', () => scheduleStats().catch(ex => lineError(title, ex)))
  cron.schedule('0 20 * * *', async () => {
    await lineAlert(title, 'Heroku schedule kill service.', null, '#ff9800')
    process.exit()
  })
  logs += `[${moment().add(7, 'hour').format('HH:mm:ss')}] Stats bot update crontab every 6 hour.`
  logs += `[${moment().add(7, 'hour').format('HH:mm:ss')}] Deny cmd crontab every minute.`
  logs += `[${moment().add(7, 'hour').format('HH:mm:ss')}] Monthly usage every day at 7am.`
  logs += `[${moment().add(7, 'hour').format('HH:mm:ss')}] heroku kill service every day at 3am.`

  // restart line-bot notify.
  lineAlert(title, 'Heroku server has rebooted, and ready.', logs).catch(console.error)
}).catch(async ex => {
  await lineError(title, ex)
  process.exit()
})