import express from 'express'
import cron from 'node-cron'
import debuger from '@touno-io/debuger'
import bodyParser from 'body-parser'
import { Nuxt, Builder } from 'nuxt'

// Import and Set Nuxt.js options
import pkg from '../package.json'
import config from '../nuxt.config.js'
import mongo from './line-bot'
import { slackMessage, slackError } from './helper'
import { lineInitilize, cmdExpire, statsPushMessage } from './helper/schedule'

import postBotHandler from './route-bot/webhook'
import getRegisterBotServiceRoomHandler from './route-bot/oauth'
import putServiceRoomHandler from './route-bot/notify'
import putRevokeServiceRoomHandler from './route-bot/revoke'
import getServiceDashboardHandler from './route-db/service/dashboard'
import postServicehandler from './route-db/service/new'
import postCheckHandler from './route-db/service/check'
import postUpdateHandler from './route-db/service/update'
import getCheckStats from './route-check/stats'

import putBotMessageHandler from './route-bot/push-message'
import putSlackMessageHandler from './route-bot/push-slack'

import getBotCMDHandler from './route-db/bot-cmd'
import getBotInboundHandler from './route-db/inbound'
import getBotOutboundHandler from './route-db/outbound'

const getHealthStatusHandler = (req, res) => res.sendStatus(200)
const app = express()
const port = process.env.PORT || 4000
const host = process.env.HOST || '127.0.0.1'
const dev = !(process.env.NODE_ENV === 'production')
const pkgChannel = 'api-line-bot'
const pkgName = `LINE-BOT v${pkg.version}`
const logger = debuger(pkg.title)

// const moment = require('moment')
// const { WebClient } = require('@slack/web-api')

if (!process.env.MONGODB_URI) throw new Error('Mongo connection uri is undefined.')
if (!process.env.SLACK_TOKEN) throw new Error('Token slack is undefined.')
if (!process.env.LINE_CLIENT || !process.env.LINE_SECRET) throw new Error('LINE secret is undefined.')
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/jsons
app.use(bodyParser.json())

app.post('/:bot', postBotHandler)
app.put('/:bot/:to?', putBotMessageHandler)
// app.put('/flex/:name/:to', require('./route-bot/push-flex'))
app.put('/slack/:channel', putSlackMessageHandler)

app.get('/db/:bot/cmd', getBotCMDHandler)
app.post('/db/:bot/cmd/:id', getBotCMDHandler)
app.get('/db/:bot/inbound', getBotInboundHandler)
app.get('/db/:bot/outbound', getBotOutboundHandler)

app.use('/_health', getHealthStatusHandler)
app.get('/register-bot/:service?/:room?', getRegisterBotServiceRoomHandler)
app.put('/notify/:service/:room', putServiceRoomHandler)
app.put('/revoke/:service/:room', putRevokeServiceRoomHandler)

// API router
app.get('/api/service/dashboard', getServiceDashboardHandler)
app.post('/api/service/check', postCheckHandler)
app.post('/api/service/update', postUpdateHandler)
app.post('/api/service', postServicehandler)
app.get('/api/check/stats', getCheckStats)

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
  if (!dev) {
    lineInitilize().catch(slackError)
    cron.schedule('0 */3 * * *', () => lineInitilize().catch(slackError), { })
    cron.schedule('* * * * *', () => cmdExpire().catch(slackError))
    cron.schedule('0 0 * * *', () => statsPushMessage().catch(slackError))
    cron.schedule('0 3 * * *', async () => {
      await slackMessage(pkgChannel, pkgName, '*Heroku* server has terminated yourself.')
      process.exit()
    })
    await slackMessage(pkgChannel, pkgName, '*Heroku* server has `rebooted`, and ready.')
  }
}).catch(ex => slackError(ex).then(() => {
  process.exit()
}))
