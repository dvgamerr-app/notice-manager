import express from 'express'
import spdy from 'spdy'
import cron from 'node-cron'
import debuger from '@touno-io/debuger'
import bodyParser from 'body-parser'
import { Nuxt, Builder } from 'nuxt'
import { readFileSync } from 'fs'
// Import and Set Nuxt.js options
import pkg from '../package.json'
import config from '../nuxt.config.js'
import mongo from './line-bot'
import getEnv from "./get-env";
import { notifyLogs } from './helper'
import { lineInitilize, cmdExpire, loggingPushMessage } from './helper/schedule'

import postBotHandler from './route-bot/webhook'
import getRegisterBotServiceRoomHandler from './route-bot/oauth'
import putServiceRoomHandler from './route-bot/notify'
import putRevokeServiceRoomHandler from './route-bot/revoke'
import getServiceDashboardHandler from './route-db/service/dashboard'
import postServicehandler from './route-db/service/new'
import postCheckHandler from './route-db/service/check'
import postUpdateHandler from './route-db/service/update'
import getCheckStats from './route-check/stats'
import getStatsBot from './route-check/stats-bot'
import getStatsSlack from './route-check/stats-slack'

import putBotMessageHandler from './route-bot/push-message'
import putBotFlexHandler from './route-bot/push-flex'
// import putSlackMessageHandler from './route-bot/push-slack'
import putWebhookMessageHandler from './route-bot/push-webhook'
import postWebhookNotifyHandler from './route-bot/webhook/post-notify'

import getBotCMDHandler from './route-db/bot-cmd'
import getBotInboundHandler from './route-db/inbound'
import getBotOutboundHandler from './route-db/outbound'

const getHealthStatusHandler = (req, res) => res.sendStatus(200)
const app = express()
const port = getEnv('PORT') || 4000
const host = getEnv('HOST') || '0.0.0.0'
const dev = !(getEnv('NODE_ENV') === 'production')
const logger = debuger(pkg.title)

if (!getEnv('MONGODB_URI')) throw new Error('Mongo connection uri is undefined.')

const bodyOptions = { limit: '50mb', extended: true }
// parse application/x-www-form-urlencoded and application/jsons
app.use(bodyParser.urlencoded(bodyOptions))
app.use(bodyParser.json(bodyOptions))

app.use('/_health', getHealthStatusHandler)
app.post('/:bot', postBotHandler)
app.put('/:bot/:to?', putBotMessageHandler)
app.put('/flex/:name/:to', putBotFlexHandler)
// app.put('/slack/mii/:channel', putSlackMessageHandler)
app.put('/hook/:type/:webhook', putWebhookMessageHandler)
app.post('/webhook/:website/:name', postWebhookNotifyHandler)

// API Get Database
app.get('/db/:bot/cmd', getBotCMDHandler)
app.post('/db/:bot/cmd/:id', getBotCMDHandler)
app.get('/db/:bot/inbound', getBotInboundHandler)
app.get('/db/:bot/outbound', getBotOutboundHandler)

// API Notify
app.get('/register-bot/:service?/:room?', getRegisterBotServiceRoomHandler)
app.put('/notify/:service/:room', putServiceRoomHandler)
app.put('/revoke/:service/:room', putRevokeServiceRoomHandler)

// API router
app.get('/api/service/dashboard', getServiceDashboardHandler)
app.post('/api/service/check', postCheckHandler)
app.post('/api/service/update', postUpdateHandler)
app.post('/api/service', postServicehandler)
app.get('/api/check/stats', getCheckStats)
app.get('/api/stats/bot', getStatsBot)
app.get('/api/stats/slack', getStatsSlack)

logger.log(`MongoDB 'LINE-BOT' Connecting...`)

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
    if (err) throw new Error(err)
  }).listen(port, host)
  logger.log(`listening port is ${port}.`)
  
  if (!dev) {
    await notifyLogs(`Server has listening port is ${port}.`)

    lineInitilize().catch(notifyLogs)
    cron.schedule('0 */3 * * *', () => lineInitilize().catch(notifyLogs), { })
    cron.schedule('* * * * *', () => cmdExpire().catch(notifyLogs))
    cron.schedule('5 0 * * *', () => loggingPushMessage().catch(notifyLogs))
  }
}).catch(ex => notifyLogs(ex).then(() => {
  process.exit()
}))
