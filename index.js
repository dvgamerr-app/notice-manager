/* eslint-disable no-console */
// const { join } = require('path')
// const { readFileSync } = require('fs')
const express = require('express')
const debuger = require('@touno-io/debuger')
// const request = require('request-promise')
const bodyParser = require('body-parser')
// const cron = require('node-cron')
const mongo = require('./line-bot')
// const moment = require('moment')
// const { WebClient } = require('@slack/web-api')

const pkg = require('./package.json')
const port = process.env.PORT || 4000
const dev = !(process.env.NODE_ENV === 'production')
const app = express()

const pkgChannel = 'api-line-bot'
const pkgName = `LINE-BOT v${pkg.version}`

if (!process.env.MONGODB_URI) throw new Error('Mongo connection uri is undefined.')
if (!process.env.SLACK_TOKEN) throw new Error('Token slack is undefined.')
if (!process.env.LINE_CLIENT || !process.env.LINE_SECRET) throw new Error('LINE secret is undefined.')
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/jsons
app.use(bodyParser.json())

app.post('/:bot', require('./route-bot/webhook'))
// app.put('/:bot/:to?', require('./route-bot/push-message'))
// app.put('/flex/:name/:to', require('./route-bot/push-flex'))
// app.post('/slack/:channel', require('./route-bot/push-slack'))


// app.get('/db/:bot/cmd', require('./route-db/bot-cmd'))
// app.post('/db/:bot/cmd/:id', require('./route-db/bot-cmd'))
// app.get('/db/:bot/inbound', require('./route-db/inbound'))
// app.get('/db/:bot/outbound', require('./route-db/outbound'))

app.use('/_health', (req, res) => res.sendStatus(200))
app.get('/register-bot/:room?', require('./route-bot/oauth'))

// API router
app.get('/api/dashboard', require('./route-db/dashboard'))

// const lineAlert = require('./flex/alert')
// An access token (from your Slack app or custom integration - xoxp, xoxb)
// const slackStats = require('./flex/stats')


// const lineInitilize = async () => {
//   const { LineBot } = mongo.get()
//   let date = moment().add(7, 'hour').add(-1, 'day')

//   let data = await LineBot.find({ type: 'line' })
//   for (const line of data) {
//     const opts = { headers: { 'Authorization': `Bearer ${line.accesstoken}` }, json: true }

//     let quota = await request('https://api.line.me/v2/bot/message/quota', opts)
//     let consumption = await request('https://api.line.me/v2/bot/message/quota/consumption', opts)
//     let reply = await request(`https://api.line.me/v2/bot/message/delivery/reply?date=${date.format('YYYYMMDD')}`, opts)
//     let push = await request(`https://api.line.me/v2/bot/message/delivery/push?date=${date.format('YYYYMMDD')}`, opts)

//     let stats = {
//       usage : consumption.totalUsage,
//       limited : quota.type === 'limited' ? quota.value : 0,
//       reply: reply.status === 'ready' ? reply.success : reply.status,
//       push: push.status === 'ready' ? push.success : push.status,
//       updated: date.toDate()
//     }
//     await LineBot.updateOne({ _id: line._id }, { $set: { options: { stats } } })
//   }
// }

// const scheduleDenyCMD = async () => {
//   const { LineCMD } = mongo.get()
//   let updated = await LineCMD.updateMany({ created : { $lte: new Date(+new Date() - 300000) }, executing: false, executed: false }, {
//     $set: { executed: true }
//   })
//   if (updated.n > 0) console.log(`LINE-BOT ${updated.n} commands is timeout.`)
// }
// const scheduleStats = async () => {
//   let { LineBot } = mongo.get() // LineInbound, LineOutbound, LineCMD, 
//   let data = await LineBot.find({ type: 'line' }, null, { sort: { botname: 1 } })
//   data = data.map(e => {
//     return { botname: e.botname, name: e.name, stats: e.options.stats }
//   })
  
//   await web.chat.postMessage(Object.assign({ channel: 'CK6BUP7M0', username: title }, slackStats(title, data)))
// }

const logger = debuger(pkg.title)
logger.log(`MongoDB 'LINE-BOT' Connecting...`)
mongo.open().then(async () => {
  await app.listen(port)
  logger.log(`listening port is ${port}.`)
  // logs += `[${moment().add(7, 'hour').format('HH:mm:ss')}] listening on port ${port}\n`
  if (!dev) {
    // GMT Timezone +0
    // lineInitilize().catch(errorToSlack)
    // cron.schedule('0 5,11,17,23 * * *', () => lineInitilize().catch(errorToSlack))
    // cron.schedule('* * * * *', () => scheduleDenyCMD().catch(errorToSlack))
    // cron.schedule('0 0 * * *', () => scheduleStats().catch(errorToSlack))
    // cron.schedule('0 20 * * *', async () => {
    //   await web.chat.postMessage({ channel: 'CK6BUP7M0', text: '*Heroku* server has terminated yourself.', username: title })
    //   process.exit()
    // })
    // logs += `[${moment().add(7, 'hour').format('HH:mm:ss')}] Stats bot update crontab every 6 hour.\n`
    // logs += `[${moment().add(7, 'hour').format('HH:mm:ss')}] Deny cmd crontab every minute.\n`
    // logs += `[${moment().add(7, 'hour').format('HH:mm:ss')}] Monthly usage every day at 7am.\n`
    // logs += `[${moment().add(7, 'hour').format('HH:mm:ss')}] heroku kill service every day at 3am.`

    // const { ServiceStats } = mongo.get()
    // if (!await ServiceStats.find({ name: 'line-bot' })) {
    //   await new ServiceStats({ name: 'line-bot', type: 'heroku', desc: 'line bot server.', wan_ip: 'unknow', lan_ip: 'unknow', online: true }).save()
    // }
    // restart line-bot notify.
    // web.chat.postMessage({ channel: 'CK6BUP7M0', text: '*Heroku* server has `rebooted`, and ready.', username: title })
  }
}).catch(async ex => {
  errorToSlack(ex).then(() => {
    process.exit()
  })
})
