const express = require('express')
const cron = require('node-cron')
const { notice } = require('@touno-io/db/schema')
const debuger = require('@touno-io/debuger')
const bodyParser = require('body-parser')
const { Nuxt, Builder } = require('nuxt')
const Sentry = require('@sentry/node')

const pkg = require('../package.json')
const config = require('../nuxt.config.js')
const getEnv = require('./get-env')
const { notifyLogs } = require('../api/helper')
const { lineInitilize, cmdExpire, checkMongoConn, loggingPushMessage } = require('../api/helper/schedule')

const app = express()
const dev = !(getEnv('NODE_ENV') === 'production')
const logger = debuger(pkg.title)

// parse application/x-www-form-urlencoded and application/jsons
const bodyOptions = { limit: '50mb', extended: true }
app.use(bodyParser.urlencoded(bodyOptions))
app.use(bodyParser.json(bodyOptions))

// app.use('/health', (req, res) => res.sendStatus(200))
// app.post('/:bot', require('./route-bot/webhook'))
// app.put('/:bot/:to?', require('./route-bot/push-message'))
// app.put('/flex/:name/:to', require('./route-bot/push-flex'))
// app.put('/slack/mii/:channel', require('./route-bot/push-slack'))
app.put('/hook/:type/:webhook', require('../api/route-bot/push-webhook'))
app.post('/webhook/:botname/:userTo', require('../api/line-bot/webhook/post-notify'))
app.get('/webhook/:id', require('../api/line-bot/webhook/get-body'))

// API Get Database
app.get('/db/cmd', require('../api/route-db/bot-cmd'))
app.get('/db/cmd/endpoint', require('../api/route-db/bot-endpoint'))
app.get('/db/:bot/cmd', require('../api/route-db/bot-cmd'))
app.post('/db/:bot/cmd/:id', require('../api/route-db/bot-cmd'))
app.get('/db/:bot/inbound', require('../api/route-db/inbound'))
app.get('/db/:bot/outbound', require('../api/route-db/outbound'))

// API Notify
app.get('/register/:service?/:room?', require('../api/route-bot/oauth'))
app.put('/notify/:service/:room', require('../api/route-bot/notify'))
app.post('/notify/:service/:room', require('../api/route-bot/notify'))
app.put('/revoke/:service/:room', require('../api/route-bot/revoke'))

// API router
app.get('/api/service/dashboard', require('../api/route-db/service/dashboard'))
app.post('/api/service/check', require('../api/route-db/service/check'))
app.post('/api/service/update', require('../api/route-db/service/update'))
app.post('/api/service', require('../api/route-db/service/new'))
app.post('/api/bot', require('../api/route-db/bot/new'))
app.get('/api/check/stats', require('../api/route-check/stats'))
app.get('/api/stats/bot/:id', require('../api/route-check/stats-bot'))
app.get('/api/stats/slack', require('../api/route-check/stats-slack'))

// Init Nuxt.js
const nuxt = new Nuxt(config)

const nuxtClient = async () => {
  // Build only in dev mode
  if (dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }
  logger.log('Nuxtjs ready...')
  await nuxt.ready()
  Sentry.init({ dsn: process.env.SENTRY_DSN })
  logger.log('MongoDB db-notice connecting...')
  return notice.open()
}

nuxtClient().then(() => {
  app.use((req, res, next) => {
    res.setHeader('X-Developer', '@dvgamerr')
    next()
  })
  app.use(nuxt.render)

  const { host, port } = nuxt.options.server
  app.listen(port, host, () => {
    logger.log(`listening ${host} port is ${port}.`)
  })

  if (!dev) {
    lineInitilize().catch(notifyLogs)
    cron.schedule('0 */3 * * *', () => lineInitilize().catch(notifyLogs), { })
    cron.schedule('* * * * *', () => cmdExpire().catch(notifyLogs))
    cron.schedule('* * * * *', () => checkMongoConn().catch(notifyLogs))
    cron.schedule('5 0 * * *', () => loggingPushMessage().catch(notifyLogs))
  }
}).catch((ex) => {
  logger.error(ex)
  Sentry.captureException(ex)
}).finally(() => {
  logger.success('Nuxt.js compiled')
})

// mongo.open().then(async () => {
//   // Init Nuxt.js
//   const options = {}
//   const nuxt = new Nuxt(config)
//   if (dev) {
//     const builder = new Builder(nuxt)
//     await builder.build()
//   } else {
//     // options.key = readFileSync('/certs/notice.touno.io.key')
//     // options.cert = readFileSync('/certs/notice.touno.io.crt')
//     await nuxt.ready()
//   }

//   app.use(nuxt.render)
//   // await app.listen(port, host)
//   spdy.createServer(options, app, (err) => {
//     if (err) { throw new Error(err) }
//   }).listen(port, async () => {
//     logger.log(`listening port is ${port}.`)

//     if (!dev) {
//       await notifyLogs(`Server has listening port is ${port}.`)
//       lineInitilize().catch(notifyLogs)
//       cron.schedule('0 */3 * * *', () => lineInitilize().catch(notifyLogs), { })
//       cron.schedule('* * * * *', () => cmdExpire().catch(notifyLogs))
//       cron.schedule('* * * * *', () => checkMongoConn().catch(notifyLogs))
//       cron.schedule('5 0 * * *', () => loggingPushMessage().catch(notifyLogs))
//     }
//   })
// }).catch((ex) => {
//   Sentry.captureException(ex)
// })
