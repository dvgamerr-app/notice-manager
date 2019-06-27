import express from 'express'
import debuger from '@touno-io/debuger'
import bodyParser from 'body-parser'
import { Nuxt, Builder } from 'nuxt'

// Import and Set Nuxt.js options
import pkg from '../package.json'
import config from '../nuxt.config.js'
import mongo from './line-bot'
import { slackMessage } from './slack-bot'

const app = express()
const port = process.env.PORT || 4000
const host = process.env.HOST || '127.0.0.1'
const dev = !(process.env.NODE_ENV === 'production')
const pkgChannel = 'api-line-bot'
const pkgName = `LINE-BOT v${pkg.version}`
const logger = debuger(pkg.title)

const errorToSlack = async ex => {
  if (dev) {
    logger.error(ex)
  } else {
    const icon = 'https://api.slack.com/img/blocks/bkb_template_images/notificationsWarningIcon.png'
    await slackMessage(pkgChannel, pkgName, {
      text: ex.message,
      blocks: [
        {
          type: 'context',
          elements: [ { type: 'image', image_url: icon, alt_text: 'ERROR' }, { type: 'mrkdwn', text: `*${ex.message}*` } ]
        },
        { type: 'section', text: { type: 'mrkdwn', text: ex.stack ? ex.stack : '' } }
      ]
    })
  }
}
// const cron = require('node-cron')
// const moment = require('moment')
// const { WebClient } = require('@slack/web-api')

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
app.get('/register-bot/:service?/:room?', require('./route-bot/oauth'))
app.put('/:service/:room', require('./route-bot/notify'))

// API router
app.get('/api/service/dashboard', require('./route-db/service/dashboard'))
app.post('/api/service', require('./route-db/service/new'))
app.get('/api/check/stats', require('./route-check/stats'))

logger.log(`MongoDB 'LINE-BOT' Connecting...`)
mongo.open().then(async () => {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  if (dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }

  app.use(nuxt.render)
  await app.listen(port, host)
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
