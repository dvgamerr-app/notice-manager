const { readFileSync } = require('fs')

const express = require('express')
const spdy = require('spdy')
const cron = require('node-cron')
const debuger = require('@touno-io/debuger')
const bodyParser = require('body-parser')
const { Nuxt, Builder } = require('nuxt')
const Sentry = require('@sentry/node')

const pkg = require('../package.json')
const config = require('../nuxt.config.js')
const mongo = require('./line-bot')
const getEnv = require('./get-env')
const { notifyLogs } = require('./helper')
const { lineInitilize, cmdExpire, checkMongoConn, loggingPushMessage } = require('./helper/schedule')

Sentry.init({ dsn: process.env.SENTRY_DSN })

const app = express()
const port = getEnv('PORT') || 4000
const dev = !(getEnv('NODE_ENV') === 'production')
const logger = debuger(pkg.title)

if (!getEnv('MONGODB_URI')) { throw new Error('Mongo connection uri is undefined.') }

// parse application/x-www-form-urlencoded and application/jsons
const bodyOptions = { limit: '50mb', extended: true }
app.use(bodyParser.urlencoded(bodyOptions))
app.use(bodyParser.json(bodyOptions))

app.use(Sentry.Handlers.requestHandler())

// app.use('/_health', (req, res) => res.sendStatus(200))
// app.post('/:bot', require('./route-bot/webhook'))
// app.put('/:bot/:to?', require('./route-bot/push-message'))
// app.put('/flex/:name/:to', require('./route-bot/push-flex'))
// // app.put('/slack/mii/:channel', require('./route-bot/push-slack'))
// app.put('/hook/:type/:webhook', require('./route-bot/push-webhook'))
// app.post('/webhook/:botname/:userTo', require('./route-bot/webhook/post-notify'))

// // API Get Database
// app.get('/db/cmd', require('./route-db/bot-cmd'))
// app.get('/db/cmd/endpoint', require('./route-db/bot-endpoint'))
// app.get('/db/:bot/cmd', require('./route-db/bot-cmd'))
// app.post('/db/:bot/cmd/:id', require('./route-db/bot-cmd'))
// app.get('/db/:bot/inbound', require('./route-db/inbound'))
// app.get('/db/:bot/outbound', require('./route-db/outbound'))

// // API Notify
// app.get('/register-bot/:service?/:room?', require('./route-bot/oauth'))
// app.put('/notify/:service/:room', require('./route-bot/notify'))
// app.put('/revoke/:service/:room', require('./route-bot/revoke'))

// API router
// app.get('/api/service/dashboard', require('./route-db/service/dashboard'))
// app.post('/api/service/check', require('./route-db/service/check'))
// app.post('/api/service/update', require('./route-db/service/update'))
// app.post('/api/service', require('./route-db/service/new'))
// app.post('/api/bot', require('./route-db/bot/new'))
// app.get('/api/check/stats', require('./route-check/stats'))
// app.get('/api/stats/bot/:id', require('./route-check/stats-bot'))
// app.get('/api/stats/slack', require('./route-check/stats-slack'))

app.use(Sentry.Handlers.errorHandler())

logger.log('MongoDB LINE-BOT Connecting...')
mongo.open().then(async () => {
  // Init Nuxt.js
  const options = {}
  const nuxt = new Nuxt(config)
  if (dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    options.key = readFileSync('/certs/notice.touno.io.key')
    options.cert = readFileSync('/certs/notice.touno.io.crt')
    await nuxt.ready()
  }

  app.use(nuxt.render)
  // await app.listen(port, host)
  spdy.createServer(options, app, (err) => {
    if (err) { throw new Error(err) }
  }).listen(port, async () => {
    logger.log(`listening port is ${port}.`)

    if (!dev) {
      await notifyLogs(`Server has listening port is ${port}.`)
      lineInitilize().catch(notifyLogs)
      cron.schedule('0 */3 * * *', () => lineInitilize().catch(notifyLogs), { })
      cron.schedule('* * * * *', () => cmdExpire().catch(notifyLogs))
      cron.schedule('* * * * *', () => checkMongoConn().catch(notifyLogs))
      cron.schedule('5 0 * * *', () => loggingPushMessage().catch(notifyLogs))
    }
  })
}).catch((ex) => {
  Sentry.captureException(ex)
})
