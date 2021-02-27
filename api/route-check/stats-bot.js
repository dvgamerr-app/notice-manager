const dayjs = require('dayjs')
const { notice } = require('@touno-io/db/schema')

const getStats = async (botname) => {
  const date = dayjs().startOf('month')
  const { LineOutbound } = notice.get()

  const push = await LineOutbound.countDocuments({
    botname,
    type: { $ne: 'notify' },
    created: { $gte: date.toISOString() }
  })

  const reply = await LineOutbound.countDocuments({
    botname,
    type: 'replyToken',
    created: { $gte: date.toISOString() }
  })

  return { usage: push, limited: 1000, reply, push, updated: dayjs().toDate() }
}

module.exports = async (req) => {
  const { name } = req.params
  const { LineBot } = notice.get()
  if (!name) {
    const data = []
    for await (const { _id, botname } of await LineBot.find({ active: true })) {
      const stats = await getStats(botname)
      await LineBot.updateOne({ _id }, { $set: { options: { stats } } })
      data.push(stats)
    }
    return data
  }

  const bot = await LineBot.findOne({ botname: name })
  if (!bot) { return {} }

  let stats = bot.options.stats
  // if (dayjs().diff(dayjs(bot.options.stats.updated), 'hour') > 23) {
  stats = await getStats(bot.botname)
  await LineBot.updateOne({ _id: bot._id }, { $set: { options: { stats } } })
  // }
  return stats
}
