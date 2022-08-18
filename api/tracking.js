const numeral = require('numeral')
const dayjs = require('dayjs')
const { notice } = require('@touno-io/db/schema')
const { monitorLINE } = require('./monitor')

const loggingExpire = async () => {
  const { LineOutbound, LineInbound, LineCMD } = notice.get() // LineInbound, LineOutbound, LineCMD,

  const dataIn = await LineInbound.deleteMany({
    created: {
      $lte: dayjs()
        .add(24 * -1, 'month')
        .toDate()
    }
  })
  const dataOut = await LineOutbound.deleteMany({
    created: {
      $lte: dayjs()
        .add(24 * -1, 'month')
        .toDate()
    }
  })
  const dataCmd = await LineCMD.deleteMany({
    created: {
      $lte: dayjs()
        .add(12 * -1, 'month')
        .toDate()
    }
  })
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
  for (const bot of await ServiceBot.find({ active: true }, null, {
    sort: { service: 1 }
  })) {
    const count = await LineOutbound.countDocuments({
      botname: bot.service,
      type: 'notify',
      created: { $gte: dayFrom, $lt: dayTo }
    })
    if (count > 0) {
      facts.push(` - ${bot.name} used ${count} times`)
    }
  }

  facts.push('*BOT*')
  for (const bot of await LineBot.find({ type: 'line' }, null, {
    sort: { botname: 1 }
  })) {
    const count = await LineOutbound.countDocuments({
      botname: bot.botname,
      type: { $in: ['group', 'user', 'room'] },
      created: { $gte: dayFrom, $lt: dayTo }
    })
    if (count > 0) {
      facts.push(` - ${bot.name} used ${count} times`)
    }
  }

  return facts
}

module.exports = {
  cmdExpire: async () => {
    const { LineCMD } = notice.get()
    await LineCMD.updateMany(
      {
        created: { $lte: dayjs().add(-3, 'minute').toDate() },
        executing: false,
        executed: false
      },
      {
        $set: { executed: true }
      }
    )
  },
  loggingPushMessage: async () => {
    const fect1 = await loggingStats()
    const fect2 = await loggingExpire()

    const body = `*Notice LINE* weekly stats.\n${fect1.join('\n')}${
      fect2 ? fect2.join('\n') : ''
    }`

    await monitorLINE(body)
  }
}
