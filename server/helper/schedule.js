const numeral = require('numeral')
const moment = require('moment')
const axios = require('axios')
const Sentry = require('@sentry/node')
const mongo = require('../line-bot')
const { notifyLogs } = require('./index')

const loggingExpire = async () => {
  const { LineOutbound, LineInbound, LineCMD } = mongo.get() // LineInbound, LineOutbound, LineCMD,

  const dataIn = await LineInbound.deleteMany({ created: { $lte: moment().add(24 * -1, 'month').toDate() } })
  const dataOut = await LineOutbound.deleteMany({ created: { $lte: moment().add(24 * -1, 'month').toDate() } })
  const dataCmd = await LineCMD.deleteMany({ created: { $lte: moment().add(12 * -1, 'month').toDate() } })
  const rows = dataIn.n + dataOut.n + dataCmd.n
  return rows > 0 ? [
    '',
    '---------------------------------------------------------',
    'Logging documents delete if over year.',
    ` - Delete it ${numeral(rows).format('0,0')} rows.`
  ] : null
}

const loggingStats = async () => {
  const { LineBot, ServiceBot, LineOutbound } = mongo.get()
  const dayFrom = moment().startOf('day').add(-1, 'day').toDate()
  const dayTo = moment().startOf('day').toDate()
  const facts = []

  facts.push('*Notify*')
  for (const bot of (await ServiceBot.find({ active: true }, null, { sort: { service: 1 } }))) {
    const count = await LineOutbound.countDocuments({
      botname: bot.service,
      type: 'notify',
      created: { $gte: dayFrom, $lt: dayTo }
    })
    if (count > 0) { facts.push(` - ${bot.name} used ${count} times`) }
  }

  facts.push('*BOT*')
  for (const bot of (await LineBot.find({ type: 'line' }, null, { sort: { botname: 1 } }))) {
    const count = await LineOutbound.countDocuments({
      botname: bot.botname,
      type: { $in: ['group', 'user', 'room'] },
      created: { $gte: dayFrom, $lt: dayTo }
    })
    if (count > 0) { facts.push(` - ${bot.name} used ${count} times`) }
  }

  return facts
}

module.exports = {
  cmdExpire: async () => {
    const { LineCMD } = mongo.get()
    await LineCMD.updateMany({ created: { $lte: moment().add(-3, 'minute').toDate() }, executing: false, executed: false }, {
      $set: { executed: true }
    })
  },
  loggingPushMessage: async () => {
    const fect1 = await loggingStats()
    const fect2 = await loggingExpire()

    const body = `[Heroku] *LINE-Notify* daily stats.\n${fect1.join('\n')}${fect2 ? fect2.join('\n') : ''}`

    await notifyLogs(body)
  },
  checkMongoConn: async () => {
    await mongo.open()
    if (!mongo.connected()) {
      Sentry.captureMessage('MongoDB Connection fail.', Sentry.Severity.Critical)
      process.exit(0)
    }
  },
  lineInitilize: async () => {
    const { LineBot } = mongo.get()
    const date = moment().add(-1, 'day')

    const data = await LineBot.find({ type: 'line' })
    for (const line of data) {
      const opts = { headers: { Authorization: `Bearer ${line.accesstoken}` } }

      const { data: quota } = await axios('https://api.line.me/v2/bot/message/quota', opts)
      const { data: consumption } = await axios('https://api.line.me/v2/bot/message/quota/consumption', opts)
      const { data: reply } = await axios(`https://api.line.me/v2/bot/message/delivery/reply?date=${date.format('YYYYMMDD')}`, opts)
      const { data: push } = await axios(`https://api.line.me/v2/bot/message/delivery/push?date=${date.format('YYYYMMDD')}`, opts)

      const stats = {
        usage: consumption.totalUsage,
        limited: quota.type === 'limited' ? quota.value : 0,
        reply: reply.status === 'ready' ? reply.success : reply.status,
        push: push.status === 'ready' ? push.success : push.status,
        updated: date.toDate()
      }
      await LineBot.updateOne({ _id: line._id }, { $set: { options: { stats } } })
    }
  }
}
