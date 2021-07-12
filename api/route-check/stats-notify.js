const dayjs = require('dayjs')
const { notice } = require('@touno-io/db/schema')

const getStats = async (botname) => {
  const date = dayjs().startOf('month')
  const { LineOutbound } = notice.get()

  const push = await LineOutbound.countDocuments({
    botname,
    type: 'notify',
    created: { $gte: date.toISOString() }
  })

  return { usage: push, limited: 1000, reply: 0, push: push || 0, updated: dayjs().toDate() }
}

module.exports = async (req) => {
  const { name } = req.params
  const { ServiceBot } = notice.get()
  const bot = await ServiceBot.findOne({ service: name })
  if (!bot) { return {} }

  return await getStats(bot.service)
}
