const numeral = require('numeral')
const dayjs = require('dayjs')
const axios = require('axios')
const { notice } = require('@touno-io/db/schema')
const { loggingLINE } = require('./logging')

const loggingExpire = async () => {
  const { LineOutbound, LineInbound, LineCMD } = notice.get() // LineInbound, LineOutbound, LineCMD,

  const dataIn = await LineInbound.deleteMany({ created: { $lte: dayjs().add(24 * -1, 'month').toDate() } })
  const dataOut = await LineOutbound.deleteMany({ created: { $lte: dayjs().add(24 * -1, 'month').toDate() } })
  const dataCmd = await LineCMD.deleteMany({ created: { $lte: dayjs().add(12 * -1, 'month').toDate() } })
  const rows = dataIn.n + dataOut.n + dataCmd.n
  return rows > 0
    ? [
        '',
        '---------------------------------------------------------',
        'Logging documents delete if over year.',
    ` - Delete it ${numeral(rows).format('0,0')} rows.`
      ]
    : null
}

const loggingStats = async () => {
  const { LineBot, ServiceBot, LineOutbound } = notice.get()
  const dayFrom = dayjs().startOf('day').add(-1, 'day').toDate()
  const dayTo = dayjs().startOf('day').toDate()
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
    const { LineCMD } = notice.get()
    await LineCMD.updateMany({ created: { $lte: dayjs().add(-3, 'minute').toDate() }, executing: false, executed: false }, {
      $set: { executed: true }
    })
  },
  loggingPushMessage: async () => {
    const fect1 = await loggingStats()
    const fect2 = await loggingExpire()

    const body = `[Heroku] *LINE-Notice* daily stats.\n${fect1.join('\n')}${fect2 ? fect2.join('\n') : ''}`

    await loggingLINE(body)
  },
  lineInitilize: async () => {
    try {
      await notice.open()
      const { LineBot } = notice.get()
      const date = dayjs().add(-1, 'day')

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
    } catch (ex) {
      // eslint-disable-next-line no-console
      console.error(ex)
    }
  }
}
